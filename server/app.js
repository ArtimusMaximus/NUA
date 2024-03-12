const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Unifi = require('node-unifi');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { PrismaClient } = require('@prisma/client');
const schedule = require('node-schedule');
const cronValidate = require('node-cron');
const customPORT = require('./globalSettings');
const fs = require('fs');




// Init sqlite db
(async () => {
    const db = await open({
        filename: './nodeunifi.db',
        driver: sqlite3.Database
    })
})();
const prisma = new PrismaClient();

// create server & add middleware
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(process.cwd().slice(0, -7) + '/dist'));

function red(text, color) { // specific console color logger
    if (color === 'red') {
        console.log('\x1b[31m\x1b[5m', text);
    } else if (color === 'cyan') {
        console.log('\x1b[36m\x1b[1m', text);
    }
}
function handleLoginError(error) {
    if (error !== undefined) {
        console.log('handleLoginErrors: \t');
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

// unifi connection instance
let unifi;
async function logIntoUnifi(hostname, port, sslverify, username, password) {
    unifi = new Unifi.Controller({hostname: hostname, port: port, sslverify: sslverify});
    const loginData = await unifi.login(username, password);
    if (loginData) {
        return { unifi, validCredentials: true};
    } else {
        return { validCredentials: false };
    }
}

let loginData;
const fetchLoginInfo = async () => {
    const getAdminLoginInfo = async () => {
        try {
          const adminLogin = await prisma.credentials.findMany();
          loginData = adminLogin.pop();
          return loginData;
        } catch (error) {
            if (error) {
                console.error('getAdminLoginInfo error in fetchLoginInfo: ', error);
                throw new Error('No credentials were found');
            }
        }
    }
    return getAdminLoginInfo();
}

const info = fetchLoginInfo();
info
    .then(() => logIntoUnifi(loginData?.hostname, loginData?.port, loginData?.sslverify, loginData?.username, loginData?.password))
    .catch((error) => console.error(error))

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
    return body.macData.map(mac => mac.macAddress);
}
function validateCron(crontype) { // return true/false
    let validation = cronValidate.validate(crontype);
    console.log('validation func: ', validation)
    return validation;
}
const jobFunction = async (crontype, macAddress) => { // for crons
    try {
        if (crontype === 'allow') {
            console.log('unifi === undefined \t', unifi === undefined)
            const confirmAllow = await unifi.unblockClient(macAddress)
            console.log(`${macAddress} has been unblocked: ${confirmAllow}`);
        } else if (crontype === 'block') {
            const confirmBlocked = await unifi.blockClient(macAddress)
            console.log(`${macAddress} has been blocked: ${confirmBlocked}`);
        }
    } catch (error) {
        red('~~~~~~CATCH BLOCK IN JOB FUNCITON~~~~~~~~~~~', 'red');
        console.error(error);
    }
}

// (async function() {
//     // const path = '/v2/api/site/default/trafficrules';
//     const path = '/api/s/default/stat/sitedpi';
//     // const path = 'https://192.168.0.1/proxy/network/api/s/default/stat/sitedpi';
//     const timer = t => new Promise(res => setTimeout(res, t));
//     let result;
//     timer(2000)
//         .then(() => result = unifi?.customApiRequest(path, 'GET'))
//         .then(() => console.log(result))
// })()

app.get('/getmacaddresses', async (req, res) => {
    try {
        const currentCredentials = await prisma.credentials.findUnique({
            where: {
                id: 1
            }
        });
        const { initialSetup, refreshRate } = currentCredentials;

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
            console.log('refreshRate \t', refreshRate);

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
                        const newMacData = await prisma.device.findMany()
                        res.json({ macData: newMacData, blockedUsers: blockedUsers, refreshRate: refreshRate });
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
                        res.json({ macData: newMacData, blockedUsers: blockedUsers, refreshRate: refreshRate });
                    } catch (error) {
                        console.error(error);
                    }
                }
                updateRecordsToActive(recordIds, updateData);
            }
        }
        else {
            console.log('This is the initial setup, redirect.');
            // throw new Error('This is the initial setup, redirect.');
        }
    } catch (error) {
        if (error) {
            console.error('error in /getmacaddresses: \t');
            handleLoginError(error);
            res.sendStatus(401);
            console.log('error in getmacaddresses catch block \t', error);
        }
    }
});

