const mongoose = require('mongoose');
const UserProfile = require('./user-profile');
const MetaData = require('./metaData');
const validator = require('validator');
const crypto = require('../../lib/crypto');
const utilities = require('../../utils/common-utilities');
var jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = mongoose.Schema ({
  profile: UserProfile.schema,
  metaData: MetaData.schema,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin : Date,
  local: {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        isAsync: false,
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email address!',
      },
    },
    password: {
      type: String,
      set: crypto.hash,
      // Also, add some complexity validation
    },
  },
});

// checking if password is valid
userSchema.methods.isPasswordValid = function (password) {
  return crypto.checkHash(password, this.local.password);
};

userSchema.statics.signUpUser = async function signUpUser(data) { // User Signup
  try {

    let User = mongoose.model('User', userSchema);
    let newUser = new User();

    newUser.metaData = new MetaData();
    newUser.profile = new UserProfile();

    // newUser.metaData.createdAt = Date.now();

    newUser.profile.contactInfo.birthday = data.dob;
    newUser.profile.contactInfo.gender = data.gender;
    newUser.profile.contactInfo.firstName = utilities.getFirstName(data.name);
    newUser.profile.contactInfo.lastName = utilities.getLastName(data.name);
    newUser.profile.permissionGroups = ['user'];
    newUser.local.password = data.password;
    newUser.local.email = data.email;;

    let savedNewUser= await newUser.save();

    return savedNewUser;

  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Updates the users lastLogin field to current date
 */
 userSchema.statics.updateLastLogin = function updateLastLogin(userId) {
  return this.findById(userId).exec().then((user) => {
      user.lastLogin = new Date();
      return user.save();
  })
};

userSchema.statics.getUserDataForApi = function(user){

  var payload = {
    id: user._id,
    permission: user.profile.permissionGroups
  };

  var token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpireTime }), imageUrl;

  let userData = {
    userId: user._id,
    lastLogin:user.lastLogin,
    isActive:user.isActive,
    email:user.local.email,
    imageUrl: user.profile.imageUrl,
    lastName:user.profile.contactInfo.lastName,
    firstName:user.profile.contactInfo.firstName,
    token:token,
    userType: user.profile.permissionGroups[0]
  }
  return userData;
}

userSchema.statics.signUpUserAdmin = async function signUpUserAdmin(data) { // User Signup
  try {

    let User = mongoose.model('User', userSchema);
    let newUser = new User();

    newUser.metaData = new MetaData();
    newUser.profile = new UserProfile();

    // newUser.metaData.createdAt = Date.now();

    newUser.profile.contactInfo.birthday = data.dob;
    newUser.profile.contactInfo.gender = data.gender;
    newUser.profile.contactInfo.firstName = utilities.getFirstName(data.name);
    newUser.profile.contactInfo.lastName = utilities.getLastName(data.name);
    newUser.profile.permissionGroups = ['admin'];
    newUser.local.password = data.password;
    newUser.local.email = data.email;;

    let savedNewUser= await newUser.save();

    return savedNewUser;

  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = mongoose.model('User', userSchema);

