// config/passport.js

// load stuff
var LocalStrategy = require('passport-local').Strategy;
var User          = require('../app/models/user.js');

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
    User.findById(id, function(err, user) {
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
        User.findOne({ 'username' : username }, function(err,user) {
          // if there are any errors, return the error
          if (err) { return done(err) }

          // check to see if there's already a user with that email
          if (user) {
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          } else {

            // if there is no user with the email
            // create the user
            var newUser = new User();

            // set the credentials
            newUser.username = username;
            newUser.password = newUser.generateHash(password);
            newUser.isSuperAdmin = false;
            newUser.isAdmin = false;

            // save the user
            newUser.save(function(err) {
              if (err) { throw err; }
              return done(null, newUser);
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
      User.findOne({ 'username' : username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }


        // if something goes wrong, return the message
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'No user found.'));
        } else if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
        }

        return done(null, user);

      });
    }
  ));

};
