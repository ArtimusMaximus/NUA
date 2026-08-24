const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Unifi = require('node-unifi');
const { PrismaClient, Prisma } = require('@prisma/client');
const schedule = require('node-schedule');
const customPORT = require('./globalSettings');
const fs = require('fs');
const { ezScheduleRoutes } = require('./Routes/scheduler_routes/ezScheduleRoutes'); // ezScheduleRoutes(app, unifi, prisma)
const { red } = require('./server_util_funcs/red');
const { jobFunction } = require('./server_util_funcs/jobfunction');
const { updateOneTimeSchedule } = require('./ez_sched_funcs/update_ez_schedules/updateOneTimeSchedule');
const { updateRecurringSchedule } = require('./ez_sched_funcs/update_ez_schedules/updateRecurringSchedule');
const { serverLogger } = require('./server_util_funcs/server_log_utils/serverLogger');
const { validateCron } = require('./server_util_funcs/validateCron');
const { consoleReader } = require('./server_util_funcs/server_log_utils/consoleReader');
const { logger } = require('./server_util_funcs/server_log_utils/customLogger');
const { cronBonusTimeEndJobReinitiation } = require('./server_util_funcs/cronBonusTimeEndJobReinitiation');
const { easyBonusTimeEndJobReinitiation } = require('./server_util_funcs/easyBonusTimeEndJobReinitiation');
const { minutesHoursToMilli } = require('./server_util_funcs/minutesHoursToMilli');
const { convertToMilitaryTime } = require('./server_util_funcs/convert_to_military_time');
const { dateFromDateString } = require('./server_util_funcs/ez_sched_utils/dateFromDateString');
const { startTimeout, endTimeout, timeoutMap } = require('./server_util_funcs/start_&_clear_timeouts/start_end_timeouts');
const { stopBonusTime } = require('./server_util_funcs/stop_bonus_time/stopBonusTimeViaToggleOff');
const { encrypt, decrypt, isEncryptionEnabled, generateAndSaveKey } = require('./server_util_funcs/credentialCrypto');
const { version: appVersion } = require('./package.json');
const schedulerService = require('./scheduler/service'); // Central scheduler service (Phase 3)
const { startBonusTime, deleteBonusToggles, restartPausedJobs: bonusRestartPausedJobs, clearBonusTimeExpiry, reArmDeviceBonusOnBoot } = require('./scheduler/bonusScheduler'); // Bonus time scheduler (Phase 5)
const { startBonusRule, endBonusRule, reArmTrafficBonusOnBoot } = require('./scheduler/trafficBonusScheduler'); // Traffic rule bonus scheduler
const { addTrafficRuleSchedule, toggleTrafficRuleSchedule, deleteTrafficRuleSchedule, reArmTrafficRuleSchedulesOnBoot } = require('./scheduler/trafficRuleScheduler'); // Traffic rule schedules
const asyncHandler = require('./server_util_funcs/asyncHandler');
const auth = require('./server_util_funcs/auth');
const { isDiagnosticsEnabled } = require('./server_util_funcs/diagnostics');

const prisma = new PrismaClient();

// Send a 500 response. The raw error message is only exposed when diagnostics
// are enabled (Settings modal); otherwise a generic message is returned and the
// full error is logged server-side only.
async function sendError(res, error, message = 'Internal server error.') {
  console.error(error);
  try {
    const diag = await isDiagnosticsEnabled(prisma);
    return res.status(500).json(diag
      ? { error: message, details: error && error.message }
      : { error: message });
  } catch (e) {
    return res.status(500).json({ error: message });
  }
}

// Resolved project root directory (avoids fragile string slicing of process.cwd())
const PROJECT_ROOT = path.resolve(__dirname, '..');

// create server & add middleware
const app = express();

// Restrict cross-origin access. Same-origin requests (no Origin header, i.e.
// the app's own frontend served from this Express server) are always allowed.
// Cross-origin requests are blocked unless explicitly allowed via
// NUA_CORS_ORIGIN (comma-separated list of allowed origins).
const allowedOrigins = (process.env.NUA_CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) {
      return cb(null, true);
    }
    return cb(null, allowedOrigins.includes(origin));
  }
}));
// Security headers (CSP, X-Content-Type-Options, frame protection, etc.).
// The app runs over plain HTTP on local networks, so we drop the CSP
// 'upgrade-insecure-requests' directive -- it rewrites http:// asset requests
// to https://, which breaks page loading when there is no TLS in front.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'upgrade-insecure-requests': null,
    },
  },
}));
// Explicit JSON body limit (default is 100kb; traffic-rule payloads can exceed it)
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(PROJECT_ROOT, 'dist')));
consoleReader(schedule);

// ---- Error handling & optional authentication (route registration layer) ----
// Express 4 does not catch rejected promises from async handlers, which leaves
// client requests hanging with no response. Wrap every registered handler in
// asyncHandler so rejections flow to the global error middleware below.
// When auth is enabled (NUA_AUTH_ENABLED=true), also inject requireAuth in front
// of every non-public route. Public routes (login/logout/auth-status/health and
// the SPA fallback) stay reachable so the login page can always be served.
const _appGet = app.get.bind(app);
const _appPost = app.post.bind(app);
const _appPut = app.put.bind(app);
const _appDelete = app.delete.bind(app);

function registerWithAuth(method, path, handlers) {
  const wrapped = handlers.map((h) => asyncHandler(h));
  const protectedRoute = auth.isEnabled() && !auth.PUBLIC_PATHS.has(path);
  return protectedRoute ? [auth.requireAuth, ...wrapped] : wrapped;
}

app.get = (p, ...handlers) => handlers.length ? _appGet(p, ...registerWithAuth('get', p, handlers)) : _appGet(p);
app.post = (p, ...handlers) => handlers.length ? _appPost(p, ...registerWithAuth('post', p, handlers)) : _appPost(p);
app.put = (p, ...handlers) => handlers.length ? _appPut(p, ...registerWithAuth('put', p, handlers)) : _appPut(p);
app.delete = (p, ...handlers) => handlers.length ? _appDelete(p, ...registerWithAuth('delete', p, handlers)) : _appDelete(p);

// Rate-limit the login endpoint (brute-force protection).
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later.' } });
app.use('/login', loginLimiter);

// ---- Auth routes ----
app.post('/login', auth.login);
app.post('/logout', auth.logout);
app.get('/auth-status', auth.status);


// Rate limiters (Fix 11)
const settingsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many requests, please try again later.' } });
const actionLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: 'Too many requests, please try again later.' } });
app.use('/savesitesettings', settingsLimiter);
app.use('/updatesitesettings', settingsLimiter);
app.use('/testconnection', settingsLimiter);
app.use('/updatemacaddressstatus', actionLimiter);
app.use('/blockallmacs', actionLimiter);
app.use('/unblockallmacs', actionLimiter);
app.use('/unblockmac', actionLimiter);
app.use('/addmacaddresses', actionLimiter);

function handleLoginError(error) {
  if (error !== undefined) {
    console.log('handleLoginErrors: \t');
    console.log('Error \t', error);
    console.log(error?.code);
    console.log(error?.response?.data?.code);
    console.log(error?.response?.data?.message);
  }
  red('There was an error logging in with your credentials. Set them up in /sitesettings!', 'cyan');
}
// function writeJSONApps(successfulData) {
//     // const data = JSON.stringify(successfulData);
//     const data = successfulData;
//     fs.appendFile('successfulIds.js', `${data}\n`, (error) => {
//         if (error) {
//             console.error(error);
//         } else {
//             console.log('The file has been saved!');
//         }
//     });
// }
function writeJSONApps(successfulData) {
  // const data = JSON.stringify(successfulData);
  successfulData.forEach((item) => {
    const data = JSON.stringify(item) + '\n';
    try {
      fs.appendFileSync('successfulIds.js', data);
    } catch (error) {
      console.error('Error writing item: ', item, error);
    }
  });

}

// initial check for existing credentials in db
const checkForCredentials = async () => {
  try {
    const creds = await prisma.credentials.findUnique({
      where: {
        id: 1
      }
    });
    if (creds === null) {
      const initialSiteCredentials = await prisma.credentials.create({
        data: {
          username: '',
          password: '',
          hostname: '',
          port: 443,
          sslverify: false,
          refreshRate: 60000,
          theme: 'dark',
          defaultPage: '/',
          initialSetup: true
        }
      });
    } else {
      red('Credentials already exist!', 'teal');
      return;
    }
  } catch (error) {
    console.error(error);
  }
};
checkForCredentials();

// unifi connection instance // original
// let unifi;
// async function logIntoUnifi(hostname, port, sslverify, username, password) {
//     unifi = new Unifi.Controller({ hostname: hostname, port: port, sslverify: sslverify });
//     const loginData = await unifi.login(username, password);
//     if (loginData) {
//         return { unifi, validCredentials: true };
//     } else {
//         return { validCredentials: false };
//     }
// }

// new
async function logIntoUnifi(hostname, port, sslverify, username, password) {
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  isConnecting = true;
  try {
    unifi = new Unifi.Controller({hostname: hostname, port: port, sslverify: sslverify});
    const loginData = await unifi.login(username, password);
    if (loginData) {
      return { unifi, validCredentials: true };
    } else {
      return { validCredentials: false };
    }
  } finally {
    isConnecting = false;
  }
}

function isUnauthorizedUnifiError(error) {
  return error?.response?.status === 401 || error?.response?.data?.code === 401;
}

async function reAuthenticateUnifi() {
  const loginData = await fetchLoginInfo();
  if (!loginData?.hostname || !loginData?.username || !loginData?.password) {
    throw new Error('UniFi credentials not configured. Please configure credentials at /sitesettings');
  }

  const result = await logIntoUnifi(
    loginData.hostname,
    loginData.port,
    loginData.sslverify,
    loginData.username,
    loginData.password
  );

  if (!result?.validCredentials) {
    throw new Error('Failed to re-authenticate with UniFi controller');
  }

  return true;
}

async function withUnifiRetry(requestFn) {
  if (!unifi) {
    await reAuthenticateUnifi();
  }

  try {
    return await requestFn();
  } catch (error) {
    if (!isUnauthorizedUnifiError(error)) {
      throw error;
    }

    console.warn('UniFi request returned 401. Attempting to re-authenticate and retry once.');
    await reAuthenticateUnifi();
    return requestFn();
  }
}

// fetch login arguments // original
// let loginData;
// const fetchLoginInfo = async () => {
//     const getAdminLoginInfo = async () => {
//         try {
//           const adminLogin = await prisma.credentials.findUnique({ where: { id: 1 }});
//         //   console.log('adminLogin \t', adminLogin);
//         //   loginData = adminLogin.pop();
//           loginData = adminLogin;
//           return loginData;
//         } catch (error) {
//             if (error) {
//                 console.error('getAdminLoginInfo error in fetchLoginInfo: ', error);
//                 throw new Error('No credentials were found');
//             }
//         }
//     }
//     return getAdminLoginInfo();
// }

// new
const fetchLoginInfo = async () => {
  try {
    const loginData = await prisma.credentials.findUnique({ where: { id: 1 }});
    if (loginData) {
      return { ...loginData, password: decrypt(loginData.password) };
    } else {
      throw Error('Could NOT FETCH LOGIN DATA.');
    }
  } catch (error) {
    console.error('getAdminLoginInfo error in fetchLoginInfo: ', error);
    throw new Error('No credentials were found');
  }
};

let isConnecting = false;
let unifi;
const init = async () => {
  try {
    // Ensure credentials record exists
    await checkForCredentials();
        
    const loginData = await fetchLoginInfo();
        
    // Check if credentials are actually configured (not just empty) and initial setup is complete
    if (loginData && loginData.hostname && loginData.username && loginData.password && !loginData.initialSetup) {
      console.log('Attempting to connect to UniFi controller...');
      await logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password);
      console.log('✅ Successfully connected to UniFi controller');
    } else if (loginData && loginData.initialSetup) {
      console.log('⚠️ Initial setup required. Please complete setup at /sitesettings');
      unifi = null;
    } else {
      console.log('⚠️ UniFi credentials not configured. Please set them up at /sitesettings');
      unifi = null;
    }
        
    // Always initialize routes, even without UniFi connection
    ezScheduleRoutes(app, unifi, prisma, schedule, jobFunction);
        
  } catch (error) {
    console.error('⚠️ Could not establish UniFi connection:', error.message);
    console.log('🌐 Application will start without UniFi connection. Configure credentials at /sitesettings');
        
    // Set unifi to null and continue - app can still serve the web interface
    unifi = null;
    ezScheduleRoutes(app, unifi, prisma, schedule, jobFunction);
  }
};
init();
// console.log('unifi\t', unifi);

