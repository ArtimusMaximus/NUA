const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Unifi = require('node-unifi');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
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
const { logger } = require("./server_util_funcs/server_log_utils/customLogger");
const { cronBonusTimeEndJobReinitiation } = require("./server_util_funcs/cronBonusTimeEndJobReinitiation");
const { easyBonusTimeEndJobReinitiation } = require("./server_util_funcs/easyBonusTimeEndJobReinitiation");
const { minutesHoursToMilli } = require("./server_util_funcs/minutesHoursToMilli");
const { convertToMilitaryTime } = require('./server_util_funcs/convert_to_military_time');
const { dateFromDateString } = require('./server_util_funcs/ez_sched_utils/dateFromDateString');




// Init sqlite db
(async () => {
    const db = await open({
        filename: './config/nodeunifi.db', // changed 07/25/2024
        driver: sqlite3.Database
    })
})();
const prisma = new PrismaClient();

// create server & add middleware
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(process.cwd().slice(0, -7) + '/dist'));
consoleReader(schedule);

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
            console.error('Error writing item: ', item, error)
        }
    })

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
            red('Credentials already exist!', 'teal')
            return;
        }
    } catch (error) {
        console.error(error)
    }
}
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
    unifi = new Unifi.Controller({hostname: hostname, port: port, sslverify: sslverify});
    const loginData = await unifi.login(username, password);
    if (loginData) {
        return { unifi, validCredentials: true };
    } else {
        return { validCredentials: false };
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
            return loginData;
        } else {
            throw Error("Could NOT FETCH LOGIN DATA.");
        }
    } catch (error) {
        if (error) {
            console.error('getAdminLoginInfo error in fetchLoginInfo: ', error);
            throw new Error('No credentials were found');
        }
    }
}

let unifi;
const init = async () => {
    try {
        const loginData = await fetchLoginInfo();
        await logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password);
        ezScheduleRoutes(app, unifi, prisma, schedule, jobFunction);
    } catch (error) {
        throw Error("Could not establish UNIFI INSTANCE.");
    }
}
init();
// console.log('unifi\t', unifi);

// info
//     .then(() => logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password))
//     .then(() => console.log('.then() => unifi \t'))
//     .catch((error) => console.error(error))

