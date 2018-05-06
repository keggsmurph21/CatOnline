'use strict';

const dateformat = require('dateformat');
const fs = require('fs');
const path = require('path');

class Logger extends Object {
  constructor(loggerName, levelName, stderr) {

    super();

    this.loggerName = loggerName.toUpperCase();

    const loggerDir = process.env.LOG_DIR || 'logs',
      loggerFile = loggerName.toLowerCase();
    this.loggerPath = path.join('.', loggerDir, `${loggerFile}.log`);

    this.levelName = levelName;
    this.level = ['CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG']
      .indexOf(levelName);

    this.stderr = stderr;

    if (this.level === -1)
      throw new CatonlineError(`Unrecognized Logger levelName "${levelName}"`);

  }

  _write(message) {
    if (this.loggerName !== rootLoggerName)
      global.log._write(message);
    fs.appendFile( this.loggerPath, message, 'utf8', function(err) {
      if (err) throw err;
    });
    if (this.stderr && stderr)
      console.error(message.trim());
  }

  /*
   * Override prototype toString() method
   */
  toString() {
    return `Logger (level=${this.levelName})`;
  }

  /*
   * `private` method
   * format a message to be printed
   *
   * @param {String} message:   message to be printed
   * @param {Boolean} showTimestamp:  set to `false` to suppress the current time
   *   from being output
   *
   * @return {String} formatted message
   */
  _format(tag=null, message='', showTimestamp=true, showName=true) {

    let string = '';
    if (showTimestamp) {
      let date = dateformat(new Date(), 'default');
      string += `[${date}] `;
    }
    if (showName)
      string += `${this.loggerName}: `;
    if (tag)
      string += `${tag}: `;
    string += `${message}\n`;

    return string;

  }

  /*
   * `private` method
   * helper function for the below functions ... decides whether or not a message
   * should be written out
   *
   * @param {Number} level:     integer representing the output priority level
   * @param {String} message:   message to be printed (default='')
   * @param {Boolean} showTimestamp:  set to `false` to suppress the current time
   *   from being output
   *
   * @return <none>
   */
  _handle(level, tag, message='') {
    if (level <= this.level) {
      message = this._format(tag, message, true);
      this._write(message);
    }
  }


  /*
   * `public` methods
   * call these functions to use this class's functionality (see above for details)
   *
   * @param {String} message:   message to be printed
   *
   * @return <none>
   */
  critical(message) {
    this._handle(0, 'CRITICAL', message);
  }
  error(message) {
    this._handle(1, 'ERROR', message);
  }
  warn(message) {
    this._handle(2, 'WARN', message);
  }
  info(message) {
    this._handle(3, 'INFO', message);
  }
  debug(message) {
    this._handle(4, 'DEBUG', message);
  }


  /*
   * `public` method
   * log normally (always and without special formatting)
   *
   * @param {...various} args:    zero or more things to be written out
   *
   * @return <none>
   */
  out(message) {
    message = this._format('APP', message, false, false);
    fs.appendFile( global.log.app.loggerPath, message, 'utf8', function(err) {
      if (err) throw err;
      console.log(message);
    });
  }

}

// set up some loggers
const level = process.env.DEBUG_LEVEL || 'ERROR';
const stderr = process.env.DEBUG_STDERR ? process.env.DEBUG_STDERR==='1' : false;
const rootLoggerName = 'ROOT';

global.log = new Logger(rootLoggerName, level, false);
global.log.app = new Logger('APP', level, true);
global.log.mongoose = new Logger('MONGOOSE', level, false);
global.log.passport = new Logger('PASSPORT', level, false);
global.log.udp = new Logger('UDP', level, true);
