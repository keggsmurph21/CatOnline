// app/models/user.js

// load stuff
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var UserSchema = mongoose.Schema({
  name : String,
  password : String,
  isSuperAdmin : Boolean,
  isAdmin : Boolean,
  isMuted : Boolean,
  flair: String,
  activeGamesAsAuthor: Number,
  activeGamesAsPlayer: Number,
  maxActiveGamesAsAuthor: Number,
  maxActiveGamesAsPlayer: Number,
  allowResetPassword: Boolean
});

// methods
// generating a hash
UserSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync( password, bcrypt.genSaltSync(12), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync( password, this.password );
};

UserSchema.methods.getLobbyData = function() {
  return {
    id:this._id,
    name:this.name,
    isAdmin:this.isAdmin,
    isSuperAdmin:this.isSuperAdmin,
    isMuted:this.isMuted,
    flair:this.flair };
}

UserSchema.methods.getExtendedLobbyData = function() {
  let data = this.getLobbyData();
  data.activeGamesAsAuthor = this.activeGamesAsAuthor;
  data.activeGamesAsPlayer = this.activeGamesAsPlayer;
  data.maxActiveGamesAsAuthor = this.maxActiveGamesAsAuthor;
  data.maxActiveGamesAsPlayer = this.maxActiveGamesAsPlayer;
  data.allowResetPassword = this.allowResetPassword;
  return data;
}

UserSchema.methods.resetPassword = function() {

}

// create the model for users and expose it to our app
module.exports = mongoose.model('User', UserSchema, 'users');