async function getBlockedUsers() {
    const blockedUsers = await unifi.getBlockedUsers();
    if (blockedUsers === undefined) {
        return [];
    } else {
        return blockedUsers;
    }
}
async function blockMultiple(reqBodyArr) {
    for (const mac of reqBodyArr) {
        try {
            const result = await unifi.blockClient(mac);
            if (typeof result === 'undefined' || result.length <= 0) {
                throw new Error(`blockMultiple(): ${JSON.stringify(result)}`)
            } else {
                console.log(`Successfully blocked: ${mac}`);
            }
        } catch (error) {
            if (error) throw error;
        }
    }
}
async function unBlockMultiple(reqBodyArr) {
    for (const mac of reqBodyArr) {
        try {
            const result = await unifi.unblockClient(mac);
            if (typeof result === 'undefined' || result.length <= 0) {
                throw new Error(`blockMultiple(): ${JSON.stringify(result)}`)
            } else {
                console.log(`Successfully unblocked: ${mac}`);
            }
        } catch (error) {
            if (error) throw error;
        }
    }
}
async function unblockSingle(reqBodyMac) {
    try {
        const result = await unifi.unblockClient(reqBodyMac);
        if (typeof result === 'undefined' || result.length <= 0) {
            throw new Error(`Error blocking mac address: ${reqBodyMac}. ${JSON.stringify(result)}`)
        } else {
            console.log(`Successfully unblocked ${reqBodyMac}`);
        }
    } catch (error) {
        console.error(error);
    }
}
function extractMacs(body) {
    // console.log(body);
    return body.macData.map(mac => mac.macAddress);
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





app.get('/getmacaddresses', async (req, res) => {
    try {
        const currentCredentials = await prisma.credentials.findUnique({
            where: {
                id: 1
            }
        });
        const { initialSetup } = currentCredentials;

        if (!initialSetup) {
            let macData = await prisma.device.findMany();
            // let getRefreshTimer = await prisma.credentials.findUnique({
            //     where: {
            //         id: 1
            //     }
            // });
            // let refreshRate = getRefreshTimer.refreshRate;

            // const blockedUsers = await unifi?.getBlockedUsers(); // old 03/11/2024
            const blockedUsers = await getBlockedUsers();
            // console.log('blockedUsers in get mac addresses \t', blockedUsers);
            // console.log('refreshRate \t', refreshRate);

            const doMacAddressMatch = (unifiDataMacAddress, macData) => {
                return macData.some(obj => obj.macAddress === unifiDataMacAddress);
            }
            let matchedObjects;
            if (blockedUsers.length) {
                matchedObjects = blockedUsers?.filter(obj1 => doMacAddressMatch(obj1.mac, macData))
            } else {
                matchedObjects = [];
            }
            if (matchedObjects.length === 0) {
                const recordIds = macData.map(obj => obj.id);
                const updateData = { active: true };
                const updateRecordsToActive = async (recordIds, updateData) => {
                    try {
                        const updatedMacData = await prisma.device.updateMany({
                            where: {
                                id: {
                                    in: recordIds,
                                },
                            },
                            data: updateData
                        });
                        const newMacData = await prisma.device.findMany();
                        res.json({ macData: newMacData, blockedUsers: blockedUsers });
                    } catch (error) {
                        console.error(error);
                    }
                }
                updateRecordsToActive(recordIds, updateData);

            } else if (matchedObjects.length >= 1) { // something is inactive
                const findBlocked = matchedObjects.filter(obj => obj.blocked === true);
                const extractedMacAddress = findBlocked.map(blockedMac => blockedMac.mac);
                const matchedMacAddys = macData.filter(macData => extractedMacAddress.includes(macData.macAddress));
                const recordIds = matchedMacAddys.map(obj => obj.id);
                const updateData = { active: false };
                const updateRecordsToActive = async (recordIds, updateData) => {
                    try {
                        const updatedMacData = await prisma.device.updateMany({
                            where: {
                                id: {
                                    in: recordIds,
                                },
                            },
                            data: updateData
                        });
                        const newMacData = await prisma.device.findMany();
                        res.json({ macData: newMacData, blockedUsers: blockedUsers });
                    } catch (error) {
                        console.error(error);
                    }
                }
                updateRecordsToActive(recordIds, updateData);
            }
        } else {
            throw new Error('This is the initial setup, redirect.');
        }
    } catch (error) {
        if (error) {
            console.error('error in /getmacaddresses: \t');
            handleLoginError(error);
            res.sendStatus(401);
        }
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

            if (typeof refreshRate !== "number") {
                refreshRate = 60000;
            }
            const intervalId = setInterval(sendUpdate, refreshRate);


            req.on('close', () => {
                clearInterval(intervalId);
            });
        }
    } catch (error) {
        console.error(error);
        // res.sendStatus(500).json({ error: "Internal Server Error." });
    }
});

