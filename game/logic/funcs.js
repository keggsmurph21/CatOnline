// load stuff
var mongoose = require('mongoose');
var Settings = require('../../app/models/settings.js');
var Classes  = require('../classes.js');

// define lots of game logic here
module.exports = {

  initGameStateNoPlayers:function(rules) {
    console.log('initializing game state for ' + rules);

    Settings.findOne({ choices : { "$elemMatch":{ name:rules } } }, function(err, settings) {
      if (err) throw err;

      var Dice = new Classes.Dice();
      //Dice.roll()

      return {a: 'a', b:'c'};
    });
  }

}
