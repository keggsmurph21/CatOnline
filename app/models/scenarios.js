// app/models/settings.js

var mongoose = require('mongoose');

var ScenarioSchema = mongoose.Schema({
      "name" : String,
      "buildingCosts" : Object,
      "maxEachBuilding" : Object,
      "devCards" : Object,
      "resources" : Object,
      "ports" : Object,
      "diceData" : [ {} ],
      "counts" : Object,
      "edgeData" : Object
});

module.exports = mongoose.model('Scenario', ScenarioSchema, 'scenarios');