app.post('/addmacaddresses', async (req, res) => {

    const blockedUsers = await unifi.getBlockedUsers();
    const { name, macAddress } = req.body;

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
        if (error) throw error;
        res.send({ message: "There was an error."})
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
    try {
        let name;
        if (customName) {
            name = customName;
        } else if (hostname) {
            name = hostname;
        } else if (mac) {
            name = mac;
        } else {
            name = "Unnamed Device";
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

        res.json(getDeviceInfo)
    } catch (e) {
        if (e) throw e;
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
        if (error) throw error;
    }
});

app.put('/updatemacaddressstatus', async (req, res) => { // toggler

    const { id, macAddress, active } = req.body;
    //bypass front end active for now
    try {
        // console.log('Login Data: ', loginData);
        const blockedUsers = await unifi.getBlockedUsers();

    ///////////////////////////////////// confirm user is blocked below////////////////
        const filterBlockedUsers = blockedUsers.filter((device) => {
            return device.mac === macAddress
        });
        // console.log('Filtered only blocked users from db: ', filterBlockedUsers);
        // console.log(blockedUsers);
    ///////////////////////////////////// bash block device command here///////////////
    //////////////////////////////////// to toggle we need to be able to unblock as well
    // const { stdout, stderr } = await exec(`php ${active ? '/opt/nodeunifi/API-client/block_list.php' : '/opt/nodeunifi/API-client/unblock_list.php'} ${macAddress}`)
        // console.log(stdout);
        if (active) {
            await unifi.blockClient(macAddress)
        } else {
            await unifi.unblockClient(macAddress)
        }
        /////////////////////////////////////update to database here///////////////////////
        const updateUser = await prisma.device.update({
            where: {
                id,
                macAddress
            },
            data: {
                active: !active
            }
        });
    ////////////////////////////////////send back to front end ////////////////////////
        res.json({ updatedUser: updateUser, blockedUsers: blockedUsers });
        // const logoutData = await unifi.logout(); // getting an error when logging out after each request, perhaps too many requests in a short period of time?
    } catch (error) {
        if (error) throw error;
    }
});

app.put('/blockallmacs', async (req, res) => {
    const { data } = req.body;
    const filteredIds = data?.map((mac) => {
        return mac?.id;
    });
    const updatedData = {
        active: false
    }
    try {
        const filtMacs = extractMacs(req.body)
        await blockMultiple(filtMacs);
        const updatedRecords = await prisma.device.updateMany({
            where: {
                id: {
                    in: filteredIds,
                }
            },
            data: updatedData
        });
        res.json({ updatedRecords });
    } catch (error) {
        if (error) throw error;
    }
});

app.put('/unblockallmacs', async (req, res) => {
    const { data } = req.body;
    const filteredIds = data?.map((mac) => {
        return mac?.id;
    });
    const updatedData = {
        active: true
    }
    try {
        const filtMacs = extractMacs(req.body)
        await unBlockMultiple(filtMacs);
        const updatedRecords = await prisma.device.updateMany({
            where: {
                id: {
                    in: filteredIds,
                }
            },
            data: updatedData
        });
        res.json({ updatedRecords });
    } catch (error) {
        if (error) throw error;
    }
});

app.post('/unblockmac', async (req, res) => {
    const { mac, prismaDeviceId } = req.body;
    console.log(mac);
    console.log(req.body);
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
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
    }
});

app.put('/updatedevicedata', async (req, res) => { // Devices.jsx device edit
    const { name, macAddress, id } = req.body;
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
    res.json({ message: "Deletion successful", dataDeleted: removeDevice })
});

