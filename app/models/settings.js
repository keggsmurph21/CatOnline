// app/models/settings.js

var mongoose = require('mongoose');

var SettingsSchema = mongoose.Schema({
  'choices' : [
    {
      'name' : String,
      'game-setup' : {},
      'graph-setup' : {}
    }
  ]
});

module.exports = mongoose.model('Settings', SettingsSchema, 'settings');
