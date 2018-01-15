// app/models/options.js

var mongoose = require('mongoose');

var OptionsSchema = mongoose.Schema({
  'availableRulesSets' : {
    'default' : String,
    'values' : [String]
  }
});

module.exports = mongoose.model('Options', OptionsSchema, 'settings');