app.get('/checkjobreinitiation', async (req, res) => {
    try {
        // @todo - also pull from prisma.easyschedule.findMany(); for job re-initiation - 05 16 2024 // working on 06/10/2024
        const previousCronJobData = await prisma.cron.findMany();
        const getMacAddress = await prisma.device.findMany();
        const previousEzScheduleData = await prisma.easySchedule.findMany();

        const { scheduledJobs } = schedule; // node-schedule


        // console.log("scheduledJobs\t", scheduledJobs);

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
        // RESCHEDULE JOBS
        for (const data of matchingCronIds) {
            if (scheduledJobs[data.jobName] === undefined && data.toggleCron === true) { // reschedule jobs === undefined
                let reInitiatedJob = schedule.scheduleJob(data.crontime, () => jobFunction(data.crontype, data.matchedMacAddress.macAddress, false, unifi, prisma));
                newCronJobNames.push({...data, jobName: reInitiatedJob.name});
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
            updatedCronJobs.push(updateNewCronJobNames)
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
                let d = data.days.split("").map(day => parseInt(day));
                data.modifiedDaysOfTheWeek = d;
            }
            if (scheduledJobs[data.jobName] === undefined && data.toggleSched) { // reschedule jobs === undefined
                if (data.oneTime) {
                    if (data.date) { // job was in past, delete or reschedule
                        let oneTimeScheduleDate = new Date(`${data.date} ${data.hour}:${data.minute}:00`);
                        let currentDate = new Date();
                        // console.log('oneTimeScheduleDate\t', oneTimeScheduleDate);
                        // console.log('currentDate\t', currentDate);
                        if (oneTimeScheduleDate < currentDate) {
                            console.log('Date was less than current date');
                            const deleteOldPrismaDate = await prisma.easySchedule.delete({ where: { id: data.id } });
                            console.log("deleteOldPrismaDate\t", deleteOldPrismaDate);
                        } else {
                            const reInitiatedJob = await updateOneTimeSchedule(data, unifi, prisma, jobFunction, schedule);
                            console.log('reInitiatedJob OneTime Success! name:\t', reInitiatedJob?.name);
                            newEZJobNames.push({ ...data, jobName: reInitiatedJob?.name });
                        }
                    }
                } else if (!data.oneTime) {
                    const reInitiatedJob = await updateRecurringSchedule(data, unifi, prisma, jobFunction, schedule); // ORIGINAL
                    newEZJobNames.push({ ...data, jobName: reInitiatedJob?.name }); // ORIGINAL
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
            updatedEZJobs.push(updatenewEZJobNames)
        }
        res.json({
            previousCronJobData,
            previousEzScheduleData,
            getMacAddress,
            updatedEZJobs,
            updatedCronJobs
        });
     } catch (error) {
        if (error) console.error(error);
     }
});

// ~~~~~~~~~crons~~~~~~~~~~~
app.post('/addschedule', async (req, res) => { // adds cron data specific front end device && cron validator
    const { id, crontype, croninput, toggleCron, jobName } = req.body;
    serverLogger(JSON.stringify(req.body), "nua.log");
    try {
        const deviceToSchedule = await prisma.device.findUnique({
            where: {
                id: id
            }
        });
        console.log('Device to schedule ', deviceToSchedule) // job creation removed from here spefically to be performed in /togglecron
        // const jobFunction = async (crontype, macAddress) => {
        //     if (crontype === 'allow') {
        //         await unifi.unblockClient(macAddress)
        //         console.log(`${macAddress} has been unblocked.`);
        //     } else if (crontype === 'block') {
        //         await unifi.blockClient(macAddress)
        //         console.log(`${macAddress} has been blocked.`);
        //     }
        // }
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

                let jb = jobName;
                const getMacAddress = await prisma.device.findUnique({ where: { id: id} });
                console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);
                    console.log('continue new');
                    const startNewJob = schedule.scheduleJob(croninput, () => jobFunction(crontype, getMacAddress.macAddress, false, unifi, prisma));

                if (addCron) { // add device id
                    // const addDeviceId = await prisma.cron.update({
                    //     where: {
                    //         id: addCron.id
                    //     },
                    //     data: {
                    //         deviceId: id
                    //     }
                    // });
                    const updateCronJobName = await prisma.cron.update({
                        where: { id: addCron.id },
                        data: {
                            deviceId: id,
                            jobName: startNewJob.name
                            // jobName: toggleCron ? jb.name : jobName
                        }
                    });
                }
                res.json(addCron);
            } else {
                res.status(422).send({ message: "Invalid Cron Type, please try again." })
            }
        } catch (error) {
            console.error(error);
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
        const jobToCancel = schedule.scheduledJobs[jobName]
        console.log('Job Name cancelled: ', jobToCancel?.name);
        jobToCancel?.cancel();

        res.json({ message: "Data Deleted Succesfully.", dataDeleted: deleteCron });

    } catch (error) {
        if (error) throw error;
    }
});

