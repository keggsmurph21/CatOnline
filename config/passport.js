// config/passport.js

// load stuff
var LocalStrategy = require('passport-local').Strategy;
var tools = require('../app/tools.js')

// expose this function to our app using module.exports
module.exports = function(passport) {

  // passport session startup
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser( function(user,done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser( function(id,done) {
    tools.models.User.findById(id, function(err, user) {
      done(err, user);
    });
  });


  // local signup
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called local

  passport.use('local-signup', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true, // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

      // asynchronous
      // User.findOne won't fire unless data is sent back
      process.nextTick(function() {
        // find a user whose username is the same as the form's username
        // we are checking to see if the user trying to register already exists
        tools.models.User.findOne( { name:username }, function(err,user) {
          // if there are any errors, return the error
          if (err) { return done(err) }

          // check to see if there's already a user with that email
          if (user) {
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          } else {

            // if there is no user with the email
            // create the user
            var user = new tools.models.User();

            // set the credentials
            user.name = username;
            user.password = user.generateHash(password);
            user.isSuperAdmin = false;
            user.isAdmin = false;

            // save user to the session
            req.session.user = user.getPublicData();

            // save the user
            user.save( function(err) {
              if (err) throw err;
              return done(null, user)
            });

          }
        });
      });
    }
  ));

  passport.use('local-login', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true, // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

      // find a user whose username is the same as the form's username
      // we are checking to see if the user trying to register already exists
      tools.models.User.findOne( { name:username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }

        // if something goes wrong, return the message
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'User not found.'));
        } else if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', 'Invalid username or password.'));
        }

        // save user to the session
        req.session.user = user.getPublicData();
        console.log('at login',req.session.user);

        return done(null, user);

      });
    }
  ));

};
