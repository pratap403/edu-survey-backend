'use strict';
var mongoose = require('mongoose');
var ContactInfo = require('./contact-info');
var PERMISSIONS = require('../constants/permission');


var profileSchema = mongoose.Schema({
  contactInfo: {
    type: ContactInfo.schema,
    default: new ContactInfo()
  },
  imageUrl : {
    type: String,
    default: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?ixid=MXwxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfA%3D%3D&ixlib=rb-1.2.1&w=1000&q=80'
  },
  timeZone: {
    type: String,
    default : "Asia/Kolkata"
  },
  permissionGroups: {
    type: [String],
    default: Array,
    enum: [
    PERMISSIONS.GROUP_PERMISSIONS.USER, 
    PERMISSIONS.GROUP_PERMISSIONS.ADMIN
  ]
  }
});


module.exports = mongoose.model('UserProfile', profileSchema);