app.put('/togglecron', async (req, res) => {
    const { id, toggleCron, jobName, crontime, crontype, deviceId } = req.body;
    // serverLogger(`Toggle on off ${toggleCron}`, "nua.log");
    // const { id, deviceId, jobName, ezBlockAllow, ezDate, toggleEZSched } = req.body
    // I believe the issue here is that you are not getting the job name from the front end, try node-schedule again -TRUE & Successful....
    let jb = jobName;
    try {
        const getMacAddress = await prisma.device.findUnique({ where: { id: deviceId } });
        console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);

        if (toggleCron === false && jobName !== '') {
            const cancelled = schedule?.cancelJob(jobName);
            console.log('Cancelled Job?: ', cancelled);
        } else if (toggleCron === true) {
            console.log('continue');
            const reInitiatedJob = schedule.scheduleJob(crontime, () => jobFunction(crontype, getMacAddress.macAddress, false, unifi, prisma));
            jb = reInitiatedJob.name;
            console.log('jb.name: ', jb.name);
        }
        const updateCronToggle = await prisma.cron.update({
            where: { id: id },
            data: {
                toggleCron: toggleCron,
                jobName: jb
                // jobName: toggleCron ? jb.name : jobName
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
        if (error) throw error;
     }
});

// ~~~~~~~schedules~~~~~~~~~~

// ~~~~~~
app.post('/savesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify, refreshRate } = req.body;
    console.log(req.body);

    red(sslverify, 'teal')
    let sslBool;
    if (sslverify === 'false') {
        sslBool = false;
    } else if (sslverify === 'true') {
        sslBool = true;
    }
    try {
        const siteCredentials = await prisma.credentials.create({
            data: {
                username: username,
                password: password,
                hostname: hostname,
                port: parseInt(port),
                sslverify: sslBool,
                refreshRate: parseInt(refreshRate)
            }
        });
        res.json({ siteCredentials })
    } catch (error) {
        if(error) throw error;
    }
});

app.put('/updatesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify, id, refreshRate } = req.body;
    let sslBool;
    if (sslverify === 'false') {
        sslBool = false;
    } else if (sslverify === 'true') {
        sslBool = true;
    }
    try {
        const siteCredentials = await prisma.credentials.update({
            where: {
                id: id,
            },
            data: {
                username: username,
                password: password,
                hostname: hostname,
                port: parseInt(port),
                sslverify: sslBool,
                refreshRate: parseInt(refreshRate)
            }
        });
        res.json({ message: 'Credentials successfully saved!' })
    } catch (error) {
        if(error) throw error;
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
        console.log('checkForSettings \t', checkForSettings);
        if (checkForSettings) {
            res.json(checkForSettings)
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        if (error) throw error;
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
            const unifiTest = new Unifi.Controller({ hostname: adminLogin.hostname, port: adminLogin.port,  sslverify: adminLogin.sslverify });

            // console.log('unifiTest \t', unifiTest);
            const testCredentials = await unifiTest.login(adminLogin.username, adminLogin.password);
            console.log("Test Credentials: ", testCredentials); // returns true, not login info
        if (testCredentials === true) {
            const info = fetchLoginInfo();
            info
                .then(() => logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password))
                .then(() => console.log('.then() => unifi \t'))
                .catch((error) => console.error(error))
            const setInitialSetupFalse = await prisma.credentials.update({ where: { id: 1 }, data: { initialSetup: false } }); // setup complete
            res.sendStatus(200);
        }

        } catch (error) {
            // if (error) throw error;
            if (error) {
                console.log('Catch Error: ', error?.code);
                // res.sendStatus(401);
                res.status(401).json({ message: error?.code })

                // console.log('Catch Error: ', error.request)
                // throw error;
            }
        }
    // }
    // getAdminLoginInfo();
});

app.get('/getallblockeddevices', async (req, res) => {
    try {
        const blockedUsers = await getBlockedUsers();
        const deviceList = await prisma.device.findMany();
        res.json({ blockedUsers: blockedUsers, deviceList: deviceList })
    } catch (error) {
        console.error(error);
    }
});

app.get('/getalldevices', async (req, res) => {
    try {
        // const getAccessDevices = await unifi.getAccessDevices();
        const getClientDevices = await unifi.getAllUsers();
        // const getClientDevices = await unifi.getClientDevices();
        const getDeviceList = await prisma.device.findMany();
        // console.log(getClientDevices);
        res.json({ getClientDevices: getClientDevices, getDeviceList: getDeviceList })
        // res.sendStatus(200)
    } catch (error) {
        console.error(error);
    }
});

app.get('/getcurrentdevices', async (req, res) => {
    try {
        const getDeviceList = await prisma.device.findMany();
        res.json({ getDeviceList: getDeviceList });
    } catch (error) {
        console.error(error);
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
        if (error) throw error;
    }
});

app.put('/updatetheme', async (req, res) => {
    try {
        const updateTheme = await prisma.credentials.update({
            where: {
                id: 1,
            },
            data: req.body
        });
        res.json(updateTheme)
    } catch (error) {
        if (error) throw error;
    }
});

//~~~~~~potential login~~~~~~
app.post('/login', (req, res) => {
    console.log(req.body);
    if (req.body.username === 'a' && req.body.password === 'a') {
        res.sendStatus(200)
    } else {
        res.sendStatus(500)
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
        }
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
        const result = await unifi.customApiRequest(path, 'GET');

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
            }
        });
        if (joinedData.length) {
            res.status(200).json({ trafficRuleDbData: joinedData, unifiData: result });
        } else if (result.length && !joinedData.length) {
            res.status(206).json({ unifiData: result });
        }
    } catch (error) {
        console.error(error);
    }
});

