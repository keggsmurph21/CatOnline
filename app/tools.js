// public/resources/js/tools.js
var dateFormat = require('dateformat');

// keep functions here that are not necessarily strictly game logic
module.exports = {

  getRandomInt : function(min=0, max=1) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  shuffle : function(arr) {
    for (let i =arr.length-1; i>0; i--) {
      const j = Math.floor(Math.random() * (i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
  },

  formatDate : function(datetime) {
    return dateFormat(datetime, "mmm. dS, h:MM:ss tt")
  },

  isValidID : function(id) {
    // mongo IDs are always 24 alphanumeric chars
    return (id.length===24 && id.match(/^[a-z0-9]+$/i));
  },

  User : require('./models/user'),

  Game : require('./models/game')

}
