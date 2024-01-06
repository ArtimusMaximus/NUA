const express = require('express');
const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const cors = require('cors');
const bodyParser = require('body-parser');
// const Unifi = require('node-unifi');
const Unifi = require('node-unifi');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { PrismaClient } = require('@prisma/client');
const schedule = require('node-schedule');
const cronValidate = require('node-cron');


(async () => {
    const db = await open({
        filename: './nodeunifi.db',
        driver: sqlite3.Database
    })
})()
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(process.cwd().slice(0, -7) + '/dist'));


let unifi;
async function logIntoUnifi(hostname, port, sslverify, username, password)
{
    unifi = new Unifi.Controller({hostname: hostname, port: port, sslverify: sslverify});
    const loginData = await unifi.login(username, password);
    // console.log('Login Data from unifi logIntoUnifi: ', loginData);
    return unifi;
}

let loginData;
const fetchLoginInfo = async () => {
    const getAdminLoginInfo = async () => {
        try {
          const adminLogin = await prisma.credentials.findMany();
        //   console.log(adminLogin);
          loginData = adminLogin.pop();

        //   console.log('loginData ', loginData);
          return loginData;
        } catch (error) {
            if (error) throw error;
        }
    }
    return getAdminLoginInfo();
}
const info = fetchLoginInfo();
info
    // .then(() => console.log('then ', loginData))
    // .then(() => handleUnifiInit(loginData.hostname, loginData.port, loginData.sslverify))
    .then(() => logIntoUnifi(loginData.hostname, loginData.port, loginData.sslverify, loginData.username, loginData.password))

async function getBlockedUsers()
{
    const blockedUsers = await unifi.getBlockedUsers();
    return blockedUsers;
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
function extractMacs(body) {
    // console.log(body);
    return body.macData.map(mac => mac.macAddress)
}
function validateCron(crontype) {
    let validation = cronValidate.validate(crontype);
    console.log('validation func: ', validation)
    return validation;
}
const jobFunction = async (crontype, macAddress) => {
    if (crontype === 'allow') {
        await unifi.unblockClient(macAddress)
        console.log(`${macAddress} has been unblocked.`);
    } else if (crontype === 'block') {
        await unifi.blockClient(macAddress)
        console.log(`${macAddress} has been blocked.`);
    }
}

app.get('/getmacaddresses', async (req, res) => {
    try {
        const blockedUsers = await unifi.getBlockedUsers();
        // console.log(blockedUsers);

        /////////compare our database data with the blocked list, and set the data to acti
        const macData = await prisma.device.findMany();

        const doMacAddressMatch = (macAddress, array) => {
            return array.some(obj => obj.macAddress === macAddress)
        }
        const matchedObjects = blockedUsers.filter(obj1 => doMacAddressMatch(obj1.mac, macData))
        console.log("Devices confirmed as blocked and reflected on front end: ", matchedObjects.length);


        res.json({ macData, blockedUsers })
    } catch (error) {
        if(error) throw error;
    }
});

app.post('/addmacaddresses', async (req, res) => {

    const blockedUsers = await unifi.getBlockedUsers();
    const { name, macAddress, active } = req.body

    const filterBlockedUsers = blockedUsers.filter((device) => {
        return device.mac === macAddress
    });
    if (!filterBlockedUsers.length) {
        try {
            const newMacAddress = await prisma.device.create({
                data: {
                    name,
                    macAddress,
                    active: true
                },
            });
            res.send({ newMacAddress });
        } catch (error) {
            if (error) throw error;
            res.send({ message: "There was an error."})
        }
    } else {
        try {
            const newMacAddress = await prisma.device.create({
                data: {
                    name,
                    macAddress,
                    active: false
                },
            });
            res.send({ newMacAddress });
        } catch (error) {
            if (error) throw error;
            res.send({ message: "There was an error."})
        }
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

app.get('/getdeviceinfo', async (req, res) => {

    try {
        // getBlockedUsers();
        const getClientDevices = await unifi.getClientDevices();
        // console.log('Client Data: ', getClientDevices);
        const getDeviceInfo = await prisma.device.findMany();
        console.log(getDeviceInfo);

        const doMacAddressMatch = (macAddress, array) => {
            return array.some(obj => obj.macAddress === macAddress)
        }
        const matchedObjects = getClientDevices.filter(obj1 => doMacAddressMatch(obj1.mac, getDeviceInfo))
        // console.log("Device info for settings page: ", matchedObjects);

        res.json({ getDeviceInfo, matchedObjects })
    } catch (e) {
        if (e) throw e;
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
        })
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
})

app.delete('/removedevice', async (req, res) => {
    const { id } = req.body
    const removeDevice = await prisma.device.delete({
        where: {
            id: id,
        }
    });
    res.json({ message: "Deletion successful", dataDeleted: removeDevice })
});

app.post('/addschedule', async (req, res) => { // adds cron data specific front end device
    const { id, crontype, croninput } = req.body;
    try {
        const deviceToSchedule = await prisma.device.findUnique({
            where: {
                id: id
            }
        })
        console.log('Device to schedule ', deviceToSchedule)
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
                // const job = schedule.scheduleJob(`${croninput}`, () => jobFunction(croninput, deviceToSchedule.macAddress));
                // console.log('job name from addschedule: ', job.name);


                // const task = cronSched.schedule(`${croninput}`, () => jobFunction(type, deviceToSchedule.macAddress))


                const addCron = await prisma.cron.create({
                    data: {
                        crontype: crontype,
                        crontime: croninput,
                        jobName: '',
                        device: {
                            connect: { id: id }
                        }
                    }
                });
                res.json(addCron)
            } else {
                res.status(422).send({ message: "Invalid Cron Type, please try again." })
            }
        } catch (error) {
            if(error) throw error;
        }
});

app.post('/getcrondata', async (req, res) => { // fetches cron data specific to front end device
    const { id } = req.body;
    console.log('id from getcrondata req.body ', id);
     try {
        const cronData = await prisma.cron.findMany({
            where: {
                deviceId: id
            }
        })
        res.json({ cronData: cronData })
     } catch (error) {
        if (error) throw error;
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
        const jobToCancel = schedule.scheduledJobs[jobName]
        console.log('Job Name cancelled: ', jobToCancel?.name);
        jobToCancel?.cancel();

        res.json({ message: "Data Deleted Succesfully.", dataDeleted: deleteCron });

    } catch (error) {
        if (error) throw error;
    }
});

app.put('/togglecron', async (req, res) => {
    // const { id, toggleCron, jName, jobName, deviceId, c } = req.body;
    const { id, toggleCron, jobName, crontime, crontype, deviceId } = req.body;
    console.log('id from req.body: ', id);
    console.log('req.body: ', req.body);
    // console.log('deviceId from req.body: ', deviceId);
    // console.log('checked(c): ', c);
    // console.log('jName: ', jName);

    // I believe the issue here is that you are not getting the job name from the front end, try node-schedule again -TRUE & Successful....

    // console.log('cron getTasks(): ', cronSched.getTasks());
    // console.log('cronSched: ', cronSched);
    let jb = jobName;
    try {
        // console.log(req.body);
        const getMacAddress = await prisma.device.findUnique({ where: { id: deviceId } });

        if (toggleCron === false && jobName !== '') {
            const cancelled = schedule?.cancelJob(jobName);
            console.log('Cancelled Job?: ', cancelled);
        } else if (toggleCron === true) {
            console.log('continue');
            const reInitiatedJob = schedule.scheduleJob(crontime, () => jobFunction(crontype, getMacAddress.macAddress))
            jb = reInitiatedJob.name
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
        res.json(updateCronToggle)
        console.log('updateCronToggle from prisma: ', updateCronToggle);
    } catch (error) {
        if (error) throw error;
    }
});

app.post('/savesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify } = req.body;
    console.log(req.body);

    try {
        const siteCredentials = await prisma.credentials.create({
            data: {
                username: username,
                password: password,
                hostname: hostname,
                port: parseInt(port),
                sslverify: Boolean(sslverify)
            }
        });
        // res.json({ message: 'Credentials successfully saved!' }, { siteCredentials })
        res.json({ siteCredentials })
    } catch (error) {
        if(error) throw error;
    }
});

app.put('/updatesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify, id } = req.body;
    console.log(req.body);

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
                sslverify: Boolean(sslverify)
            }
        });
        res.json({ message: 'Credentials successfully saved!' })
    } catch (error) {
        if(error) throw error;
    }
});