app.get('/pingmacaddresses', async (req, res) => {
    try {
        const checkForInitial = await prisma.credentials.findUnique({ where: { id: 1 } });
        const sendFakeEventObj = { refresh: true };

        if (checkForInitial.initialSetup === false) {
            // const refreshRate = checkForInitial.refreshRate;
            const { refreshRate } = checkForInitial;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const sendUpdate = () => {
                res.write(`data: ${JSON.stringify({ sendFakeEventObj })}\n\n`);
            };
            sendUpdate();
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
        });
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

// ~~~~~~~~~crons~~~~~~~~~~~
app.post('/addschedule', async (req, res) => { // adds cron data specific front end device && cron validator
    const { id, crontype, croninput, toggleCron, jobName } = req.body;
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

                // if (toggleCron === false && jobName !== '') {
                //     const cancelled = schedule?.cancelJob(jobName);
                //     console.log('Cancelled Job?: ', cancelled);
                // } else if (toggleCron === true) {
                //     console.log('continue');
                //     const reInitiatedJob = schedule.scheduleJob(croninput, () => jobFunction(crontype, getMacAddress.macAddress));
                //     jb = reInitiatedJob.name
                //     console.log('jb.name: ', jb.name);
                // }

                    console.log('continue new');
                    const startNewJob = schedule.scheduleJob(croninput, () => jobFunction(crontype, getMacAddress.macAddress));




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
            if(error) throw error;
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

app.put('/togglecron', async (req, res) => { // soon to be deprecated
    const { id, toggleCron, jobName, crontime, crontype, deviceId } = req.body;
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
            const reInitiatedJob = schedule.scheduleJob(crontime, () => jobFunction(crontype, getMacAddress.macAddress));
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
        res.json(updateCronToggle);
    } catch (error) {
        console.error(error);
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

// ~~~~~~~schedules~~~~~~~~~~
// app.put('/toggleschedule', async (req, res) => {
//     const { id, toggleCron, jobName, crontime, crontype, deviceId } = req.body;
//     // I believe the issue here is that you are not getting the job name from the front end, try node-schedule again -TRUE & Successful....
//     let jb = jobName;
//     try {
//         const getMacAddress = await prisma.device.findUnique({ where: { id: deviceId } });
//         console.log('getMacAddress.macAddress: ', getMacAddress.macAddress);

//         if (toggleCron === false && jobName !== '') {
//             const cancelled = schedule?.cancelJob(jobName);
//             console.log('Cancelled Job?: ', cancelled);
//         } else if (toggleCron === true) {
//             console.log('continue');
//             const reInitiatedJob = schedule.scheduleJob(crontime, () => jobFunction(crontype, getMacAddress.macAddress));
//             jb = reInitiatedJob.name
//             console.log('jb.name: ', jb.name);
//         }
//         const updateCronToggle = await prisma.cron.update({
//             where: { id: id },
//             data: {
//                 toggleCron: toggleCron,
//                 jobName: jb
//                 // jobName: toggleCron ? jb.name : jobName
//             }
//         });
//         res.json(updateCronToggle);
//     } catch (error) {
//         console.error(error);
//     }
// });

// app.post('/addschedule', async (req, res) => {
//     const { id, scheduletype, toggleschedule, minute, hour, daysOfTheWeek } = req.body;

//     console.log(req.body);

//     res.sendStatus(200);

// });

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
            const setInitialSetupFalse = await prisma.credentials.update({ where: { id: 1}, data: { initialSetup: false } }); // setup complete
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
                    await trule.trafficRules.delete({ where: { id: trafficRuleId }})
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
        // res.status(error.response.status).json({ error: error.response.data });

        // res.sendStatus(501);
        // res.status(400).json({ error: error.message });
        // res.json({ error: error.response.data });
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