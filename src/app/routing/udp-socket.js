'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');

const socketPath = path.join(process.env.APP_UDP_PATH, `${process.env.APP}.sock`);

module.exports = function(app) {

  // only init UDP for local
  if (process.env.APP !== 'local')
    return null

  log.udp.info(`initializing UDP socket server at ${socketPath}`);

  if (fs.existsSync(socketPath)) {
    log.udp.info(`found existing socket, removing ...`);
    fs.unlinkSync(socketPath);
  }

  app.socket = net.createServer((client) => {
    log.udp.info(`client connected`);

    client.on('data', (data) => {
      log.udp.info(`received data: ${JSON.stringify(data)}`);

      client.write('response');
    });

  });

  app.socket.listen(socketPath, () => {
    log.udp.info(`UDP server listening at ${socketPath}`);
  });

}
