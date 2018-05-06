'use strict';

// config/passport.js

// load stuff
const LocalStrategy = require('passport-local').Strategy;
const funcs = require('../funcs.js')
const validateNewUser = (username, password) => {

  let response = null;
  if (!username.match(/^[a-zA-Z0-9\-_]{5,16}$/) || username==='')
    response = `Username must be between 5 and 16 alphanumeric characters plus "_" or "-".`;
  if (!password.match(/^.{8,32}$/))
    response = `Password must be between 8 and 32 characters.`;
  if (!password.match(/^[a-zA-Z0-9~\!@#\$%\^&\*\(\)\-\=_\+\|,\.\<\>\?;\:'"/\\\[\]\{\}]+$/))
    response = `Password must not contain any "special" characters.`;

  return response;
}

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
    funcs.User.findById(id, function(err, user) {
      done(err, user);
    });
  });


  // local signup
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called local
  passport.use('web-signup', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true, // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

      // asynchronous
      // User.findOne won't fire unless data is sent back
      process.nextTick(function() {

        log.passport.info(`received web signup request (username:${username})`)

        // validation
        let invalidMessage = validateNewUser(username, password);
        if (invalidMessage) {
          log.passport.error(invalidMessage);
          return done(null, false, req.flash(invalidMessage));
        }
        username = username.toLowerCase();

        // find a user whose username is the same as the form's username
        // we are checking to see if the user trying to register already exists
        funcs.User.findOne( { name:username }, function(err,user) {
          // if there are any errors, return the error
          if (err) {
            log.passport.error(err.message);
            return done(err);
          }

          // check to see if there's already a user with that email
          if (user) {
            log.passport.error('That username is already taken');
            return done(null, false, req.flash('registerMessage', 'That username is already taken.'));
          } else {

            // if there is no user with the email
            // create the user
            var user = new funcs.User();

            // set the credentials
            user.name = username;
            user.password = user.generateHash(password);

            // save user to the session
            req.session.user = user;

            // save the user
            user.save( function(err) {
              log.passport.info(`registered user (id:${user.id})`);
              if (err) {
                log.passport.error(err.message);
                return done(err);
              }
              return done(null, user)
            });

          }
        });
      });
    }
  ));

  passport.use('web-login', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
      passReqToCallback : true, // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {

      log.passport.info(`received web login request (username:${username})`)
      username = username.toLowerCase();

      // find a user whose username is the same as the form's username
      // we are checking to see if the user trying to register already exists
      funcs.User.findOne( { name:username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }

        // if something goes wrong, return the message
        if (!user) {
          log.passport.error('user not found');
          return done(null, false, req.flash('loginMessage', 'User not found.'));
        } else if (!user.validPassword(password)) {
          log.passport.error('invalid username or password');
          return done(null, false, req.flash('loginMessage', 'Invalid username or password.'));
        }

        // save user to the session
        req.session.user = user;
        return done(null, user);

      });
    }
  ));

  // local signup
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called local
  passport.use('api-signup', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
    },
    function(username, password, done) {

      // asynchronous
      // User.findOne won't fire unless data is sent back
      process.nextTick(function() {

        log.passport.info(`received api signup request (username:${username})`)

        // validation
        invalidMessage = validateNewUser(username, password);
        if (invalidMessage) {
          log.passport.error(invalidMessage);
          return done(null, false, req.flash(invalidMessage));
        }
        username = username.toLowerCase();

        // find a user whose username is the same as the form's username
        // we are checking to see if the user trying to register already exists
        funcs.User.findOne( { name:username }, function(err,user) {
          // if there are any errors, return the error
          if (err) {
            log.passport.error(err.message);
            return done(err);
          }

          // check to see if there's already a user with that email
          if (user) {
            log.passport.error('That username is already taken');
            return done(null, false, req.flash('registerMessage', 'That username is already taken.'));
          } else {

            // if there is no user with the email
            // create the user
            var user = new funcs.User();

            // set the credentials
            user.name = username;
            user.password = user.generateHash(password);

            // save the user
            user.save( function(err) {
              log.passport.info(`registered user (id:${user.id})`);
              if (err) {
                log.passport.error(err.message);
                return done(err);
              }
              return done(null, user)
            });

          }
        });
      });
    }
  ));

  passport.use('api-login', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password'
    },
    function(username, password, done) {

      log.passport.info(`received api login request (username:${username})`)
      username = username.toLowerCase();

      // find a user whose username is the same as the form's username
      // we are checking to see if the user trying to register already exists
      funcs.User.findOne( { name:username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }

        // if something goes wrong, return the message
        if (!user) {
          log.passport.error('user not found');
          return done(null, 'user not found');
        } else if (!user.validPassword(password)) {
          log.passport.error('invalid username or password');
          return done(null, 'invalid username or password');
        }

        return done(null, user);

      });

    }
  ));


};