// info
//     .then(() => logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password))
//     .then(() => console.log('.then() => unifi \t'))
//     .catch((error) => console.error(error))

async function getBlockedUsers() {
  try {
    const blockedUsers = await withUnifiRetry(() => unifi.getBlockedUsers());
    if (blockedUsers === undefined) {
      return [];
    } else {
      return blockedUsers;
    }
  } catch (error) {
    if (isUnauthorizedUnifiError(error)) {
      console.warn('UniFi blocked-users request unauthorized (401). Returning empty list.');
      return [];
    }
    console.error('Error getting blocked users:', error.message);
    return [];
  }
}
async function blockMultiple(reqBodyArr) {
  if (!unifi) {
    throw new Error('UniFi controller not connected. Please configure credentials at /sitesettings');
  }
    
  for (const mac of reqBodyArr) {
    try {
      const result = await unifi.blockClient(mac);
      if (typeof result === 'undefined' || result.length <= 0) {
        throw new Error(`blockMultiple(): ${JSON.stringify(result)}`);
      } else {
        console.log(`Successfully blocked: ${mac}`);
      }
    } catch (error) {
      console.error(error);
    }
  }
}
async function unBlockMultiple(reqBodyArr) {
  if (!unifi) {
    throw new Error('UniFi controller not connected. Please configure credentials at /sitesettings');
  }
    
  for (const mac of reqBodyArr) {
    try {
      const result = await unifi.unblockClient(mac);
      if (typeof result === 'undefined' || result.length <= 0) {
        throw new Error(`blockMultiple(): ${JSON.stringify(result)}`);
      } else {
        console.log(`Successfully unblocked: ${mac}`);
      }
    } catch (error) {
      if (error) {
        throw error;
      }
    }
  }
}
async function unblockSingle(reqBodyMac) {
  if (!unifi) {
    throw new Error('UniFi controller not connected. Please configure credentials at /sitesettings');
  }
    
  try {
    const result = await unifi.unblockClient(reqBodyMac);
    if (typeof result === 'undefined' || result.length <= 0) {
      throw new Error(`Error blocking mac address: ${reqBodyMac}. ${JSON.stringify(result)}`);
    } else {
      console.log(`Successfully unblocked ${reqBodyMac}`);
    }
  } catch (error) {
    console.error(error);
  }
}
// Fix 14: blockSingle was missing — used in /devicegroups/:id/toggle
async function blockSingle(reqBodyMac) {
  if (!unifi) {
    throw new Error('UniFi controller not connected. Please configure credentials at /sitesettings');
  }
  try {
    const result = await unifi.blockClient(reqBodyMac);
    if (typeof result === 'undefined' || result.length <= 0) {
      throw new Error(`Error blocking mac address: ${reqBodyMac}. ${JSON.stringify(result)}`);
    } else {
      console.log(`Successfully blocked ${reqBodyMac}`);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
// Fix 8: MAC address validation helper
const MAC_REGEX = /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/;
function isValidMac(mac) {
  return typeof mac === 'string' && MAC_REGEX.test(mac);
}


// (async function() {
//     try {
//         const getMacAddress = await prisma.device.findMany();
//         const previousEzScheduleData = await prisma.easySchedule.findMany();

//         let matchingEZIds = [];
//         let newEZJobNames = [];
//         for (let i=0; i<previousEzScheduleData.length; i++) {
//             const matchedMacAddress = getMacAddress.find(
//                 (item) => item.id === previousEzScheduleData[i].deviceId
//             );
//             if (matchedMacAddress) {
//                 matchingEZIds.push({
//                     ...previousEzScheduleData[i],
//                     matchedMacAddress
//                 });
//             }
//         }
//         for (const data of matchingEZIds) {
//             const { date, hour, minute, ampm, oneTime, deviceId, blockAllow } = data;

//             console.log('data fetch checker\t', date, hour, minute, ampm, oneTime, deviceId, blockAllow);
//             // nodeOneTimeScheduleRule(data, unifi, prisma, jobFunction, schedule)
//             // let reInitiatedJob = schedule.scheduleJob(data.toggleSched, () => jobFunction(data.blockAllow, data.matchedMacAddress.macAddress, false, unifi, prisma));
//             // newEZJobNames.push({...data, jobName: reInitiatedJob.name})
//         }
//     } catch (error) {
//         console.error(error);
//     }
// })();



// (async function() {
//     // const path = '/v2/api/site/default/trafficrules';
//     const path = '/api/s/default/stat/sitedpi';
//     // const path = 'https://192.168.0.1/proxy/network/api/s/default/stat/sitedpi';
//     const timer = t => new Promise(res => setTimeout(res, t));
//     let result;
//     timer(2000)
//         .then(() => result = unifi?.customApiRequest(path, 'GET'))
//         .then(() => console.log(result))
// })();

// async function addEasySchedule(deviceId, dateTime, blockAllow, scheduleData, startNewJobTrue, prisma) {
//     const { month, day, minute, modifiedHour, ampm, date, oneTime, modifiedDaysOfTheWeek } = scheduleData;
//     const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } }); // deviceToSchedule.macAddress
//     try {
//         if (oneTime && startNewJobTrue) {
//             const addToDB = await prisma.easySchedule.create({ // create easySched
//                 data: {
//                     month: month,
//                     // days: day,
//                     minute: parseInt(minute),
//                     hour: modifiedHour,
//                     ampm: ampm,
//                     date: date,
//                     blockAllow: blockAllow,
//                     jobName: startNewJobTrue.name,
//                     toggleSched: true,
//                     oneTime: oneTime,
//                     device: {
//                         connect: { id: deviceToSchedule.id }
//                     },
//                 }
//             });
//         } else if (!oneTime && startNewJobTrue) {
//             const stringDays = convertDOWtoString(modifiedDaysOfTheWeek);
//             const addToDB = await prisma.easySchedule.create({ // create easySched
//                 data: {
//                     month: month,
//                     days: stringDays,
//                     minute: parseInt(minute),
//                     hour: modifiedHour,
//                     ampm: ampm,
//                     date: date,
//                     blockAllow: blockAllow,
//                     jobName: startNewJobTrue.name,
//                     toggleSched: true,
//                     oneTime: oneTime,
//                     device: {
//                         connect: { id: deviceToSchedule.id }
//                     },
//                 }
//             });
//         } else {
//             throw new Error("startNewJob false...");
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

// async function nodeOneTimeScheduleRule(data, unifi, prisma, jobFunction, schedule) {
//     const { date, hour, minute, ampm, modifiedDaysOfTheWeek, oneTime, deviceId, scheduletype } = data;
//     const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
//     const { year, month, day } = dateFromDateString(date);
//     const blockAllow = scheduletype;
//     const modifiedHour = convertToMilitaryTime(ampm, hour);

//     const scheduleData = {
//         year,
//         month,
//         day,
//         date,
//         minute,
//         ampm,
//         modifiedHour,
//         oneTime
//     };

//     const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
//     const startNewJobTrue = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
//     addEasySchedule(deviceId, dateTime, scheduletype, scheduleData, startNewJobTrue, prisma); // -- do easy schedule in end point, not in function?
//     return startNewJobTrue;
// }

// async function nodeScheduleRecurrenceRule(data, unifi, prisma, jobFunction, schedule) {
//     const { date, hour, minute, ampm, modifiedDaysOfTheWeek, deviceId, oneTime, scheduletype } = data;
//     const deviceToSchedule = await prisma.device.findUnique({ where: { id: deviceId } });
//     const { year, month, day } = dateFromDateString(date);
//     const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
//     const blockAllow = scheduletype;
//     const scheduleData = {
//         year,
//         month,
//         day,
//         date,
//         minute,
//         ampm,
//         modifiedHour,
//         modifiedDaysOfTheWeek,
//         oneTime
//     }
//     const rule = new schedule.RecurrenceRule();
//     const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
//     const daysOfTheWeek = modifiedDaysOfTheWeek;
//     rule.dayOfWeek = [...daysOfTheWeek];
//     rule.hour = hour;
//     rule.minute = minute;
//     const startNewJobTrue = schedule.scheduleJob(rule, () => jobFunction(blockAllow, deviceToSchedule?.macAddress, oneTime, unifi, prisma));
//     addEasySchedule(deviceId, dateTime, scheduletype, scheduleData, startNewJobTrue, prisma);
//     return startNewJobTrue;
// }





// Health check endpoint for Docker
app.get('/health', async (req, res) => {
  try {
    // Basic health check - verify database connection
    await prisma.$queryRaw`SELECT 1`;
        
    // Check if credentials are configured
    const credentials = await prisma.credentials.findUnique({ where: { id: 1 } });
    const isConfigured = credentials && !credentials.initialSetup;
        
    // Check UniFi connection status
    const unifiConnected = !!unifi;
        
    res.status(200).json({ 
      status: 'healthy',
      database: 'connected',
      configured: isConfigured,
      unifiConnected: unifiConnected,
      timestamp: new Date().toISOString(),
      version: appVersion,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      version: appVersion
    });
  }
});

// Database migration status endpoint for debugging
app.get('/debug/migration-status', async (req, res) => {
  try {
    // This endpoint is for debugging migration status
    // Note: This requires Prisma CLI to be available in production
    const { spawn } = require('child_process');
        
    const migrationCheck = spawn('npx', ['prisma', 'migrate', 'status'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
        
    let output = '';
    let errorOutput = '';
        
    migrationCheck.stdout.on('data', (data) => {
      output += data.toString();
    });
        
    migrationCheck.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
        
    migrationCheck.on('close', (code) => {
      res.json({
        migrationStatus: code === 0 ? 'up-to-date' : 'pending-or-error',
        exitCode: code,
        output: output,
        error: errorOutput,
        timestamp: new Date().toISOString()
      });
    });
        
    // Timeout after 10 seconds
    setTimeout(() => {
      migrationCheck.kill();
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'Migration status check timed out',
          timeout: true 
        });
      }
    }, 10000);
        
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check migration status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/getmacaddresses', async (req, res) => {
  try {
    const currentCredentials = await prisma.credentials.findUnique({
      where: {
        id: 1
      }
    });
    const { initialSetup } = currentCredentials;
        
    console.log('🔍 /getmacaddresses - initialSetup:', initialSetup, 'unifi connected:', !!unifi);

    if (!initialSetup) {
      const macData = await prisma.device.findMany({
        include: {
          deviceGroup: true
        }
      });
      let blockedUsers = [];
      let unifiSyncOk = false;

      // Read-only reconciliation: never mutate DB during refresh fetch.
      try {
        if (unifi) {
          const blockedUsersResponse = await withUnifiRetry(() => unifi.getBlockedUsers());
          blockedUsers = Array.isArray(blockedUsersResponse) ? blockedUsersResponse : [];
          unifiSyncOk = true;
        }
      } catch (blockedUsersError) {
        console.warn('Failed to refresh blocked users from UniFi, serving DB fallback:', blockedUsersError?.message || blockedUsersError);
      }

      let responseMacData = macData;
      if (unifiSyncOk) {
        const blockedMacSet = new Set(
          blockedUsers
            .filter((device) => device?.blocked === true && typeof device?.mac === 'string')
            .map((device) => device.mac)
        );

        responseMacData = macData.map((device) => ({
          ...device,
          active: !blockedMacSet.has(device.macAddress)
        }));
      }

      return res.json({
        macData: responseMacData,
        blockedUsers,
        stale: !unifiSyncOk,
        stateSource: unifiSyncOk ? 'unifi-reconciled' : 'database-fallback'
      });
    } else {
      console.log('⚠️ Initial setup flag is true, checking if UniFi is actually connected...');
            
      // If UniFi is connected but initialSetup is still true, fix the flag
      if (unifi) {
        console.log('🔧 UniFi is connected but initialSetup is true - fixing database flag');
        await prisma.credentials.update({ 
          where: { id: 1 }, 
          data: { initialSetup: false } 
        });
                
        // Now proceed with normal device loading
        let macData = await prisma.device.findMany({
          include: {
            deviceGroup: true
          }
        });
        const blockedUsers = await getBlockedUsers();
                
        return res.json({
          macData: macData,
          blockedUsers: blockedUsers,
          stale: false,
          stateSource: 'unifi-reconciled'
        });
      } else {
        throw new Error('This is the initial setup, redirect.');
      }
    }
  } catch (error) {
    console.error('error in /getmacaddresses: \t', error);
    handleLoginError(error);
    const diag = await isDiagnosticsEnabled(prisma);
    return res.status(401).json({
      success: false,
      error: 'Failed to fetch device state. Please verify site settings.',
      ...(diag ? { details: error?.message || 'Unknown error' } : {})
    });
  }
});

app.get('/pingmacaddresses', async (req, res) => {
  try {
    const checkForInitial = await prisma.credentials.findUnique({ where: { id: 1 } });
    const { initialSetup } = checkForInitial;
    const sendFakeEventObj = { refresh: true };

    if (initialSetup === false) {
      // const refreshRate = checkForInitial.refreshRate;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendUpdate = () => {
        res.write(`data: ${JSON.stringify({ sendFakeEventObj })}\n\n`);
      };
      sendUpdate();
      let refreshRate = checkForInitial.refreshRate;

      if (typeof refreshRate !== 'number') {
        refreshRate = 60000;
      }
      const intervalId = setInterval(sendUpdate, refreshRate);


      req.on('close', () => {
        clearInterval(intervalId);
      });
    }
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.post('/addmacaddresses', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { name, macAddress } = req.body;
  if (!isValidMac(macAddress)) {
    return res.status(400).json({ error: 'Invalid MAC address format.' });
  }
  const blockedUsers = await getBlockedUsers();

  const filterBlockedUsers = blockedUsers.filter((device) => {
    return device.mac === macAddress;
  });

  try {
    if (!filterBlockedUsers.length) {

      const newMacAddress = await prisma.device.create({
        data: {
          name,
          macAddress,
          active: true
        },
      });
      res.send({ newMacAddress });
    } else {

      const newMacAddress = await prisma.device.create({
        data: {
          name,
          macAddress,
          active: false
        },
      });
      res.send({ newMacAddress });
    }
  } catch (error) {
    console.error('Error adding device:', error);
    await sendError(res, error, 'There was an error adding the device.');
  }

  // try {
  //     const newMacAddress = await prisma.device.create({
  //         data: {
  //             name,
  //             macAddress,
  //             active: true
  //         },
  //     });
  //     res.send({ newMacAddress });
  // } catch (error) {
  //     if (error) throw error;
  //     res.send({ message: "There was an error."})
  // }
});

app.post('/addtodevicelist', async (req, res) => {
  const { customName, hostname, oui, mac, blocked } = req.body; // blocked: true
  if (!isValidMac(mac)) {
    return res.status(400).json({ error: 'Invalid MAC address format.' });
  }
  try {
    let name;
    if (customName) {
      name = customName;
    } else if (hostname) {
      name = hostname;
    } else if (mac) {
      name = mac;
    } else {
      name = 'Unnamed Device';
    }
    const deviceAddedToList = await prisma.device.create({
      data: {
        name: name,
        macAddress: mac,
        active: !blocked
      },
    });
    res.send({ deviceAddedToList });
  } catch (error) {
    console.error(error);
  }
});

app.post('/getdeviceinfo', async (req, res) => { // specific device information
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { id } = req.body;

  try {
    // getBlockedUsers();
    const getClientDevices = await unifi.getClientDevices();
    // console.log('Client Data: ', getClientDevices);
    const getDeviceInfo = await prisma.device.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    console.log(getDeviceInfo);
    // getClientDevices.map((device) => {
    //     console.log(device.mac === getDeviceInfo.macAddress);
    // }); // investiage why pop os isnt listed on getClientDevices()
    const allData = getClientDevices.filter(device => device.mac === getDeviceInfo.macAddress);
    // console.log('allData ', allData);

    res.json(getDeviceInfo);
  } catch (e) {
    if (e) {
      throw e;
    }
  }
});

app.post('/getspecificdevice', async (req, res) => { // fetch individual device (cron manager)
  const { id } = req.body;
  try {
    const deviceInfo = await prisma.device.findUnique({
      where: {
        id: id
      }
    });
    res.json(deviceInfo);
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.put('/updatemacaddressstatus', async (req, res) => { // toggler
  try {
    // Check if UniFi is connected
    if (!unifi) {
      return res.status(503).json({ 
        error: 'UniFi controller not connected', 
        message: 'Please configure UniFi credentials at /sitesettings',
        success: false
      });
    }

    //bypass front end active for now
    const { id, macAddress, active, bonusTimeActive } = req.body;
    if (!isValidMac(macAddress)) {
      return res.status(400).json({ error: 'Invalid MAC address format.' });
    }
    if (timeoutMap.get(id)) {
      await stopBonusTime(id, true, schedule, prisma, unifi);
      res.json({ msg: 'Stop Bonus Time fired in updatemacaddressstatus'});
      return;
    }

    let unifiSuccess = false;
    let actualStatus = active;
    let operationMessage = '';
        
    try {
      if (active) {
        // Device is currently active, so we want to block it
        const result = await unifi.blockClient(macAddress);
        unifiSuccess = result && (Array.isArray(result) ? result.length > 0 : result);
        actualStatus = !unifiSuccess; // If blocked successfully, device becomes inactive
        operationMessage = unifiSuccess ? 'blocked' : 'block failed';
        console.log(`Block operation for ${macAddress}: ${unifiSuccess ? 'SUCCESS' : 'FAILED'}`, result);
      } else {
        // Device is currently blocked, so we want to unblock it
        const result = await unifi.unblockClient(macAddress);
        unifiSuccess = result && (Array.isArray(result) ? result.length > 0 : result);
        actualStatus = unifiSuccess; // If unblocked successfully, device becomes active
        operationMessage = unifiSuccess ? 'unblocked' : 'unblock failed';
        console.log(`Unblock operation for ${macAddress}: ${unifiSuccess ? 'SUCCESS' : 'FAILED'}`, result);
      }
    } catch (unifiError) {
      console.error('UniFi operation failed:', unifiError);
      const diag = await isDiagnosticsEnabled(prisma);
      return res.status(500).json({ 
        error: 'UniFi operation failed', 
        success: false,
        currentStatus: active,
        ...(diag ? { details: unifiError.message } : {})
      });
    }

    // Only update database if UniFi operation succeeded
    if (unifiSuccess) {
      const updateUser = await prisma.device.update({
        where: {
          id,
          macAddress
        },
        data: {
          active: actualStatus,
          // bonusTimeActive: false // necessary 11/26/2024
        }
      });
            
      // Get current blocked users for response consistency
      const blockedUsers = await getBlockedUsers();
            
      res.json({ 
        updatedUser: updateUser, 
        blockedUsers: blockedUsers,
        success: true,
        message: `Device ${operationMessage} successfully`,
        actualStatus: actualStatus
      });
    } else {
      // UniFi operation failed - don't update database
      console.error(`Failed to ${active ? 'block' : 'unblock'} device ${macAddress}`);
      res.status(500).json({ 
        error: `Failed to ${active ? 'block' : 'unblock'} device`,
        success: false,
        currentStatus: active,
        message: `UniFi ${operationMessage}`
      });
    }
        
  } catch (error) {
    console.error('Toggle operation failed:', error);
    const diag = await isDiagnosticsEnabled(prisma);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      ...(diag ? { details: error.message } : {})
    });
  }
});

app.put('/blockallmacs', async (req, res) => {
  try {
    const { macData = [] } = req.body;
    if (!Array.isArray(macData)) {
      return res.status(400).json({ success: false, error: 'Invalid request body. Expected macData array.' });
    }

    const deviceIdList = macData.map((mac) => {
      return mac?.id; // device ids of user devices
    });
    // console.log('data in blockallmacs\t', macData);
    // console.log('deviceIdList in blockallmacs\t', deviceIdList);
    // console.log('blockedUsers from req.body\t', blockedUsers);

    for (const device of deviceIdList) {
      await stopBonusTime(device, true, schedule, prisma, unifi); // will bonus time crash if there is no bonus time
    }


    //////////////////////////////
    // endTimeout(timerId)
    // stopBonusTime(deviceId, cancelTimer, schedule, prisma, unifi, res)
    ////////////////////////////
    // I dont think we need this updated records, stopBonusTime handles deletes and re-instates 12/2/2024 commented all out
    // const updatedData = {
    //     active: false,
    //     bonusTimeActive: false
    // }
    // const filtMacs = extractMacs(req.body); // what is this
    // await blockMultiple(filtMacs);          // what is this
    // const updatedRecords = await prisma.device.updateMany({
    //     where: {
    //         id: {
    //             in: deviceIdList,
    //         }
    //     },
    //     data: updatedData
    // });
    // res.json({ updatedRecords });
    return res.json({
      success: true,
      msg: 'All mac addresses blocked, jobs reinitiated, bonus time ended',
      deviceCount: deviceIdList.length
    });
    /////////////////////////////
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to block all devices.' });
  }
});

app.put('/unblockallmacs', async (req, res) => {
  const { macData = [] } = req.body;
  if (!Array.isArray(macData)) {
    return res.status(400).json({ success: false, error: 'Invalid request body. Expected macData array.' });
  }

  const filteredIds = macData
    .map((mac) => mac?.id)
    .filter((id) => Number.isInteger(id));

  const filteredMacs = macData
    .map((mac) => mac?.macAddress)
    .filter((macAddress) => isValidMac(macAddress));

  const updatedData = {
    active: true
  };
  try {
    await unBlockMultiple(filteredMacs);
    const updatedRecords = await prisma.device.updateMany({
      where: {
        id: {
          in: filteredIds,
        }
      },
      data: updatedData
    });
    return res.json({
      success: true,
      msg: 'All mac addresses unblocked',
      updatedCount: updatedRecords?.count || 0
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to unblock all devices.' });
  }
});

app.post('/unblockmac', async (req, res) => {
  const { mac, prismaDeviceId } = req.body;
  if (!isValidMac(mac)) {
    return res.status(400).json({ error: 'Invalid MAC address format.' });
  }
  console.log(mac);
  if (await isDiagnosticsEnabled(prisma)) {
    console.log(req.body);
  }
  try {
    await unblockSingle(mac);
    if (prismaDeviceId !== null) {
      const updateIfOnList = await prisma.device.update({
        where: {
          id: prismaDeviceId
        },
        data: {
          active: true
        }
      });
      console.log('updated if on list: ', updateIfOnList);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to unblock device.' });
  }
});

app.put('/updatedevicedata', async (req, res) => { // Devices.jsx device edit
  const { name, macAddress, id } = req.body;
  if (!isValidMac(macAddress)) {
    return res.status(400).json({ error: 'Invalid MAC address format.' });
  }
  try {
    const updatedDeviceData = await prisma.device.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name,
        macAddress: macAddress,
      }
    });
    res.json(updatedDeviceData);
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.delete('/removedevice', async (req, res) => { // Devices.jsx device delete
  const { id } = req.body;
  const removeDevice = await prisma.device.delete({
    where: {
      id: parseInt(id),
    }
  });
    // delete crons - perhaps make all crons contain a deviceId as xubuntu device does
    // cancel jobs associated (if exist)
  res.json({ message: 'Deletion successful', dataDeleted: removeDevice });
});

app.get('/checkjobreinitiation', async (req, res) => {
  try {
    // @todo - also pull from prisma.easyschedule.findMany(); for job re-initiation - 05 16 2024 // working on 06/10/2024
    const previousCronJobData = await prisma.cron.findMany();
    const getMacAddress = await prisma.device.findMany();
    const previousEzScheduleData = await prisma.easySchedule.findMany();

    // Use centralized scheduler service instead of direct node-schedule API calls (Phase 3)
    const { scheduledJobs } = schedulerService.getAllScheduledJobs();


    let matchingCronIds = [];
    let newCronJobNames = [];
    for (let i=0; i<previousCronJobData.length; i++) {
      const matchedMacAddress = getMacAddress.find(
        (item) => item.id === previousCronJobData[i].deviceId
      );
      if (matchedMacAddress) {
        matchingCronIds.push({
          ...previousCronJobData[i],
          matchedMacAddress
        });
      }
    }
    // RESCHEDULE JOBS using scheduler service
    for (const data of matchingCronIds) {
      if (!schedulerService.jobExists(data.jobName) && data.toggleCron === true) {
        let reInitiatedJob = schedulerService.reinitCronJob(data, data.matchedMacAddress.macAddress, jobFunction);
        newCronJobNames.push({...data, jobName: reInitiatedJob?.name});
      }
    }
    // DATABASE
    let updatedCronJobs = [];
    for (let i=0; i<newCronJobNames.length; i++) {
      const updateNewCronJobNames = await prisma.cron.update({
        where: {
          id: newCronJobNames[i].id
        },
        data: {
          jobName: newCronJobNames[i].jobName,
        }
      });
      updatedCronJobs.push(updateNewCronJobNames);
    }
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~EZSched~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let matchingEZIds = [];
    let newEZJobNames = [];
    for (let i=0; i<previousEzScheduleData.length; i++) {
      const matchedMacAddress = getMacAddress.find(
        (item) => item.id === previousEzScheduleData[i].deviceId
      );
      if (matchedMacAddress) {
        matchingEZIds.push({
          ...previousEzScheduleData[i],
          matchedMacAddress
        });
      }
    }

    for (const data of matchingEZIds) {
      if (data.days) { // added 07 24 2024: modifiedDaysOfTheWeek was undefined on job re-initiation, we are manually adding it to the data obj from days
        let d = data.days.split('').map(day => parseInt(day));
        data.modifiedDaysOfTheWeek = d;
      }
      if (!schedulerService.jobExists(data.jobName) && data.toggleSched) { // reschedule jobs === undefined
        if (data.oneTime) {
          if (data.date) { // job was in past, delete or reschedule
            let oneTimeScheduleDate = new Date(`${data.date} ${data.hour}:${data.minute}:00`);
            let currentDate = new Date();
            // console.log('oneTimeScheduleDate\t', oneTimeScheduleDate);
            // console.log('currentDate\t', currentDate);
            if (oneTimeScheduleDate < currentDate) {
              console.log('Date was less than current date');
              const deleteOldPrismaDate = await prisma.easySchedule.delete({ where: { id: data.id } });
              console.log('deleteOldPrismaDate\t', deleteOldPrismaDate);
            } else {
              // Use scheduler service for re-initiation (Phase 3)
              const reInitiatedJob = schedulerService.reinitOneTimeSchedule(data, data.matchedMacAddress.macAddress, jobFunction);
              console.log('reInitiatedJob OneTime Success! name:\t', reInitiatedJob?.name);
              newEZJobNames.push({ ...data, jobName: reInitiatedJob?.name });
            }
          }
        } else if (!data.oneTime) {
          // Use scheduler service for recurring schedule re-initiation (Phase 3)
          const reInitiatedJob = schedulerService.reinitRecurringSchedule(data, data.matchedMacAddress.macAddress, jobFunction);
          newEZJobNames.push({ ...data, jobName: reInitiatedJob?.name });
        }
      }
    }
    let updatedEZJobs = [];
    for (let i=0; i<newEZJobNames.length; i++) {
      const updatenewEZJobNames = await prisma.easySchedule.update({
        where: {
          id: newEZJobNames[i].id
        },
        data: {
          jobName: newEZJobNames[i].jobName,
        }
      });
      updatedEZJobs.push(updatenewEZJobNames);
    }
    res.json({
      previousCronJobData,
      previousEzScheduleData,
      getMacAddress,
      updatedEZJobs,
      updatedCronJobs
    });
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

// ~~~~~~~~~crons~~~~~~~~~~~
app.post('/addschedule', async (req, res) => { // adds cron data specific front end device && cron validator
  const { id, crontype, croninput, toggleCron, jobName } = req.body;
  if (await isDiagnosticsEnabled(prisma)) {
    serverLogger(JSON.stringify(req.body), 'nua.log');
  }
  try {
    const deviceToSchedule = await prisma.device.findUnique({
      where: {
        id: id
      }
    });
    console.log('Device to schedule ', deviceToSchedule); // job creation removed from here spefically to be performed in /togglecron

    if (validateCron(croninput)) {
      const addCron = await prisma.cron.create({ // create cron
        data: {
          crontype: crontype,
          crontime: croninput,
          jobName: '',
          toggleCron: toggleCron,
          device: {
            connect: { id: id }
          },
        }
      });

      const getMacAddress = await prisma.device.findUnique({ where: { id: id} });
      console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);
      console.log('continue new');

      // Use schedulerService instead of direct node-schedule API (Phase 4)
      const startNewJob = await schedulerService.createCronJob(
        croninput,
        () => jobFunction(crontype, getMacAddress.macAddress, false, unifi, prisma)
      );

      if (addCron) { // add device id
        const updateCronJobName = await prisma.cron.update({
          where: { id: addCron.id },
          data: {
            deviceId: id,
            jobName: startNewJob.name
          }
        });
      }
      res.json(addCron);
    } else {
      res.status(422).send({ message: 'Invalid Cron Type, please try again.' });
    }
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.delete('/deletecron', async (req, res) => {
  const { parseId, jobName } = req.body;
  try {
    const deleteCron = await prisma.cron.delete({
      where: {
        id: parseId
      }
    });
    console.log('jobName: \t', jobName);
    const jobToCancel = schedule.scheduledJobs[jobName];
    console.log('Job Name cancelled: ', jobToCancel?.name);
    jobToCancel?.cancel();

    res.json({ message: 'Data Deleted Succesfully.', dataDeleted: deleteCron });

  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.put('/togglecron', async (req, res) => {
  const { id, toggleCron, jobName, crontime, crontype, deviceId } = req.body;
  // serverLogger(`Toggle on off ${toggleCron}`, "nua.log");
  // const { id, deviceId, jobName, ezBlockAllow, ezDate, toggleEZSched } = req.body
  let jb = jobName;
  try {
    const getMacAddress = await prisma.device.findUnique({ where: { id: deviceId } });
    console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);

    if (toggleCron === false && jobName !== '') {
      // Use schedulerService instead of direct node-schedule API (Phase 4)
      const cancelled = await schedulerService.cancelJob(jobName);
      console.log('Cancelled Job?: ', cancelled);
    } else if (toggleCron === true) {
      console.log('continue');

      // Use schedulerService instead of direct node-schedule API (Phase 4)
      const reInitiatedJob = await schedulerService.createCronJob(
        crontime,
        () => jobFunction(crontype, getMacAddress.macAddress, false, unifi, prisma)
      );
      jb = reInitiatedJob.name;
      console.log('jb.name: ', jb.name);
    }
    const updateCronToggle = await prisma.cron.update({
      where: { id: id },
      data: {
        toggleCron: toggleCron,
        jobName: jb
      }
    });
    res.json(updateCronToggle);
  } catch (error) {
    console.error(error);
  }
});

app.post('/getscheduledata', async (req, res) => { // fetches cron data specific to front end device
  const { id } = req.body;
  // console.log('id from getcrondata req.body ', id);
  // console.log('req.body from /getcrondata ', req.body);
  try {
    const cronData = await prisma.cron.findMany({
      where: {
        deviceId: id
      }
    });
    const ezScheduleData = await prisma.easySchedule.findMany({
      where: {
        deviceId: id
      }
    });
    res.json({ cronData, ezScheduleData });

    const getMacAddress = await prisma.device.findUnique({ where: { id: id } });
    // const { macAddress } = getMacAddress;
    // const { scheduledJobs } = schedule;

    // for (const data of cronData) { // 06 06 2024 - not sure the intention of this in hindsight, but also consider "undefined" vs undefined.
    //     console.log('#974: data.jobName ', data.jobName)
    //     console.log('data.jobName === undefined ', scheduledJobs[data.jobName] === undefined) // jobs not re initiated
    //     if (scheduledJobs[data.jobName] === undefined) {
    //         // update many and also make async ?
    //     }
    // }
    // console.log('jobs ', scheduledJobs[cronData[0].jobName] === undefined);
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

// ~~~~~~~schedules~~~~~~~~~~

// ~~~~~~
app.post('/savesitesettings', async (req, res) => {
  const { username, password, hostname, port, sslverify, refreshRate, diagnosticsEnabled } = req.body;
  if (await isDiagnosticsEnabled(prisma)) {
    console.log(req.body);
  }

  red(sslverify, 'teal');
  let sslBool;
  if (sslverify === 'false') {
    sslBool = false;
  } else if (sslverify === 'true') {
    sslBool = true;
  }
  try {
    const encryptedPassword = encrypt(password);
    const siteCredentials = await prisma.credentials.upsert({
      where: { id: 1 },
      update: {
        username,
        password: encryptedPassword,
        hostname,
        port: parseInt(port),
        sslverify: sslBool,
        refreshRate: parseInt(refreshRate),
        diagnosticsEnabled: !!diagnosticsEnabled,
        initialSetup: false
      },
      create: {
        username,
        password: encryptedPassword,
        hostname,
        port: parseInt(port),
        sslverify: sslBool,
        refreshRate: parseInt(refreshRate),
        diagnosticsEnabled: !!diagnosticsEnabled
      }
    });
    res.json({ siteCredentials });
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.put('/updatesitesettings', async (req, res) => {
  const { username, password, hostname, port, sslverify, id, refreshRate, diagnosticsEnabled } = req.body;
  let sslBool;
  if (sslverify === 'false') {
    sslBool = false;
  } else if (sslverify === 'true') {
    sslBool = true;
  }
  try {
    const encryptedPassword = encrypt(password);
    const siteCredentials = await prisma.credentials.update({
      where: {
        id: id,
      },
      data: {
        username: username,
        password: encryptedPassword,
        hostname: hostname,
        port: parseInt(port),
        sslverify: sslBool,
        refreshRate: parseInt(refreshRate),
        diagnosticsEnabled: !!diagnosticsEnabled
      }
    });
    res.json({ message: 'Credentials successfully saved!' });
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.post('/updategeneralsettings', async (req, res) => {
  const { selectDefaultPage } = req.body;
  const updateDefaultPage = await prisma.credentials.update({
    where: {
      id: 1
    },
    data: {
      defaultPage: selectDefaultPage
    }
  });

  res.sendStatus(200);
});

app.get('/checkforsettings', async (req, res) => {
  try {
    const checkForSettings = await prisma.credentials.findUnique({ where: { id: 1 }});
    if (checkForSettings) {
      const diag = await isDiagnosticsEnabled(prisma);
      if (diag) {
        // Diagnostics on: expose the full row (including password) for debugging.
        console.log('checkForSettings \t', checkForSettings);
        res.json(checkForSettings);
      } else {
        // Default: return a sanitized view (never expose the password).
        const { password, ...safe } = checkForSettings;
        res.json(safe);
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.get('/encryption-status', (req, res) => {
  res.json({ enabled: isEncryptionEnabled() });
});

app.post('/enable-encryption', async (req, res) => {
  try {
    if (isEncryptionEnabled()) {
      return res.status(409).json({ error: 'Encryption is already enabled.' });
    }

    // Generate and persist the key
    generateAndSaveKey();

    // Re-encrypt the stored password if one exists
    const creds = await prisma.credentials.findUnique({ where: { id: 1 } });
    if (creds && creds.password && !creds.password.startsWith('ENC:')) {
      const encryptedPassword = encrypt(creds.password);
      await prisma.credentials.update({
        where: { id: 1 },
        data: { password: encryptedPassword }
      });
    }

    res.json({ success: true, message: 'Encryption enabled. Credentials are now encrypted at rest.' });
  } catch (error) {
    console.error('Failed to enable encryption:', error);
    await sendError(res, error, 'Failed to enable encryption.');
  }
});

app.get('/testconnection', async (req, res) => {
  // const getAdminLoginInfo = async () => {
  // const unifiTest = new Unifi.Controller({ hostname: loginData.hostname, port: loginData.port,  sslverify: loginData.sslverify });
  try {
    // const adminLogin = await prisma.credentials.findMany();
    const adminLogin = await prisma.credentials.findUnique({ where: { id: 1 }});
    // const login = adminLogin.pop();
    // console.log('adminLogin ', adminLogin);
    console.log('adminLogin: \t ', adminLogin);
    const plainPassword = decrypt(adminLogin.password);
    const unifiTest = new Unifi.Controller({ hostname: adminLogin.hostname, port: adminLogin.port,  sslverify: adminLogin.sslverify });

    // console.log('unifiTest \t', unifiTest);
    const testCredentials = await unifiTest.login(adminLogin.username, plainPassword);
    console.log('Test Credentials: ', testCredentials); // returns true, not login info
    if (testCredentials === true) {
      console.log('🔧 Test connection successful, establishing global UniFi connection...');
            
      // The test already created a connection, so we can reuse the tested controller
      // But let's be explicit and create a fresh connection for the global unifi variable
      try {
        const result = await logIntoUnifi(adminLogin.hostname, adminLogin.port, adminLogin.sslverify, adminLogin.username, plainPassword);
                
        if (result && result.validCredentials) {
          console.log('✅ Successfully established global UniFi connection');
                    
          // Mark setup as complete
          const setInitialSetupFalse = await prisma.credentials.update({ where: { id: 1 }, data: { initialSetup: false } }); 
          console.log('✅ Initial setup completed - UniFi ready for use');
                    
          res.sendStatus(200);
        } else {
          console.error('❌ UniFi login failed despite successful test');
          res.status(500).json({ error: 'UniFi login failed' });
        }
      } catch (unifiError) {
        console.error('❌ Failed to establish UniFi connection:', unifiError);
        await sendError(res, error, 'Failed to establish UniFi connection');
      }
    } else {
      console.log('❌ Test credentials returned:', testCredentials);
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    // if (error) throw error;
    if (error) {
      console.log('Catch Error: ', error?.code);
      // res.sendStatus(401);
      res.status(401).json({ message: error?.code });

      // console.log('Catch Error: ', error.request)
      // throw error;
    }
  }
  // }
  // getAdminLoginInfo();
});

// Debug status endpoint
app.get('/debug-status', async (req, res) => {
  try {
    const credentials = await prisma.credentials.findUnique({ where: { id: 1 }});
    res.json({
      unifiConnected: !!unifi,
      initialSetup: credentials?.initialSetup,
      hasCredentials: !!(credentials?.hostname && credentials?.username && credentials?.password),
      credentials: {
        hostname: credentials?.hostname || 'not set',
        username: credentials?.username ? 'configured' : 'not set',
        password: credentials?.password ? 'configured' : 'not set',
        port: credentials?.port
      }
    });
  } catch (error) {
    await sendError(res, error);
  }
});

// Reinitialize connection after credentials change
app.post('/reinitialize-connection', async (req, res) => {
  try {
    console.log('🔄 Reinitializing UniFi connection...');
        
    const loginData = await fetchLoginInfo();
        
    if (!loginData) {
      return res.status(400).json({ error: 'No credentials found' });
    }
        
    // Check if credentials are configured and setup is complete
    if (loginData.hostname && loginData.username && loginData.password && !loginData.initialSetup) {
      console.log('🔧 Attempting to establish UniFi connection...');
            
      const result = await logIntoUnifi(loginData.hostname, loginData.port, loginData.sslverify, loginData.username, loginData.password);
            
      if (result && result.validCredentials) {
        console.log('✅ UniFi connection reinitialized successfully');
        res.json({ 
          message: 'UniFi connection reinitialized successfully', 
          connected: true,
          initialSetup: false
        });
      } else {
        console.log('❌ UniFi connection failed');
        res.status(500).json({ error: 'UniFi connection failed', connected: false });
      }
    } else if (loginData.initialSetup) {
      res.status(400).json({ 
        error: 'Initial setup not complete',
        message: 'Please complete setup first',
        initialSetup: true
      });
    } else {
      res.status(400).json({ error: 'UniFi credentials not properly configured' });
    }
  } catch (error) {
    console.error('❌ Reinitialize connection error:', error);
    const diag = await isDiagnosticsEnabled(prisma);
    res.status(500).json(diag ? { error: error.message, connected: false } : { error: 'UniFi connection failed', connected: false });
  }
});

// Manual UniFi connection endpoint for troubleshooting
app.post('/connect-unifi', async (req, res) => {
  try {
    if (unifi) {
      return res.json({ message: 'UniFi already connected', connected: true });
    }

    const loginData = await fetchLoginInfo();
        
    if (!loginData || !loginData.hostname || !loginData.username || !loginData.password) {
      return res.status(400).json({ error: 'UniFi credentials not configured' });
    }

    console.log('🔧 Attempting manual UniFi connection...');
    const result = await logIntoUnifi(loginData.hostname, loginData.port, loginData.sslverify, loginData.username, loginData.password);
        
    if (result && result.validCredentials) {
      console.log('✅ Manual UniFi connection successful');
            
      // Also fix the initialSetup flag if needed
      if (loginData.initialSetup) {
        await prisma.credentials.update({ 
          where: { id: 1 }, 
          data: { initialSetup: false } 
        });
        console.log('🔧 Updated initialSetup flag to false');
      }
            
      res.json({ message: 'UniFi connection established', connected: true });
    } else {
      console.log('❌ Manual UniFi connection failed');
      res.status(500).json({ error: 'UniFi connection failed', connected: false });
    }
  } catch (error) {
    console.error('❌ Manual UniFi connection error:', error);
    const diag = await isDiagnosticsEnabled(prisma);
    res.status(500).json(diag ? { error: error.message, connected: false } : { error: 'UniFi connection failed', connected: false });
  }
});

app.get('/getallblockeddevices', async (req, res) => {
  try {
    const blockedUsers = await getBlockedUsers();
    const deviceList = await prisma.device.findMany();
    return res.json({ blockedUsers: blockedUsers, deviceList: deviceList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to fetch blocked devices.' });
  }
});

app.get('/getalldevices', async (req, res) => {
  try {
    // const getAccessDevices = await unifi.getAccessDevices();
    const getClientDevices = await withUnifiRetry(() => unifi.getAllUsers());
    // const getClientDevices = await unifi.getClientDevices();
    const getDeviceList = await prisma.device.findMany({
      include: {
        deviceGroup: true
      }
    });
    // console.log(getClientDevices);
    res.json({ getClientDevices: getClientDevices, getDeviceList: getDeviceList });
    // res.sendStatus(200)
  } catch (error) {
    console.error('Error in /getalldevices:', error);
    if (isUnauthorizedUnifiError(error)) {
      return res.status(401).json({ error: 'UniFi authorization failed. Please verify credentials in /sitesettings.' });
    }
    return res.status(503).json({ error: 'Unable to fetch devices from UniFi controller.' });
  }
});

app.get('/getcurrentdevices', async (req, res) => {
  try {
    const getDeviceList = await prisma.device.findMany({
      include: {
        deviceGroup: true
      }
    });
    res.json({ getDeviceList: getDeviceList });
  } catch (error) {
    console.error(error);
  }
});

//~~~~~~~device groups~~~~~~~~
app.get('/devicegroups', async (req, res) => {
  try {
    const deviceGroups = await prisma.deviceGroup.findMany({
      include: {
        devices: true
      }
    });
    res.json({ deviceGroups });
  } catch (error) {
    console.error('Error fetching device groups:', error);
    res.status(500).json({ error: 'Failed to fetch device groups' });
  }
});

app.post('/devicegroups', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
        
    const deviceGroup = await prisma.deviceGroup.create({
      data: {
        name,
        description,
        color: color || '#3B82F6',
        icon: icon || '👤'
      },
      include: {
        devices: true
      }
    });
        
    res.status(201).json({ deviceGroup });
  } catch (error) {
    console.error('Error creating device group:', error);
    res.status(500).json({ error: 'Failed to create device group' });
  }
});

app.put('/devicegroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, active } = req.body;
        
    const deviceGroup = await prisma.deviceGroup.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        color,
        icon,
        active
      },
      include: {
        devices: true
      }
    });
        
    res.json({ deviceGroup });
  } catch (error) {
    console.error('Error updating device group:', error);
    res.status(500).json({ error: 'Failed to update device group' });
  }
});

app.delete('/devicegroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
        
    // First, unassign all devices from this group
    await prisma.device.updateMany({
      where: { deviceGroupId: parseInt(id) },
      data: { deviceGroupId: null }
    });
        
    // Then delete the group
    await prisma.deviceGroup.delete({
      where: { id: parseInt(id) }
    });
        
    res.json({ message: 'Device group deleted successfully' });
  } catch (error) {
    console.error('Error deleting device group:', error);
    res.status(500).json({ error: 'Failed to delete device group' });
  }
});

app.put('/devices/:id/group', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceGroupId } = req.body;
        
    const device = await prisma.device.update({
      where: { id: parseInt(id) },
      data: { 
        deviceGroupId: deviceGroupId ? parseInt(deviceGroupId) : null 
      },
      include: {
        deviceGroup: true
      }
    });
        
    res.json({ device });
  } catch (error) {
    console.error('Error updating device group assignment:', error);
    res.status(500).json({ error: 'Failed to update device group assignment' });
  }
});

app.post('/devicegroups/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body; // true to allow all, false to block all
        
    // Check if UniFi is connected
    if (!unifi) {
      return res.status(503).json({ 
        error: 'UniFi controller not connected', 
        message: 'Please configure UniFi credentials at /sitesettings',
        success: false
      });
    }
        
    // Get all devices in the group
    const deviceGroup = await prisma.deviceGroup.findUnique({
      where: { id: parseInt(id) },
      include: { devices: true }
    });
        
    if (!deviceGroup) {
      return res.status(404).json({ error: 'Device group not found' });
    }
        
    const results = [];
    const errors = [];
        
    // Toggle each device in the group
    for (const device of deviceGroup.devices) {
      try {
        if (active) {
          await unblockSingle(device.macAddress);
        } else {
          await blockSingle(device.macAddress);
        }
                
        // Update device status in database
        await prisma.device.update({
          where: { id: device.id },
          data: { 
            active: active,
            bonusTimeActive: false // Reset bonus time when toggling group
          }
        });
                
        results.push({ deviceId: device.id, success: true });
      } catch (error) {
        console.error(`Error toggling device ${device.id}:`, error);
        errors.push({ deviceId: device.id, error: error.message });
      }
    }
        
    res.json({ 
      success: errors.length === 0,
      results,
      errors,
      message: `${active ? 'Allowed' : 'Blocked'} ${results.length} devices in group "${deviceGroup.name}"`
    });
  } catch (error) {
    console.error('Error toggling device group:', error);
    res.status(500).json({ error: 'Failed to toggle device group' });
  }
});

//~~~~~~~theme~~~~~~~~
app.get('/getcurrenttheme', async (req, res) => {
  try {
    const getTheme = await prisma.credentials.findUnique({
      where: {
        id: 1
      }
    });
    const { theme } = getTheme;
    // console.log('theme: ', theme);
    res.json(theme);
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

app.put('/updatetheme', async (req, res) => {
  try {
    const updateTheme = await prisma.credentials.update({
      where: {
        id: 1,
      },
      data: { theme: req.body.theme }
    });
    res.json(updateTheme);
  } catch (error) {
    console.error(error);
    await sendError(res, error, 'Internal server error.');
  }
});

//~~~~~~reorder data~~~~~~
app.put('/updatedeviceorder', async (req, res) => {
  const { newData } = req.body;
  try {
    const updateOrder = async () => {
      for (const device of newData) {
        await prisma.device.update({
          where: {
            id: device.id
          },
          data: {
            order: parseInt(device.order)
          }
        });
      }
    };
    updateOrder();
    // res.json({ message: 'Updated Successful'})
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
  }
});

//~~~~~~~category/app firewall rules~~~~~~

app.get('/getdbcustomapirules', async (req, res) => { // get dbtrafficrules && unifi rules
  try {
    const path = '/v2/api/site/default/trafficrules';
    const result = await withUnifiRetry(() => unifi.customApiRequest(path, 'GET'));

    const fetchTrafficRules = await prisma?.trafficRules?.findMany();
    const fetchAppCatIds = await prisma?.appCatIds?.findMany();
    const fetchAppIds = await prisma?.appIds?.findMany();
    const fetchTargetDevices = await prisma?.targetDevice?.findMany();

    const joinedData = fetchTrafficRules?.map((trafficRule) => {
      const matchingFetchAppCatIds = fetchAppCatIds.find(appCatId => appCatId.trafficRulesId === trafficRule.id);
      const matchingAppIds = fetchAppIds.filter(appId => appId.trafficRulesId === trafficRule.id);
      const matchingTargetDevices = fetchTargetDevices.filter(targetDevice => targetDevice.trafficRulesId === trafficRule.id);

      return {
        trafficRule,
        matchingFetchAppCatIds,
        matchingAppIds,
        matchingTargetDevices
      };
    });
    if (joinedData.length) {
      return res.status(200).json({ trafficRuleDbData: joinedData, unifiData: result });
    }
    if (result.length && !joinedData.length) {
      return res.status(206).json({ unifiData: result });
    }
    return res.status(200).json({ trafficRuleDbData: [], unifiData: result || [] });
  } catch (error) {
    console.error('Error in /getdbcustomapirules:', error);
    if (isUnauthorizedUnifiError(error)) {
      return res.status(401).json({ error: 'UniFi authorization failed. Please verify credentials in /sitesettings.' });
    }
    return res.status(503).json({ error: 'Unable to fetch traffic rules from UniFi controller.' });
  }
});

app.post('/addcategorytrafficrule', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { categoryObject, dbCatObject } = req.body;

  // console.log('categoryObject \t', categoryObject); // verified
  const { app_category_ids, description, enabled, matching_target, target_devices, categoryName, devices, action } = dbCatObject;

  console.log('devices \t', devices);
  console.log('app_category_ids \t', app_category_ids);

  try {
    const path = '/v2/api/site/default/trafficrules';
    const result = await unifi.customApiRequest(path, 'POST', categoryObject);
    // console.log('result \t', result);
    // console.log('result._id \t', result._id);

    const setTrafficRuleEntry = await prisma.trafficRules.create({
      data: {
        unifiId: result._id,
        description: description,
        enabled: enabled,
        blockAllow: action,
      }
    });
    const setAppCatIds = await prisma.appCatIds.create({
      data: {
        app_cat_id: app_category_ids[0].categoryId,
        app_cat_name: app_category_ids[0].categoryName,
        trafficRules: {
          connect: { id: setTrafficRuleEntry.id }
        }
      },
    });
    const setMultipleDevices = async () => {
      let allData = [];
      for (const device of devices) {
        const update = await prisma.trafficRuleDevices.create({
          data: {
            deviceName: device.name,
            deviceId: device.id,
            macAddress: device.macAddress,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          }
        });
        allData.push(update);
      }
      return allData;
    };
    await setMultipleDevices();


    const setMultipleTargetDevices = async () => {
      let allData = [];
      for (const td of target_devices) {
        const data = await prisma.targetDevice.create({
          data: {
            client_mac: td.client_mac,
            type: td.type,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          },
        });
        allData.push(data);
      }
      return allData;
    };
    await setMultipleTargetDevices();
    // console.log('setTrafficRuleEntry \t', setTrafficRuleEntry);
    // console.log('setAppCatIds \t', setAppCatIds);
    // console.log('setAppIds \t', setAppIds);
    // console.log('setTargetDevices \t', multipleData);
    if (result) {
      console.log('Result: \t', result);
      res.status(200).json({ success: true, result: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error?.response?.data });
    console.error(error);
  }
});

app.post('/addappstrafficrule', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { appObject, appDbObject } = req.body;
  const { app_category_ids, app_ids, description, enabled, matching_target, target_devices, devices, action, appSelection } = appDbObject;
  console.log('appDbObject \t', appDbObject);
  let r;
  try {
    const path = '/v2/api/site/default/trafficrules';
    const result = await unifi.customApiRequest(path, 'POST', appObject);
    r = result;

    const setTrafficRuleEntry = await prisma.trafficRules.create({
      data: {
        unifiId: result._id,
        description: description,
        enabled: enabled,
        blockAllow: action
      }
    });
    // const setAppCatIds = await prisma.appCatIds.create({
    //     data: {
    //         app_cat_id: app_category_ids[0],
    //         trafficRules: {
    //             connect: { id: setTrafficRuleEntry.id }
    //         }
    //     },
    // });
    const setMultipleAppCatIds = async () => {
      let allData = [];
      for (const appCatIds of app_category_ids) {
        const setAppIds = await prisma.appCatIds.create({
          data: {
            app_cat_id: appCatIds.app_cat_id,
            app_cat_name: appCatIds.app_cat_name,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          }
        });
        allData.push(setAppIds);
      }
      return allData;
    };
    await setMultipleAppCatIds();

    const setMultipleAppIds = async () => {
      let allData = [];
      for (const appIds of appSelection) {
        const setAppIds = await prisma.appIds.create({
          data: {
            app_id: appIds.id,
            app_name: appIds.name,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          }
        });
        allData.push(setAppIds);
      }
      return allData;
    };
    await setMultipleAppIds();

    const setMultipleDevices = async () => {
      let allData = [];
      for (const device of devices) {
        const update = await prisma.trafficRuleDevices.create({
          data: {
            deviceName: device.name,
            deviceId: device.id,
            macAddress: device.macAddress,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          }
        });
        allData.push(update);
      }
      return allData;
    };
    await setMultipleDevices();
    const setMultipleTargetDevices = async () => {
      let allData = [];
      for (const td of target_devices) {
        const data = await prisma.targetDevice.create({
          data: {
            client_mac: td.client_mac,
            type: td.type,
            trafficRules: {
              connect: { id: setTrafficRuleEntry.id }
            }
          },
        });
        allData.push(data);
      }
      return allData;
    };
    await setMultipleTargetDevices();

    // res.sendStatus(200);
    if (result) {
      console.log('Result made it: \t', result);
      res.status(200).json({ success: true, result: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error?.response?.data });
    console.error(error);
    // console.log('error.response \t', error.response);
    // res.status(error.response.status).json({ error: error.response.data });
  }
});

app.put('/updatecategorytrafficrule', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { categoryObject } = req.body;
  console.log('catId \t', categoryObject); // verified
  try {
    // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
    const path = `/v2/api/site/default/trafficrules/${categoryObject._id}`;

    const result = await unifi.customApiRequest(path, 'PUT', categoryObject._id);
    console.log('result \t', result);
    // result?.map(r => console.log(r))
    // result.forEach(r => r.target_devices.forEach(device => console.log('target_devices \t', device)))

    // res.json(car)
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
  }
});

app.put('/updatetrafficruletoggle', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { _id, trafficRuleId, unifiObjCopy } = req.body;
  console.log('unifiObjCopy \t', unifiObjCopy);
  try {
    const path = `/v2/api/site/default/trafficrules/${_id}`;

    const result = await unifi.customApiRequest(path, 'PUT', unifiObjCopy);
    console.log('result \t', result);

    const updateTrafficRule = await prisma.trafficRules.update({
      where: {
        id: parseInt(trafficRuleId)
      },
      data: {
        enabled: unifiObjCopy.enabled
      }
    });
    console.log('updateTrafficRule \t', updateTrafficRule);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).json({ error: error });
    console.error(error);
  }
});

app.delete('/deletecustomapi', async (req, res) => { // deletes unifi rule, not db (yet)
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { _id, trafficRuleId } = req.body;
  console.log('id of rule to delete \t', _id);
  console.log('trafficRuleId \t', trafficRuleId);
  const path = `/v2/api/site/default/trafficrules/${_id}`;
  try {
    // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
    const checkForExistingUnifiRule = await unifi.customApiRequest('/v2/api/site/default/trafficrules', 'GET');
    console.log('checkForExistingUnifiRule \t', checkForExistingUnifiRule);
    const checkFilter = checkForExistingUnifiRule.filter((rule) => {
      return rule._id === _id;
    });
    if (checkFilter.length) {
      const result = await unifi.customApiRequest(path, 'DELETE', null);
      console.log('"DELETE" result: \t', result);
    }
    const deleteTrafficRuleAndAssociated = async (trafficRuleId) => {
      try {
        await prisma.$transaction(async (trule) => {
          await trule.appCatIds.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trule.appIds.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trule.targetDevice.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trule.trafficRuleDevices.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trule.trafficRules.delete({ where: { id: trafficRuleId }});
        });
        console.log('Traffic Rule and associated entries deleted successfully!');
      } catch (error) {
        console.error('Error Deleting TrafficRule and associated entries.');
      } finally {
        await prisma.$disconnect();
      }
    };
    await deleteTrafficRuleAndAssociated(parseInt(trafficRuleId));

    res.status(200).json({ result: checkFilter });
  } catch (error) {
    console.error(error);
  }
});

app.post('/importexistingunifirules', async (req, res) => {
  const { categoryClones, appClones } = req.body;

  try {
    if (categoryClones.length) {
      console.log('categoryClones \t', categoryClones);
    }
    if (appClones.length) {
      console.log('appClones \t', appClones);

      for (const appClone of appClones) {
        const trafficRuleEntry = await prisma.trafficRules.create({
          data: {
            unifiId: appClone._id,
            description: appClone.description,
            enabled: appClone.enabled,
            blockAllow: appClone.action
          }
        });
        if (appClone.app_category_ids.length) {
          for (const appCatNameId of appClone.app_category_ids) {
            const appCatIdsEntry = await prisma.appCatIds.create({ // need app_cat_name if exists // changed to appCatIds from appIds 02/15
              data: {
                app_cat_id: appCatNameId.app_cat_id,
                app_cat_name: appCatNameId.app_cat_name,
                trafficRules: {
                  connect: { id: trafficRuleEntry.id }
                }
              }
            });
          }
        }
        for (const appCloneNameIds of appClone.appSelection) {
          const appIdsEntry = await prisma.appIds.create({
            data: {
              app_id: appCloneNameIds.id,
              app_name: appCloneNameIds.name,
              trafficRules: {
                connect: { id: trafficRuleEntry.id }
              }
            }
          });
        }
        for (const appCloneTargetDevice of appClone.target_devices) {

          const targetDeviceEntry = await prisma.targetDevice.create({
            data: {
              client_mac: appCloneTargetDevice.client_mac ? appCloneTargetDevice.client_mac : 'Not a client device',
              type: appCloneTargetDevice.type,
              trafficRules: {
                connect: { id: trafficRuleEntry.id }
              }
            }
          });
        }
        // for (const appCloneTargetDevice of appClone.devices) {
        //     const trafficRuleDevicesEntry = await prisma.trafficRuleDevices.create({
        //         data: {
        //             deviceName: appCloneTargetDevice.deviceName ? appCloneTargetDevice.deviceName : "No Name Provided",
        //             // deviceId:
        //             macAddress: appCloneTargetDevice.macAddress,
        //             trafficRules: {
        //                 connect: { id: trafficRuleEntry.id }
        //             }
        //         }
        //     });
        //     // look into how to properly update the deviceId and which devices to add....
        //     const deviceEntryForUnifiRule = await prisma.device.create({
        //         data: {
        //             name: appCloneTargetDevice.oui ? appCloneTargetDevice.oui : appCloneTargetDevice.hostname ? appCloneTargetDevice.hostname : `"none"` ,
        //             macAddress: appCloneTargetDevice.macAddress,
        //             active: appClone.enabled
        //         }
        //     });

        //     const updateTrafficRuleDevicesEntry = await prisma.trafficRuleDevices.update({
        //         where: {
        //             id: trafficRuleDevicesEntry.id,
        //         },
        //         data: {
        //             deviceId: deviceEntryForUnifiRule.id,
        //         }
        //     });
        // }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(502);
  }


});

app.delete('/unmanageapp', async (req, res) => {
  const { dbId } = req.body;
  try {
    const unmanageTrafficRule = async (trafficRuleId) => {
      try {
        await prisma.$transaction(async (trafficRule) => {
          await trafficRule.appCatIds.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trafficRule.appIds.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trafficRule.targetDevice.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trafficRule.trafficRuleDevices.deleteMany({ where: { trafficRulesId: trafficRuleId }});
          await trafficRule.trafficRules.delete({ where: { id: trafficRuleId }});
        });
        console.log(`Unmanaged traffic rule: ${dbId}, successfully!`);
        res.sendStatus(200);
      } catch (error) {
        console.error(error);
      } finally {
        await prisma.$disconnect();
      }
    };
    await unmanageTrafficRule(parseInt(dbId));

  } catch (error) {
    console.error(error);
  }
});


// ~~~~~~~~~~TEMPORARY TESTING~~~~~~~~~~~~~~
//~~~~~~temp get all available devices~~~~~~
app.post('/getallworking', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { arrayOfObjects } = req.body;
  const path = '/v2/api/site/default/trafficrules';

  const getAllWorkingCategories = async (arrayObjects) => {
    let failedRequests = [];
    let successfulRequests = [];
    for (const arrayObject of arrayObjects) {
      try {
        await unifi.customApiRequest(path, 'POST', arrayObject);
        successfulRequests.push({ arrayObject });
      } catch (error) {
        failedRequests.push({ arrayObject });
      }
    }
    return { successfulRequests, failedRequests };
  };
  function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i+=chunkSize) {
      chunks.push(array.slice(i, i+chunkSize));
    }
    return chunks;
  }
  async function sendRequestsInChunks(arrayOfObjects, chunkSize) {
    const chunks = chunkArray(arrayOfObjects, chunkSize);
    let allFailedApps = [];
    let allSuccessfulApps = [];
    for (const chunk of chunks) {
      const { successfulRequests, failedRequests } = await getAllWorkingCategories(chunk);
      allFailedApps = allFailedApps.concat(failedRequests);
      allSuccessfulApps = allSuccessfulApps.concat(successfulRequests);
    }
    return { allSuccessfulApps, allFailedApps };
  }
  const chunkSize = 5;
  sendRequestsInChunks(arrayOfObjects, chunkSize)
    .then(({ allSuccessfulApps, allFailedApps }) => {
      console.log('successfulCategories \t', allSuccessfulApps.length);
      console.log('failedCategories \t', allFailedApps.length);
      res.json({ allSuccessfulApps: allSuccessfulApps, allFailedApps: allFailedApps });
      console.log('allSuccessfulApps.length: \t', allSuccessfulApps.length);
      // const mappedIds = allSuccessfulApps.flatMap(item => item.app_ids || []);
      // allSuccessfulApps.forEach(item => console.log('item.app_ids: \t', item.app_ids)) // undefined
      // writeJSONApps(mappedIds)
      writeJSONApps(allSuccessfulApps);
    })
    .catch((error) => console.error(error));
});

app.post('/addbonustime', async (req, res) => { // cron bonus time (Phase 5: uses bonusScheduler)
  try {
    const { hours, minutes, deviceId, isAdditionalTime } = req.body;

    if (hours || minutes) {
      // Start bonus time — pauses all active schedules and creates toggle records
      const currentExpiry = timeoutMap.get(deviceId)?.time;
      const originalTime = isAdditionalTime && currentExpiry ? Math.max(currentExpiry - Date.now(), 0) : null;
      await startBonusTime(deviceId, hours, minutes, unifi, prisma, schedulerService, originalTime);

      // Set up timeout callback to restart paused jobs after bonus time ends
      const restartCallback = async () => {
        await bonusRestartPausedJobs(deviceId, unifi, prisma, jobFunction, schedulerService);
        endTimeout(deviceId);
      };

      startTimeout(deviceId, minutes, hours, restartCallback, originalTime);
      const t = timeoutMap.get(deviceId)?.time;
      const newTime = t - Date.now();

      res.status(200).json({ msg: 'Confirmed', timer: newTime, timerId: deviceId });
    } else {
      res.status(422).send({ message: 'Hours or minutes required for bonus time.' });
    }
  } catch (error) {
    await sendError(res, error);
    console.error(error);
  }
});

app.post('/getbonustimesmap', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const t = timeoutMap.get(deviceId)?.time;
    if (t) {
      const newTime = t - Date.now();
      res.status(200).json({ timer: newTime  });
    } else {
      // Restart-safe fallback: read the persisted expiry timestamp
      const device = await prisma.device.findUnique({
        where: { id: deviceId }
      });
      const expiresAt = device?.bonusTimeExpiresAt;
      if (expiresAt) {
        const remaining = new Date(expiresAt).getTime() - Date.now();
        if (remaining > 0) {
          res.status(200).json({ timer: remaining });
        } else {
          res.status(204).json({ msg: 'No timer information for this device.' });
        }
      } else {
        res.status(204).json({ msg: 'No timer information for this device.' });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

app.post('/addbonusrule', async (req, res) => { // bonus time for a traffic rule
  try {
    const { hours, minutes, trafficRuleId, isAdditionalTime } = req.body;

    if (hours || minutes) {
      const currentExpiry = timeoutMap.get(`rule-${trafficRuleId}`)?.time;
      const originalTime = isAdditionalTime && currentExpiry ? Math.max(currentExpiry - Date.now(), 0) : null;
      const expiresAt = await startBonusRule(trafficRuleId, hours, minutes, unifi, prisma, originalTime);

      const restartCallback = async () => {
        await endBonusRule(trafficRuleId, unifi, prisma);
        endTimeout(`rule-${trafficRuleId}`);
      };
      startTimeout(`rule-${trafficRuleId}`, minutes, hours, restartCallback, originalTime);

      const remaining = expiresAt.getTime() - Date.now();
      res.status(200).json({ msg: 'Confirmed', timer: remaining, timerId: `rule-${trafficRuleId}` });
    } else {
      res.status(422).send({ message: 'Hours or minutes required for bonus time.' });
    }
  } catch (error) {
    const diag = await isDiagnosticsEnabled(prisma);
    res.status(400).json(diag ? { error: error.message } : { error: 'Invalid request.' });
    console.error(error);
  }
});

app.post('/getbonusrulesmap', async (req, res) => {
  try {
    const { trafficRuleId } = req.body;
    const t = timeoutMap.get(`rule-${trafficRuleId}`)?.time;
    if (t) {
      const newTime = t - Date.now();
      res.status(200).json({ timer: newTime });
    } else {
      // Restart-safe fallback: read the persisted expiry timestamp
      const rule = await prisma.trafficRules.findUnique({
        where: { id: trafficRuleId }
      });
      const expiresAt = rule?.bonusTimeExpiresAt;
      if (expiresAt) {
        const remaining = new Date(expiresAt).getTime() - Date.now();
        if (remaining > 0) {
          res.status(200).json({ timer: remaining });
        } else {
          res.status(204).json({ msg: 'No timer information for this rule.' });
        }
      } else {
        res.status(204).json({ msg: 'No timer information for this rule.' });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

app.post('/deletebonusrule', async (req, res) => { // cancel bonus time for a rule immediately
  const { trafficRuleId, cancelTimer } = req.body;
  try {
    if (cancelTimer) {
      endTimeout(`rule-${trafficRuleId}`);
    }
    await endBonusRule(trafficRuleId, unifi, prisma);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
  }
});

// =========================== Traffic rule schedules ===========================
// A traffic rule schedule enables (allow) or disables (block) the rule at a
// chosen time, mirroring the device EasySchedules system.

app.post('/addtrafficruleschedule', async (req, res) => { // create schedule for a traffic rule
  const { trafficRuleId, date, hour, minute, ampm, oneTime, modifiedDaysOfTheWeek, scheduleAction } = req.body;
  try {
    await addTrafficRuleSchedule(
      parseInt(trafficRuleId),
      { date, hour, minute, ampm, oneTime, modifiedDaysOfTheWeek, scheduleAction },
      unifi,
      prisma
    );
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    await sendError(res, error);
  }
});

app.put('/toggletrafficruleschedule', async (req, res) => { // enable/disable an existing schedule
  const { trafficRuleId, toggleOn } = req.body;
  try {
    await toggleTrafficRuleSchedule(parseInt(trafficRuleId), unifi, prisma, toggleOn === true);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    await sendError(res, error);
  }
});

app.delete('/deletetrafficruleschedule', async (req, res) => { // remove a schedule entirely
  const { trafficRuleId } = req.body;
  try {
    await deleteTrafficRuleSchedule(parseInt(trafficRuleId), unifi, prisma);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    await sendError(res, error);
  }
});



app.post('/deletebonustoggles', async (req, res) => { // stop timer and shutoff device (Phase 5: uses bonusScheduler)
  const { deviceId, cancelTimer } = req.body; // deviceId is the timerId
  try {
    if (cancelTimer) { // cancelling timer/ending timeout from /addbonustoggles
      endTimeout(deviceId);
    }

    const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

    // Delete bonus toggles and re-initiate all paused jobs (Phase 5)
    await deleteBonusToggles(deviceId, unifi, prisma, jobFunction, schedulerService, logger);

    const confirmBlocked = await unifi?.blockClient(getMacAddressForDevice.macAddress);
    console.log(`${getMacAddressForDevice.macAddress} has been blocked: ${confirmBlocked}`);
    await clearBonusTimeExpiry(deviceId, prisma);
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        active: false
      }
    });

    res.sendStatus(200);
  } catch (error) {
    await sendError(res, error);
    console.error(error);
  }
});
// ~~~~force error test~~~~
app.post('/submitapptest', async (req, res) => {
  if (!unifi) {
    return res.status(503).json({ error: 'UniFi controller not connected. Please configure credentials at /sitesettings' });
  }
  const { appDeviceObjectCopy } = req.body;
  const path = '/v2/api/site/default/trafficrules';
  try {
    const result = await unifi.customApiRequest(path, 'POST', appDeviceObjectCopy);
    console.log('Test Result \t', result);
    // if (result) {
    // }
    if (!result) {
      throw new Error('Server-Side Error');
    } else {
      res.json({ success: true, result: result });

    }
  } catch (error) {
    console.error('error.response.data \t', error.response.data);
    res.status(500).json({ success: false, error: error?.response?.data });
  }
});

// ======== DEVICE GROUPS API ENDPOINTS ========

// Get all device groups
app.get('/api/device-groups', async (req, res) => {
  try {
    console.log('📥 GET /api/device-groups - Fetching all device groups');
        
    // First, try a simple query without includes
    console.log('🔧 Attempting simple query first...');
    const simpleGroups = await prisma.deviceGroup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`✅ Simple query found ${simpleGroups.length} device groups`);
        
    // Now try with includes
    console.log('🔧 Attempting query with device relationships...');
    const groups = await prisma.deviceGroup.findMany({
      include: {
        devices: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`✅ Full query found ${groups.length} device groups with relationships`);
    res.json(groups);
  } catch (error) {
    console.error('❌ Error fetching device groups:', error.message);
    console.error('📋 Full error:', error);
    await sendError(res, error, 'Failed to fetch device groups');
  }
});

// Create new device group
app.post('/api/device-groups', async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;
        
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.deviceGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || '👤'
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating device group:', error);
    res.status(500).json({ error: 'Failed to create device group' });
  }
});

// Update device group
app.put('/api/device-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = await prisma.deviceGroup.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || '👤',
        updatedAt: new Date()
      }
    });

    res.json(group);
  } catch (error) {
    console.error('Error updating device group:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Device group not found' });
    } else {
      res.status(500).json({ error: 'Failed to update device group' });
    }
  }
});

// Delete device group
app.delete('/api/device-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First, unassign all devices from this group
    await prisma.device.updateMany({
      where: { deviceGroupId: parseInt(id) },
      data: { deviceGroupId: null }
    });

    // Then delete the group
    await prisma.deviceGroup.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting device group:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Device group not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete device group' });
    }
  }
});

// Assign devices to group
app.put('/api/device-groups/:id/devices', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceIds } = req.body;

    if (!Array.isArray(deviceIds)) {
      return res.status(400).json({ error: 'deviceIds must be an array' });
    }

    const groupId = parseInt(id);

    // First, unassign all devices from this group
    await prisma.device.updateMany({
      where: { deviceGroupId: groupId },
      data: { deviceGroupId: null }
    });

    // Then assign the selected devices to this group
    if (deviceIds.length > 0) {
      await prisma.device.updateMany({
        where: { id: { in: deviceIds } },
        data: { deviceGroupId: groupId }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating device assignments:', error);
    res.status(500).json({ error: 'Failed to update device assignments' });
  }
});

// Block all devices in group
app.post('/api/device-groups/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = parseInt(id);

    // Get all devices in the group
    const devices = await prisma.device.findMany({
      where: { deviceGroupId: groupId }
    });

    if (devices.length === 0) {
      return res.json({ success: true, message: 'No devices in group' });
    }

    // Block each device via UniFi
    const macAddresses = devices.map(device => device.macAddress);
        
    for (const macAddress of macAddresses) {
      try {
        await unifi?.blockClient(macAddress);
      } catch (error) {
        console.warn(`Failed to block device ${macAddress}:`, error);
      }
    }

    // Update database
    await prisma.device.updateMany({
      where: { deviceGroupId: groupId },
      data: { active: false }
    });

    res.json({ success: true, blockedDevices: devices.length });
  } catch (error) {
    console.error('Error blocking group devices:', error);
    res.status(500).json({ error: 'Failed to block group devices' });
  }
});

// Unblock all devices in group
app.post('/api/device-groups/:id/unblock', async (req, res) => {
  try {
    const { id } = req.params;
    const groupId = parseInt(id);

    // Get all devices in the group
    const devices = await prisma.device.findMany({
      where: { deviceGroupId: groupId }
    });

    if (devices.length === 0) {
      return res.json({ success: true, message: 'No devices in group' });
    }

    // Unblock each device via UniFi
    const macAddresses = devices.map(device => device.macAddress);
        
    for (const macAddress of macAddresses) {
      try {
        await unifi?.unblockClient(macAddress);
      } catch (error) {
        console.warn(`Failed to unblock device ${macAddress}:`, error);
      }
    }

    // Update database
    await prisma.device.updateMany({
      where: { deviceGroupId: groupId },
      data: { active: true }
    });

    res.json({ success: true, unblockedDevices: devices.length });
  } catch (error) {
    console.error('Error unblocking group devices:', error);
    res.status(500).json({ error: 'Failed to unblock group devices' });
  }
});

// Helper functions for group scheduling
async function executeGroupSchedule(groupId, blockAllow, unifi, prisma) {
  try {
    // Get all devices in the group
    const group = await prisma.deviceGroup.findUnique({
      where: { id: groupId },
      include: { devices: true }
    });

    if (!group || !group.devices.length) {
      console.log(`No devices found in group ${groupId}`);
      return;
    }

    // Apply the schedule action to all devices in the group
    for (const device of group.devices) {
      try {
        if (blockAllow === 'block') {
          await unifi.blockClient(device.macAddress);
          await prisma.device.update({
            where: { id: device.id },
            data: { active: false }
          });
        } else {
          await unifi.unblockClient(device.macAddress);
          await prisma.device.update({
            where: { id: device.id },
            data: { active: true }
          });
        }
        console.log(`${blockAllow}ed device ${device.macAddress} in group ${group.name}`);
      } catch (error) {
        console.error(`Failed to ${blockAllow} device ${device.macAddress}:`, error);
      }
    }
  } catch (error) {
    console.error('Error executing group schedule:', error);
  }
}

function createCronPattern(hour, minute, ampm, daysOfWeek) {
  const militaryHour = convertToMilitaryTime(ampm, hour);
  const daysPattern = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek.join(',') : '*';
  return `${minute} ${militaryHour} * * ${daysPattern}`;
}

// Get schedules for a device group
app.get('/api/device-groups/:id/schedules', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const schedules = await prisma.easySchedule.findMany({
      where: { deviceGroupId: groupId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching group schedules:', error);
    res.status(500).json({ error: 'Failed to fetch group schedules' });
  }
});

// Create a new schedule for a device group
app.post('/api/device-groups/:id/schedules', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { date, hour, minute, oneTime, blockAllow, modifiedDaysOfTheWeek, ampm } = req.body;

    // Verify the group exists
    const group = await prisma.deviceGroup.findUnique({
      where: { id: groupId },
      include: { devices: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Device group not found' });
    }

    // Create schedule entry in database
    const scheduleData = {
      minute: parseInt(minute),
      hour: oneTime ? convertToMilitaryTime(ampm, hour) : parseInt(hour),
      ampm,
      blockAllow,
      oneTime,
      deviceGroupId: groupId,
      toggleSched: true
    };

    if (oneTime) {
      const { year, month, day } = dateFromDateString(date);
      scheduleData.month = month;
      scheduleData.date = date;
            
      // Create the schedule date
      const dateTime = new Date(year, month-1, day, scheduleData.hour, scheduleData.minute, 0);
            
      // Create cron job
      const jobName = `group_${groupId}_${Date.now()}`;
      const job = schedule.scheduleJob(jobName, dateTime, async () => {
        await executeGroupSchedule(groupId, blockAllow, unifi, prisma);
      });
            
      scheduleData.jobName = jobName;
    } else {
      // Recurring schedule
      const daysString = modifiedDaysOfTheWeek ? modifiedDaysOfTheWeek.join('') : '0123456';
      scheduleData.days = daysString;
            
      // Create cron job for recurring schedule
      const jobName = `group_${groupId}_${Date.now()}`;
      const cronPattern = createCronPattern(hour, minute, ampm, modifiedDaysOfTheWeek);
      const job = schedule.scheduleJob(jobName, cronPattern, async () => {
        await executeGroupSchedule(groupId, blockAllow, unifi, prisma);
      });
            
      scheduleData.jobName = jobName;
    }

    // Save to database
    const newSchedule = await prisma.easySchedule.create({
      data: scheduleData
    });

    res.json({ success: true, schedule: newSchedule });
  } catch (error) {
    console.error('Error creating group schedule:', error);
    res.status(500).json({ error: 'Failed to create group schedule' });
  }
});

// Delete a schedule for a device group
app.delete('/api/device-groups/:groupId/schedules/:scheduleId', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const groupId = parseInt(req.params.groupId);

    // Find and delete the schedule
    const scheduleRecord = await prisma.easySchedule.findFirst({
      where: { 
        id: scheduleId,
        deviceGroupId: groupId 
      }
    });

    if (!scheduleRecord) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Cancel the cron job if it exists
    if (scheduleRecord.jobName) {
      const existingJob = schedule.scheduledJobs[scheduleRecord.jobName];
      if (existingJob) {
        existingJob.cancel();
      }
    }

    // Delete from database
    await prisma.easySchedule.delete({
      where: { id: scheduleId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group schedule:', error);
    res.status(500).json({ error: 'Failed to delete group schedule' });
  }
});

// Toggle a schedule for a device group
app.put('/api/device-groups/:groupId/schedules/:scheduleId/toggle', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const groupId = parseInt(req.params.groupId);
    const { toggleSched } = req.body;

    const schedule = await prisma.easySchedule.findFirst({
      where: { 
        id: scheduleId,
        deviceGroupId: groupId 
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Handle group schedule toggling
    if (schedule.jobName) {
      // Cancel existing job using node-schedule
      const existingJob = schedule.scheduledJobs[schedule.jobName];
      if (existingJob) {
        existingJob.cancel();
      }
    }

    // Update the database record
    await prisma.easySchedule.update({
      where: { id: scheduleId },
      data: { toggleSched }
    });

    // If enabling the schedule, recreate the job
    if (toggleSched) {
      if (schedule.oneTime) {
        const { year, month, day } = dateFromDateString(schedule.date);
        const dateTime = new Date(year, month-1, day, schedule.hour, schedule.minute, 0);
                
        const jobName = `group_${groupId}_${Date.now()}`;
        const job = schedule.scheduleJob(jobName, dateTime, async () => {
          await executeGroupSchedule(groupId, schedule.blockAllow, unifi, prisma);
        });
                
        // Update job name in database
        await prisma.easySchedule.update({
          where: { id: scheduleId },
          data: { jobName }
        });
      } else {
        const cronPattern = createCronPattern(schedule.hour, schedule.minute, schedule.ampm, schedule.days ? schedule.days.split('').map(d => parseInt(d)) : []);
                
        const jobName = `group_${groupId}_${Date.now()}`;
        const job = schedule.scheduleJob(jobName, cronPattern, async () => {
          await executeGroupSchedule(groupId, schedule.blockAllow, unifi, prisma);
        });
                
        // Update job name in database
        await prisma.easySchedule.update({
          where: { id: scheduleId },
          data: { jobName }
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling group schedule:', error);
    res.status(500).json({ error: 'Failed to toggle group schedule' });
  }
});

//~~~~~~~temp delete test ids~~~~~~~~~
app.delete('/deletetestids', async (req, res) => {
  const { touchableIds, asda } = req.body;
  console.log('touchableIds \t', touchableIds);

  let path = `/v2/api/site/default/trafficrules/${asda[0]}`;
  try {
    await unifi.customApiRequest(path, 'DELETE', null);
  } catch (error) {
    console.error(error);
  }

  async function deleteTestIds(touchableIds) {
    // for (const id of touchableIds) {
    // let path = `/v2/api/site/default/trafficrules/${asda[0]}`;
    // try {
    //     await unifi.customApiRequest(path, 'DELETE', null)
    // } catch (error) {
    //     console.error(error)
    // }
    // }
  }
  // function chunkArray(array, chunkSize) {
  //     const chunks = [];
  //     for (let i = 0; i < array.length; i+=chunkSize) {
  //         chunks.push(array.slice(i, i+chunkSize))
  //     }
  //     return chunks;
  // }
  // async function deleteRulesInChunks(touchableIds, chunkSize) {
  //     const chunks = chunkArray(touchableIds, chunkSize);
  //     const successArray = [];
  //     for (const chunk of chunks) {
  //         const delResult = await deleteTestIds(chunk);
  //         successArray.push(delResult)
  //     }
  //     return successArray;
  // }
  // const chunkSize = 5;
  // deleteRulesInChunks(touchableIds, chunkSize)
  //     .then((successArray) => {
  //         console.log(successArray.length);
  //         res.json({ successArray: successArray })
  //     }).catch(error => console.error(error, 'Error deleting many...'))
});


//~~~~~~refresh redirect~~~~~~
app.get('**', async (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'dist', 'index.html'));
});

// ---- Global error-handling middleware ----
// Catches errors forwarded by asyncHandler (rejected promises in route
// handlers). Sends a 500 JSON response instead of leaving the request hanging.
app.use(async (err, req, res, next) => {
  console.error('Unhandled route error:', err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  let diag = false;
  try {
    diag = await isDiagnosticsEnabled(prisma);
  } catch (e) {
    diag = false;
  }
  res.status(500).json(diag
    ? { error: 'Internal server error.', details: err?.message }
    : { error: 'Internal server error.' });
});

const PORT = process.env.PORT || customPORT; // portSettings.js

// Restore bonus-time timers that survived a container restart
(async () => {
  try {
    const deviceResult = await reArmDeviceBonusOnBoot(unifi, prisma, jobFunction, schedulerService);
    console.log(`[boot] Device bonus timers re-armed: ${deviceResult.rearmed}, expired: ${deviceResult.expired}`);
    const ruleResult = await reArmTrafficBonusOnBoot(unifi, prisma);
    console.log(`[boot] Traffic rule bonus timers re-armed: ${ruleResult.rearmed}, expired: ${ruleResult.expired}`);
    const schedResult = await reArmTrafficRuleSchedulesOnBoot(unifi, prisma);
    console.log(`[boot] Traffic rule schedules re-armed: ${schedResult.rearmed}`);
  } catch (error) {
    console.error('[boot] Failed to restore bonus timers:', error);
  }
})();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}....`);
});

process.on('SIGINT', function () {
  console.log('~SIGINT FIRED~');
  schedule.gracefulShutdown()
    .then(() => process.exit(0));
});