app.post('/addcategorytrafficrule', async (req, res) => {
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
                allData.push(update)
            }
            return allData;
        }
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
        }
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
                allData.push(setAppIds)
            }
            return allData;
        }
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
                allData.push(setAppIds)
            }
            return allData;
        }
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
                allData.push(update)
            }
            return allData;
        }
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
        }
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
    const { _id, trafficRuleId, unifiObjCopy } = req.body;
    console.log('unifiObjCopy \t', unifiObjCopy);
    try {
        const path = `/v2/api/site/default/trafficrules/${_id}`

        const result = await unifi.customApiRequest(path, 'PUT', unifiObjCopy)
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
        res.status(400).json({ error: error })
        console.error(error);
    }
});

app.delete('/deletecustomapi', async (req, res) => { // deletes unifi rule, not db (yet)
    const { _id, trafficRuleId } = req.body;
    console.log('id of rule to delete \t', _id);
    console.log('trafficRuleId \t', trafficRuleId);
    const path = `/v2/api/site/default/trafficrules/${_id}`
    try {
        // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
        const checkForExistingUnifiRule = await unifi.customApiRequest('/v2/api/site/default/trafficrules', 'GET');
        console.log('checkForExistingUnifiRule \t', checkForExistingUnifiRule);
        const checkFilter = checkForExistingUnifiRule.filter((rule) => {
            return rule._id === _id
        });
        if (checkFilter.length) {
            const result = await unifi.customApiRequest(path, 'DELETE', null)
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
                console.log('Traffic Rule and associated entries deleted successfully!')
            } catch (error) {
                console.error('Error Deleting TrafficRule and associated entries.');
            } finally {
                await prisma.$disconnect();
            }
        }
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
                            client_mac: appCloneTargetDevice.client_mac ? appCloneTargetDevice.client_mac : "Not a client device",
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
        res.sendStatus(502)
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
        }
        await unmanageTrafficRule(parseInt(dbId));

    } catch (error) {
        console.error(error);
    }
});


// ~~~~~~~~~~TEMPORARY TESTING~~~~~~~~~~~~~~
//~~~~~~temp get all available devices~~~~~~
app.post('/getallworking', async (req, res) => {
    const { arrayOfObjects } = req.body;
    const path = '/v2/api/site/default/trafficrules';

    const getAllWorkingCategories = async (arrayObjects) => {
        let failedRequests = [];
        let successfulRequests = [];
        for (const arrayObject of arrayObjects) {
            try {
                await unifi.customApiRequest(path, 'POST', arrayObject);
                successfulRequests.push({ arrayObject })
            } catch (error) {
                failedRequests.push({ arrayObject });
            }
        }
        return { successfulRequests, failedRequests }
    }
    function chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i+=chunkSize) {
            chunks.push(array.slice(i, i+chunkSize))
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
            allSuccessfulApps = allSuccessfulApps.concat(successfulRequests)
        }
        return { allSuccessfulApps, allFailedApps };
    }
    const chunkSize = 5;
    sendRequestsInChunks(arrayOfObjects, chunkSize)
        .then(({ allSuccessfulApps, allFailedApps }) => {
            console.log('successfulCategories \t', allSuccessfulApps.length);
            console.log('failedCategories \t', allFailedApps.length);
            res.json({ allSuccessfulApps: allSuccessfulApps, allFailedApps: allFailedApps })
            console.log('allSuccessfulApps.length: \t', allSuccessfulApps.length);
            // const mappedIds = allSuccessfulApps.flatMap(item => item.app_ids || []);
            // allSuccessfulApps.forEach(item => console.log('item.app_ids: \t', item.app_ids)) // undefined
            // writeJSONApps(mappedIds)
            writeJSONApps(allSuccessfulApps);
        })
        .catch((error) => console.error(error));
});

