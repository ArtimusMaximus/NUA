![NUA Logo](nua-logo.webp)

A NodeJS based web application, provides you with a easy-to-use web interface for blocking and unblocking Unifi network clients.

## Features
* Add/Remove Unifi clients for management using a MAC address.
* Block or unblock all managed clients with a single click.
* Schedule to block or unblock managed clients via a cron scheduler.

## Screenshot

![Example](example.webp)

## Install & Configure
Install Node using Node Version Manager
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

This will install the nvm script to your user account. To use it, you must source your `.bashrc` file:

```bash
source ~/.bashrc
```

Now, you can ask NVM which versions of Node are available:

```bash
nvm list-remote
```

We're going to use Node v18+:

```bash
nvm install v18.18.1
```

You can now verify that we're using the correct version of Node:
```bash
node -v
nvm list
```

Install prerequisite Linux packages
```bash
sudo apt -y install git
```

Clone this repository:

```bash
git clone git@github.com:ArtimusMaximus/nodeunifireact.git
```

Install Node prerequisites:

```bash
cd nodeunifireact
npm install
npm install nodemon
```


### Optional - Set the port number
The default port is 4322. If you'd like to change the port, create the `globalSettings.js` file using the existing template:

```bash
cp server/globalSettings.js.template server/globalSettings.js
```

Now change the `<port>` string to your port number:

```js
const customPORT = 5000;


module.exports = customPORT;
```

## Start NUA Software

```bash
npm run start
```

# Support
If you think you've found a bug in NUA, try the following first:
* Update to the latest version of NUA.
* Turn the device off and on again.
* Use the search function to see if this issue has already been reported/solved.
* Check the Wiki (Not yet available).

# Feature Requests
1. Please check the issues tracker to see if someone else has already requestsed the feature. If a similar idea has already been requested, give it a thumbs up. Do not comment with +1 or something similar as it creates unnecessary spam. 
# Warning
* This software should not be used in production.
* This software should not be accessible from the internet.

Use at your own risk!

# License
This is free software under the GPL v3 open source license. Feel free to do with it what you wish, but any modification must be open sourced. 
- [GNU GPL v3](http://www.gnu.org/licenses/gpl.html)	
