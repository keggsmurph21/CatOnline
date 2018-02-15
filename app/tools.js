// public/resources/js/tools.js
//var dateFormat = require('dateformat');

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
    let date1 = new Date(datetime);
    let date2 = new Date();
    console.log( date1, date2);
    minutesDelta = (date2.getTime() - date1.getTime())/(1000*60);

    if (minutesDelta)

    return (minutesDelta); // in hours
  },


  models : {
    User : require('./models/user'),
    Scenario : require('./models/scenarios'),
    Game : require('./models/game')
  }

}
