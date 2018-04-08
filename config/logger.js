
const df = require('dateformat');
const fs = require('fs');
const path = require('path');

function format(msg, level) {
  return `[${df(new Date(), 'default')}] ${level.toUpperCase()}: ${msg}\n`;
}
function write(data, file) {
  if (file !== 'core')
    fs.appendFile( log.paths.core, data, 'utf8', function(err) {
      if (err) throw err;
    });

  fs.appendFile( log.paths[file], data, 'utf8', function(err) {
    if (err) throw err;
  });
}

global.log = {
  debug(msg, logfile='core') {
    if (log.level > 4) {

      msg = format(msg, 'debug');
      console.log(msg);
      write( msg, logfile);

    }
  },
  info(msg, logfile='core') {
    if (log.level > 3) {

      msg = format(msg, 'info');
			console.log(msg);
			write( msg, logfile);

    }
  },
  warn(msg, logfile='core') {
    if (log.level > 2) {

      msg = format(msg, 'warn');
			console.log(msg);
			write( msg, logfile);

    }
  },
  error(msg, logfile='core') {
    if (log.level > 1) {

      msg = format(msg, 'error');
			console.log(msg);
			write( msg, logfile);

    }
  },
  critical(msg, logfile='core') {
    if (log.level > 0) {

      msg = format(msg, 'critical');
			console.log(msg);
			write( msg, logfile);

    }
  },
  level : null
};

(function() { // SETUP

  log.level = {
    'DEBUG'   : 5,
    'INFO'    : 4,
    'WARN'    : 3,
    'ERROR'   : 2,
    'CRITICAL': 1
  }[process.env.CATONLINE_VERBOSITY || 'DEBUG'];
  if (!log.level) {
    throw new CatonlineError('Unable to parse logging verbosity.');
  }

  let logPath = path.join('.', 'logs');
  if (!fs.existsSync( logPath ))
    fs.mkdirSync( logPath );

  log.paths = {
    db : path.join(logPath, 'mongoose.log'),
    core : path.join(logPath, 'core.log'),
    debug : path.join(logPath, 'debug.log'),
    info : path.join(logPath, 'info.log'),
    warn : path.join(logPath, 'warn.log'),
    error : path.join(logPath, 'error.log'),
    critical : path.join(logPath, 'critical.log')
  }

})();
