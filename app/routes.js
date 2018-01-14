// app/routes.js
module.exports = function(app, passport) {

  // HOME PAGE
  app.get('/', function(req, res) {
    res.render('index.ejs', { message: req.flash('homepageMessage') });
  });

  // LOBBY PAGE
  app.get('/lobby', function(req,res) {
    res.render('lobby.ejs', { message: req.flash('lobbyMessage') });
  });

  // LOGIN PAGES
  app.get('/login', function(req,res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/lobby',
    failureRedirect : '/login',
    failureFlash : true
  }));

  // SIGNUP PAGES
  app.get('/signup', function(req,res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/lobby',
    failureRedirect : '/signup',
    failureFlash : true
  }));

  // LOGOUT PAGE
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};

// route middleware to make sure user is logged in
function isLoggedIn(req,res,next) {

  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/');

}
