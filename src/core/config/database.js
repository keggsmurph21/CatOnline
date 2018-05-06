'use strict';
// config/database.js

const mongoose = require('mongoose');
const funcs = require('../funcs');

const url = process.env.DB_URI;
const defaultPassword = process.env.APP_SECRET;


mongoose.Promise = require('bluebird');
mongoose.connect(url, { useMongoClient : true }, function(err) {
  if (err) throw err;

  mongoose.set('debug', function(coll, method, query, doc) {
    const line = `QUERY ${method} coll ${coll} WITH (${query ? JSON.stringify(query) : `null`}) ${doc ? ` AND ${JSON.stringify(doc)}` : ``}`;
    log.mongoose.info(line);
  });

  funcs.User.count({}, function(err, count) {
    if (err) throw err;
    if (!count) {

      // if we have no entries, make a superadmin
      var user = new funcs.User();

      // set the credentials
      user.name = 'superadmin';
      user.password = user.generateHash(defaultPassword);
      user.isSuperAdmin = true;
      user.isAdmin = true;
      user.flair = 'default';
      user.allowResetPassword = true;

      // save the user
      user.save( function(err) {
        if (err) throw err;
        log.app.info('wrote the default superadmin');
      });

    }
  });

});