app.post('/addbonustime', async (req, res) => { // cron bonus time
    const { hours, minutes, deviceId } = req.body;
    console.log("hours minutes\t", hours, minutes);

    try {
        if (hours || minutes) {
            const t = minutesHoursToMilli(minutes, hours);
            res.status(200).send({ msg: "Confirmed", timer: t });
            // database and device shutdown logic here

            const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});
            console.log("getMacAddressForDevice\t", getMacAddressForDevice);

            const getEasyDevices = await prisma.easySchedule.findMany({ where: { deviceId: deviceId }});
            // console.log('getEasyDevices\t', getEasyDevices);

            const getCrons = await prisma.cron.findMany({ where: { deviceId: deviceId }});
            // console.log('getCrons\t', getCrons);

            for (const easyRule of getEasyDevices) {
                if (easyRule.toggleSched) {
                    console.log('easyRule toggleSched = true\t', easyRule);
                    const cancelled = schedule.cancelJob(easyRule.jobName);
                    console.log('cancelled\t', cancelled);
                    if(cancelled) {
                        const updateEasy = await prisma.easySchedule.update({
                            where: { id: easyRule.id },
                            data: {
                                toggleSched: false
                            }
                        });

                        const createEasyBonusToggleOff = await prisma.easyBonusToggles.create({
                            data: {
                                easyRuleIDToggledOff: easyRule.id,
                                blockAllow: easyRule.blockAllow,
                                macAddress: getMacAddressForDevice.macAddress,
                                toggleSched: easyRule.toggleSched,
                                oneTime: easyRule.oneTime,
                                date: easyRule.date,
                                ampm: easyRule.ampm,
                                hour: easyRule.hour,
                                minute: easyRule.minute,
                                days: easyRule.days,
                                month: easyRule.month,
                                device: {
                                    connect: { id: easyRule.deviceId }
                                }
                            }
                        });
                    }
                }
            }

            //////////////////////////// cancels job and changes db entry for CRON ////////////////////
            for (const cronRule of getCrons) {
                console.log('cronRule.toggleSched\t', cronRule.id, cronRule.toggleCron);

                if (cronRule.toggleCron) {
                    const cancelled = schedule?.cancelJob(cronRule.jobName);
                    console.log('Cancelled Bonus Button Job?: ', cancelled);

                    if (cancelled) {
                        const updateCron = await prisma.cron.update({
                            where: { id: cronRule.id },
                            data: {
                                toggleCron: false
                                // jobName: jb
                            }
                        });

                        const createCronBonusToggleOff = await prisma.cronBonusToggles.create({
                            data: {
                                cronRuleIDToggledOff: cronRule.id,
                                crontype: cronRule.crontype,
                                crontime: cronRule.crontime,
                                macAddress: getMacAddressForDevice.macAddress,
                                device: {
                                    connect: { id: cronRule.deviceId }
                                }
                            }
                        });
                    }
                }
            }

            console.log("Time converted to milli:\t", t);
            console.log("Time converted to Seconds:\t", t/1000);
            async function restartPausedJobs(time) {
                try {
                    await new Promise(res => setTimeout(res, time));
                    await cronBonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger);
                    await easyBonusTimeEndJobReinitiation(deviceId, schedule, prisma, unifi, jobFunction, logger);
                } catch (error) {
                    console.error(error);
                }
            }
            await restartPausedJobs(t);
        }


        // const bonusTimeEnding = schedule.scheduleJob(bonusToggle.crontime, () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma));

            // let jb = jobName;
            // if (toggleCron === false && jobName !== '') {
            //     const cancelled = schedule?.cancelJob(jobName);
            //     console.log('Cancelled Job?: ', cancelled);
            // } else if (toggleCron === true) {
            //     console.log('continue');
            //     const reInitiatedJob = schedule.scheduleJob(crontime, () => jobFunction(crontype, getMacAddress.macAddress, false, unifi, prisma));
            //     jb = reInitiatedJob.name;
            //     console.log('jb.name: ', jb.name);
            // }
            // const updateCronToggle = await prisma.cron.update({
            //     where: { id: id },
            //     data: {
            //         toggleCron: toggleCron,
            //         jobName: jb
            //         // jobName: toggleCron ? jb.name : jobName
            //     }
            // });
        ///////////////////////////


    } catch (error) {
        console.error(error);
    }
});

