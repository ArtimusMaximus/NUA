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
    return body.macData.map(mac => mac.macAddress)
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

app.get('/getmacaddresses', async (req, res) => {
    try {
        const currentCredentials = await prisma.credentials.findUnique({
            where: {
                id: 1
            }
        });
        const { initialSetup } = currentCredentials;

        if (!initialSetup) {
            const blockedUsers = await unifi.getBlockedUsers();
            let macData = await prisma.device.findMany();
            let getRefreshTimer = await prisma.credentials.findUnique({
                where: {
                    id: 1
                }
            });
            let refreshRate = getRefreshTimer.refreshRate;

            const doMacAddressMatch = (macAddress, array) => {
                return array.some(obj => obj.macAddress === macAddress)
            }
            const matchedObjects = blockedUsers.filter(obj1 => doMacAddressMatch(obj1.mac, macData))

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
                        const newMacData = await prisma.device.findMany()
                        res.json({ macData: newMacData, blockedUsers: blockedUsers, refreshRate: refreshRate });
                    } catch (error) {
                        console.error(error);
                    }
                }
                updateRecordsToActive(recordIds, updateData);
            }
        } else {
            throw new Error('This is the initial setup, redirect.')
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
        const sendFakeEventObj = { refresh: true }

        if (checkForInitial.initialSetup === false) {
            const refreshRate = checkForInitial.refreshRate;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const sendUpdate = () => {
                res.write(`data: ${JSON.stringify({ sendFakeEventObj })}\n\n`)
            };
            sendUpdate();
            const intervalId = setInterval(sendUpdate, refreshRate);

            req.on('close', () => {
                clearInterval(intervalId)
            });
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500).json({ error: "Internal Server Error."})
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



// ~~~~~potential firewall~~~~~~
app.post('/fetchcustomapi', async (req, res) => {
    const { instagramObject } = req.body
    console.log('instagramObject \t', instagramObject);
    try {
        // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
        const path = '/v2/api/site/default/trafficrules'

        const result = await unifi.customApiRequest(path, 'POST', instagramObject)
        console.log('result \t', result);
        result?.map(r => console.log(r))
        result.forEach(r => r.target_devices.forEach(device => console.log('target_devices \t', device)))

        // res.json(car)
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
    }
});
//~~~~~~~category firewall rules~~~~~~
app.post('/addcategorytrafficrule', async (req, res) => {
    const { categoryObject } = req.body;
    console.log('catId \t', categoryObject); // verified
    try {
        // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
        const path = '/v2/api/site/default/trafficrules'

        const result = await unifi.customApiRequest(path, 'POST', categoryObject)
        console.log('result \t', result);
        // result?.map(r => console.log(r))
        // result.forEach(r => r.target_devices.forEach(device => console.log('target_devices \t', device)))

        // res.json(car)
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
    }
});

app.delete('/deletecustomapi', async (req, res) => {
    const { _id } = req.body;
    console.log('instagramObject \t', _id);
    try {
        // console.log('unifi.customApiRequest \t', unifi.customApiRequest)
        const path = `/v2/api/site/default/trafficrules/${_id}`
        const result = await unifi.customApiRequest(path, 'DELETE', null)
        console.log('result \t', result);

        // res.json(car)
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
    }
});


//~~~~~~refresh redirect~~~~~~
app.get('**', async (req, res) => {
    res.sendFile(process.cwd().slice(0, -7) + '/dist/index.html')
});

const PORT = process.env.PORT || customPORT; // portSettings.js
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}....`)
});