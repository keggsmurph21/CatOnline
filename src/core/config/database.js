// config/database.js

const logfilename = 'mongoose';
const url = (process.env.MONGODB_URI || 'mongodb://mongo:27017/catonline-db');

console.log(url);

function checkStatus(funcs, defaultSuperAdminPassword='password') {
  funcs.User.count({}, function(err, count) {
    if (err) throw err;
    if (!count) {

      // create a new model to be our superuser
      var user = new funcs.User();

      // set the credentials
      user.name = 'superadmin';
      user.password = user.generateHash(defaultSuperAdminPassword);
      user.isSuperAdmin = true;
      user.isAdmin = true;
      user.isMuted = false;
      user.flair = 'default';
      user.activeGamesAsAuthor = 0;
      user.activeGamesAsPlayer = 0;
      user.maxActiveGamesAsAuthor = 3;
      user.maxActiveGamesAsPlayer = 5;
      user.allowResetPassword = true;

      // save the user
      user.save( function(err) {
        if (err) throw err;
        console.log( 'wrote the default superuser' );
      });

    }
  });
}

module.exports = {

  config : function(mongoose, funcs) {

    mongoose.Promise = require('bluebird');
    mongoose.connect(url, function(err) {
      if (err) throw err;
    });
    mongoose.set('debug', function(coll, method, query, doc) {
      line = 'QUERY '+method+' '+coll+' WITH '+( query ? JSON.stringify(query) : 'null' )+( doc ? ' AND '+JSON.stringify(doc) : '' );
      funcs.log(line, logfilename);
    });
    checkStatus( funcs, 'password' );

  }


};
