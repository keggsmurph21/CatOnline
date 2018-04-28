// config/passport.js

// load stuff
const LocalStrategy = require('passport-local').Strategy;

const funcs = require('../app/funcs.js')

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
        if (!username.match(/^[a-zA-Z0-9\-_]{5,16}$/) || username==='') {
          return done(null, false, req.flash( 'registerMessage', 'Username must be between 5 and 16 alphanumeric characters plus "_" or "-".' ));
        }
        if (!password.match(/^.{8,32}$/)) {
          return done(null, false, req.flash( 'registerMessage', 'Password must be between 8 and 32 characters.' ));
        } else if (!password.match(/^[a-zA-Z0-9~\!@#\$%\^&\*\(\)\-\=_\+\|,\.\<\>\?;\:'"/\\\[\]\{\}]+$/)) {
          return done(null, false, req.flash( 'registerMessage', 'Password must not contain any "special" characters.' ));
        }

        username = username.toLowerCase();

        // find a user whose username is the same as the form's username
        // we are checking to see if the user trying to register already exists
        funcs.User.findOne( { name:username }, function(err,user) {
          // if there are any errors, return the error
          if (err) { return done(err) }

          // check to see if there's already a user with that email
          if (user) {
            return done(null, false, req.flash('registerMessage', 'That username is already taken.'));
          } else {

            // if there is no user with the email
            // create the user
            var user = new funcs.User();

            // set the credentials
            user.name = username;
            user.password = user.generateHash(password);
            user.isSuperAdmin = false;
            user.isAdmin = false;
            user.isMuted = false;
            user.flair = '';
            user.activeGamesAsAuthor = 0;
            user.activeGamesAsPlayer = 0;
            user.maxActiveGamesAsAuthor = 3;
            user.maxActiveGamesAsPlayer = 5;
            user.allowResetPassword = false;

            // save user to the session
            req.session.user = user.getLobbyData();

            // save the user
            user.save( function(err) {
              funcs.log( 'user '+user.id+' ('+user.name+') registered' );
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

      username = username.toLowerCase();

      // find a user whose username is the same as the form's username
      // we are checking to see if the user trying to register already exists
      funcs.User.findOne( { name:username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }

        // if something goes wrong, return the message
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'User not found.'));
        } else if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', 'Invalid username or password.'));
        }

        // save user to the session
        req.session.user = user.getLobbyData();
        return done(null, user);

      });
    }
  ));

  passport.use('api-login', new LocalStrategy(
    {
      usernameField : 'username',
      passwordField : 'password',
    },
    function(username, password, done) {

      username = username.toLowerCase();

      // find a user whose username is the same as the form's username
      // we are checking to see if the user trying to register already exists
      funcs.User.findOne( { name:username }, function(err,user) {

        // if there are any errors, return the error
        if (err) { return done(err) }

        // if something goes wrong, return the message
        if (!user) {
          return done(null, false);
        } else if (!user.validPassword(password)) {
          return done(null, false);
        }

        return done(null, user);

      });

    }
  ))
  /*let options = {
    jwtFromRequest : ExtractJwt.fromAuthHeader(),
    secret : 'passport-jwt-secret'
  };
  passport.use('jwt-login', new JwtStrategy(options, function(jwt_payload, done) {
    funcs.User.findById(jwt_payload.id, function(err, user) {
        if (err)
          return done(err, false);
        if (!user)
          return done(null, false);

        return done(null, user);
      });
  }));*/
};
