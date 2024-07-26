# Use the official Node.js image as the base image
FROM node:18

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy the application code
COPY . .

# # Copy package.json and package-lock.json files
# COPY package*.json ./

# Install app dependencies
RUN npm i

# Change to server dir
WORKDIR /usr/src/app/server

# Make startup script executable
RUN chmod 555 /usr/src/app/server/scripts/docker-startup.sh

# Install server dependencies
RUN npm i

# # Initiate Prisma DB
# RUN npm run db

# Change to app dir
WORKDIR /usr/src/app

# Build app
RUN npm run build

# Change to server dir
WORKDIR /usr/src/app/server

# Expose the port your app runs on
EXPOSE 4323/tcp

# Command to run the application
# CMD ["npm", "run", "start"]
CMD ["/usr/src/app/server/scripts/docker-startup.sh"]