app.get('/checkforsettings', async (req, res) => {
    try {
        const checkForSettings = await prisma.credentials.findMany();
        if (checkForSettings.length > 0) {
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
        const unifiTest = new Unifi.Controller({ hostname: loginData.hostname, port: loginData.port,  sslverify: loginData.sslverify });
        try {
            const adminLogin = await prisma.credentials.findMany();
            const login = adminLogin.pop();
            // console.log('adminLogin ', adminLogin);
            // const unifiTest = new Unifi.Controller({ hostname: adminLogin.hostname, port: adminLogin.port,  sslverify: adminLogin.sslverify });
            const testCredentials = await unifiTest.login(login.username, login.password);

        console.log("Test Credentials: ", testCredentials); // returns true, not login info

        if (testCredentials === true) {
            res.sendStatus(200);
        }

        } catch (error) {
            res.status(404).json({ message: error.code })
            // if (error) throw error;
            if (error) {
                console.log('Catch Error: ', error.code)
                // console.log('Catch Error: ', error.request)
                // throw error;
            }
        }
    // }
    // getAdminLoginInfo();
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
        const { newTheme } = req.body;
        console.log('update theme req.body', newTheme);
        const updateTheme = await prisma.credentials.update({
            where: {
                id: 1,
            },
            data: newTheme
        })
        res.json(updateTheme)
    } catch (error) {
        if (error) throw error;
    }
});






app.post('/login', (req, res) => {
    console.log(req.body);

    if (req.body.username === 'a' && req.body.password === 'a') {
        res.sendStatus(200)
    } else {
        res.sendStatus(500)
    }
});

app.get('**', async (req, res) => {
    res.sendFile(process.cwd().slice(0, -7) + '/dist/index.html')
})

const PORT = process.env.PORT || 4322;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}....`)
});