app.post("/deletebonustoggles", async (req, res) => { // simulate the bonus time ending
    const { deviceId } = req.body;
    try {
        const getCronBonusTogglesToDelete = await prisma.cronBonusToggles.findMany({ where: { deviceId: deviceId }});
        const getEasyBonusTogglesToDelete = await prisma.easyBonusToggles.findMany({ where: { deviceId: deviceId }});
        // const getOriginalCrons = await prisma.cron.findMany({ where: { deviceId: deviceId }});
        // console.log('getCronBonusTogglesToDelete\t', getCronBonusTogglesToDelete);
        const getMacAddressForDevice = await prisma.device.findUnique({ where: { id: deviceId }});

        let jb;
        for (const bonusToggle of getCronBonusTogglesToDelete) {
            await prisma.cronBonusToggles.delete({ where: { id: bonusToggle.id }});

            const reInitiatedJob = schedule.scheduleJob(bonusToggle.crontime, () => jobFunction(bonusToggle.crontype, bonusToggle.macAddress, false, unifi, prisma));
            // const jobFunction = async (crontype, macAddress, oneTime, unifi, prisma) => {
            jb = reInitiatedJob.name;
            console.log('jb.name: ', jb);
            logger.log('jb.name: ', jb);

            const updateCronToggle = await prisma.cron.update({
                where: { id: bonusToggle.cronRuleIDToggledOff },
                data: {
                    toggleCron: true,
                    jobName: jb
                }
            });
        }
        /////////////////////////////////////////////////////
        for (const bonusToggle of getEasyBonusTogglesToDelete) {
            const { date, hour, minute, ampm, oneTime, macAddress, blockAllow, days } = bonusToggle;

            const modifiedHour = convertToMilitaryTime(ampm, parseInt(hour));
            if (!oneTime) {
                ////////////////////////////////////////
                const modifiedDaysOfTheWeek = days && days.split("").map((day) => parseInt(day));
                const rule = new schedule.RecurrenceRule();
                rule.dayOfWeek = [...modifiedDaysOfTheWeek];
                rule.hour = modifiedHour;
                rule.minute = parseInt(minute);
                const reInitiatedJob = schedule.scheduleJob(rule, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
                jb = reInitiatedJob.name;

                console.log('jb.name: ', jb);
                logger.log('Job re-initiated: ', reInitiatedJob);

                await prisma.easySchedule.update({ // put original ez schedule back as was
                    where: { id: bonusToggle.easyRuleIDToggledOff },
                    data: {
                        toggleSched: true,
                        jobName: jb
                    }
                });
                await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }}); // delete easyToggle
                /////////////////////////////////////////
            } else { // oneTime schedule
                const { year, month, day } = dateFromDateString(date);
                const dateTime = new Date(year, month-1, day, modifiedHour, parseInt(minute), 0);
                const reInitiatedJob = schedule.scheduleJob(dateTime, () => jobFunction(blockAllow, macAddress, oneTime, unifi, prisma));
                jb = reInitiatedJob.name;
                console.log('jb.name: ', jb);
                logger.log('Job re-initiated: ', reInitiatedJob);

                await prisma.easySchedule.update({ // put original ez schedule back as was
                    where: { id: bonusToggle.easyRuleIDToggledOff },
                    data: {
                        toggleSched: true,
                        jobName: jb
                    }
                });
                await prisma.easyBonusToggles.delete({ where: { id: bonusToggle.id }});
            }
        }
        await unifi.blockClient(getMacAddressForDevice.macAddress);
        // console.log("blockDevice\t", blockDevice);
        await prisma.device.update({
            where: { id: deviceId },
            data: {
                active: false
            }
        });


    } catch (error) {
        console.error(error);
    }
});

// ~~~~force error test~~~~
app.post('/submitapptest', async (req, res) => {
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

//~~~~~~~temp delete test ids~~~~~~~~~
app.delete('/deletetestids', async (req, res) => {
    const { touchableIds, asda } = req.body;
    console.log('touchableIds \t', touchableIds);

    let path = `/v2/api/site/default/trafficrules/${asda[0]}`;
            try {
                await unifi.customApiRequest(path, 'DELETE', null)
            } catch (error) {
                console.error(error)
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
    res.sendFile(process.cwd().slice(0, -7) + '/dist/index.html')
});

const PORT = process.env.PORT || customPORT; // portSettings.js
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}....`)
});

process.on('SIGINT', function () {
    console.log('~SIGINT FIRED~');
    schedule.gracefulShutdown()
    .then(() => process.exit(0))
});