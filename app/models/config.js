// app/models/config.js

var mongoose = require('mongoose');

var ConfigSchema = mongoose.Schema({
  "scenarios" : Object,
  "victoryPointsGoal" : Object,
  "numHumans" : Object,
  "numCPUs" : Object,
  "portStyle" : Object,
  "tileStyle" : Object
});

module.exports = mongoose.model('Config', ConfigSchema, 'configs');
