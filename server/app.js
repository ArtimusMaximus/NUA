const express = require('express');
const { exec } = require('node:child_process');
const fs = require('fs');
const util = require('node:util');
const cors = require('cors');
const bodyParser = require('body-parser');
// const Unifi = require('node-unifi');
const Unifi = require('node-unifi')




const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(process.cwd().slice(0, -7) + '/dist'));


// (async () => {
//     const unifi = new Unifi.Controller('hostname', 'port', { sslverify: false })
//     try {
//         const loginData = await unifi.login('USERNAME', 'PASS');
//         console.log('Login Data: ', loginData);

//         const listenData = await unifi.listen();
//         console.log('Listen Data: ', listenData);

//         const clientData = await unifi.getClientDevices();
//         console.log('Client Data: ', clientData);



//     } catch (err) {
//         console.error('ERROR: ', err);
//     }
// })();

// const controller = new Unifi.Controller('hostname || ip', 8443);

app.post('/login', (req, res) => {
    console.log(req.body);

    if (req.body.username === 'a' && req.body.password === 'a') {
        res.sendStatus(200)
    } else {
        res.sendStatus(500)
    }
});

app.get('/api/bashls', (req, res) => {
    exec('ls', (error, stdout, stderr) => {
        if (error) {
            console.error(error)
            res.sendStatus(500).send('Error fetching your request.')
        }
        console.log(`List of files ${stdout}`);
        res.sendStatus(200)
    });
    console.log('heard ya');
});

app.get('/api/sites', async (req, res) => {
    try {
        await controller.login('unifiusername', 'unifipassword');

        const sites = await controller.getSites();
        console.log(sites);

        await controller.logout();

        res.json({ sites });
    } catch(err) {
        console.error(err);
        res.sendStatus(500).json({ error: 'Internal server Error.'})
    }
})



const PORT = process.env.PORT || 4321;
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}....`)
});