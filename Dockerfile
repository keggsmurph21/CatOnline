FROM node:latest

# create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/

# use nodemon for development
RUN npm install --global nodemon

# install other dependencies (ignore fsevents stuff)
RUN npm install --quiet

# bundle app source
COPY . .

EXPOSE 3000
# legacy watch flag -L
#CMD [ "nodemon", "-L", "start" ]
