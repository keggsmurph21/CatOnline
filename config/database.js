// config/database.js
module.exports = {

  'url' : 'mongodb://mongo:27017/catonline-db',

  checkStatus : function(tools, defaultSuperAdminPassword) {
    tools.User.count({}, function(err, count) {
      if (err) throw err;
      if (!count) {

        // create a new model to be our superuser
        var user = new tools.User();

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

};
