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
const customPORT = require('./globalSettings');




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

async function getBlockedUsers() {
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
    return body.macData.map(mac => mac.macAddress)
}
function validateCron(crontype) {
    let validation = cronValidate.validate(crontype);
    console.log('validation func: ', validation)
    return validation;
}
const jobFunction = async (crontype, macAddress) => { // for crons
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
        let macData = await prisma.device.findMany();
        let getRefreshTimer = await prisma.credentials.findUnique({
            where: {
                id: 1
            }
        });
        let refreshRate = getRefreshTimer[0]?.refreshRate || 60000;
        console.log(refreshRate);
        /////////compare our database data with the blocked list, and set the data to active or not

        const doMacAddressMatch = (macAddress, array) => {
            return array.some(obj => obj.macAddress === macAddress)
        }
        const matchedObjects = blockedUsers.filter(obj1 => doMacAddressMatch(obj1.mac, macData))
        console.log("Devices confirmed as blocked and reflected on added device list: ", matchedObjects.length);
        // console.log('blocked users ', blockedUsers);
        // console.log('matched Objects ', matchedObjects);

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
                    const newMacData = await prisma.device.findMany()
                    res.json({ macData: newMacData, blockedUsers: blockedUsers, refreshRate: refreshRate });
                } catch (error) {
                    console.error(error);
                }
            }
            updateRecordsToActive(recordIds, updateData);
            // console.log('new macData ', macData);

        } else if (matchedObjects.length >= 1) { // something is inactive
            const findBlocked = matchedObjects.filter(obj => obj.blocked === true);
            // const matchingMacs = compareBlocked(findBlocked, macData);
            const extractedMacAddress = findBlocked.map(blockedMac => blockedMac.mac);

            const matchedMacAddys = macData.filter(macData => extractedMacAddress.includes(macData.macAddress));

            // console.log('matchedMacAddys', matchedMacAddys);

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
                    const newMacData = await prisma.device.findMany()
                    res.json({ macData: newMacData, blockedUsers: blockedUsers, refreshRate: refreshRate });
                } catch (error) {
                    console.error(error);
                }
            }
            updateRecordsToActive(recordIds, updateData);
        }
    } catch (error) {
        if(error) throw error;
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
    const { oui, mac, blocked } = req.body; // blocked: true
    try {
        const deviceAddedToList = await prisma.device.create({
                data: {
                    name: oui,
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
        })
        console.log('Filtered only blocked users from db: ', filterBlockedUsers);
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

app.delete('/removedevice', async (req, res) => {
    const { id } = req.body;
    const removeDevice = await prisma.device.delete({
        where: {
            id: parseInt(id),
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
    // console.log('id from getcrondata req.body ', id);
    // console.log('req.body from /getcrondata ', req.body);
     try {
        const cronData = await prisma.cron.findMany({
            where: {
                deviceId: id
            }
        })
        res.json({ cronData: cronData });

        const getMacAddress = await prisma.device.findUnique({ where: { id: id } });
        const { macAddress } = getMacAddress;
        const { scheduledJobs } = schedule;

        for (const data of cronData) {
            console.log('data.jobName ', data.jobName)
            console.log('data.jobName === undefined ', scheduledJobs[data.jobName] === undefined) // jobs not re initiated
            if (scheduledJobs[data.jobName] === undefined) {
                // update many and also make async ?
            }
        }
        // console.log('jobs ', scheduledJobs[cronData[0].jobName] === undefined);
     } catch (error) {
        if (error) throw error;
     }
});

app.get('/checkjobreinitiation', async (req, res) => {
    try {
        const previousJobData = await prisma.cron.findMany();
        const getMacAddress = await prisma.device.findMany();

        const { scheduledJobs } = schedule; // node-schedule

        let matchingIds = [];
        let newJobNames = [];
        for (let i=0; i<previousJobData.length; i++) {
            const matchedMacAddress = getMacAddress.find(
                (item) => item.id === previousJobData[i].deviceId
            );
            if (matchedMacAddress) {
                matchingIds.push({
                    ...previousJobData[i],
                    matchedMacAddress
                });
            }
        }

        // console.log('matchingIds ', matchingIds);

        // let jb;
        for (const data of matchingIds) {
            // console.log('data.jobName ', data.jobName);
            // console.log('data.jobName === undefined ', scheduledJobs[data.jobName] === undefined) // jobs not re initiated

            // console.log('macToPreviousData ', matchingIds);
            if (scheduledJobs[data.jobName] === undefined && data.toggleCron === true) { // reschedule jobs === undefined
                // console.log(data.matchedMacAddress.macAddress);
                // console.log('data.cron ', data.cron);

                let reInitiatedJob = schedule.scheduleJob(data.crontime, () => jobFunction(data.crontype, data.matchedMacAddress.macAddress));
                // console.log('reInitiatedJob', reInitiatedJob);
                // jb = schedule.scheduleJob(data.cron, () => jobFunction(data.crontype, data.macAddress));
                newJobNames.push({...data, jobName: reInitiatedJob.name})
            }
        }
        // console.log('newJobIds ', newJobNames);

        let updated = [];
        for (let i=0; i<newJobNames.length; i++) {
            const updateNewJobNames = await prisma.cron.update({
                where: {
                    id: newJobNames[i].id
                },
                data: {
                    jobName: newJobNames[i].jobName,

                }
            });
            updated.push(updateNewJobNames)
        }


        // const newJobNameIds = matchingIds.map(job => job.id)
        // const newJobNameData = newJobNames.map(jobName => jobName.jobName);
        // const updateNewJobNames = await prisma.cron.updateMany({
        //     where: {
        //         id: {
        //             in: newJobNameIds
        //         }
        //     },
        //     data: {
        //         jobName: {
        //             set: newJobNameData
        //         }
        //     }
        // });
        res.json({ previousJobData: previousJobData, getMacAddress: getMacAddress, updated: updated });
        // res.json({ previousJobData: previousJobData, getMacAddress: getMacAddress, updateNewJobNames: updateNewJobNames });
        // console.log('reInJob ', jb);
        // console.log('jobs ', scheduledJobs[previousJobData[0].jobName] === undefined);
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
    // console.log('id from req.body: ', id);
    // console.log('req.body: ', req.body);
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
        // console.log('updateCronToggle from prisma: ', updateCronToggle);
    } catch (error) {
        if (error) throw error;
    }
});

app.post('/savesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify, refreshRate } = req.body;
    console.log(req.body);

    try {
        const siteCredentials = await prisma.credentials.create({
            data: {
                username: username,
                password: password,
                hostname: hostname,
                port: parseInt(port),
                sslverify: Boolean(sslverify),
                refreshRate: parseInt(refreshRate)
            }
        });
        // res.json({ message: 'Credentials successfully saved!' }, { siteCredentials })
        res.json({ siteCredentials })
    } catch (error) {
        if(error) throw error;
    }
});

app.put('/updatesitesettings', async (req, res) => {
    const { username, password, hostname, port, sslverify, id, refreshRate } = req.body;
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
                sslverify: Boolean(sslverify),
                refreshRate: parseInt(refreshRate)
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

app.get('/getallblockeddevices', async (req, res) => {
    try {
        const blockedUsers = await getBlockedUsers();
        const deviceList = await prisma.device.findMany();
        res.json({ blockedUsers: blockedUsers, deviceList: deviceList })
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
        // const { newTheme } = req.body;
        console.log('update theme req.body', req.body);
        const updateTheme = await prisma.credentials.update({
            where: {
                id: 1,
            },
            data: req.body
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
});

const PORT = process.env.PORT || customPORT; // portSettings.js
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}....`)
});