// app/models/user.js

// load stuff
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var UserSchema = mongoose.Schema({
  name : String,
  password : String,
  isSuperAdmin : { type:Boolean, default:false },
  isAdmin : { type:Boolean, default:false },
  isMuted : { type:Boolean, default:false },
  flair: { type:String, default:'' },
  activeGamesAsAuthor: { type:Number, default:0 },
  activeGamesAsPlayer: { type:Number, default:0 },
  maxActiveGamesAsAuthor: { type:Number, default:5 },
  maxActiveGamesAsPlayer: { type:Number, default:7 },
  allowResetPassword: { type:Boolean, default:false }
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
