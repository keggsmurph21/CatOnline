var mongoose = require('mongoose');
var Settings = require('../../app/models/settings.js');

// define lots of game logic files here for export to app
module.exports = {

  initGameStateNoPlayers: function (rules) {
    console.log('initializing game state for ' + rules);

    Settings.findOne({ choices : { "$elemMatch":{ name:rules } } }, function(err, settings) {
      if (err) throw err;
      
      return {a: 'a', b:'c'};
    });
  }

}
