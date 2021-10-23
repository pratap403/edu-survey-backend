'use strict';

var config = require('../../server/config');
// Login Strategies:
var localLogin = require('./local-login-strategy');
var jwtLogin = require('./jwt-login-strategy');
const localSignUp = require('./local-signup-manual-strategy');

const ApiUtility = require('../../lib/api-utility');

var User = require('../../server/models/user');

var passport = require('passport');
var flash = require('connect-flash');
var jwt = require('jsonwebtoken');
var exports = module.exports = {};

if (!Object.entries)
  Object.entries = function (obj) {
    var ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };

///////////////////////////////////////////////////////////
// Keep configuration localized here instead of server.js
//
// Set up Auth middleware
//////////////////////////////////////
exports.configureMiddleware = function (app) {

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });


  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, done);
  });


  // Install Login Strategies:
  localLogin(passport);
  jwtLogin(passport);
  localSignUp(passport);

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  console.log('Auth middleware configured.')
};

// Pass Through the Auth routes:
exports.authenticate = {
  // Email/Password:
  localLogin: function (req, res, next) {
    return passport.authenticate('local', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  // Local SignUp
  localSignUp: function (req, res, next) {
    return passport.authenticate('signup', localSignupCallback(req, res, next))(req, res, next);
  },
  // JWT Strategy
  jwt_auth: async function(req, res, next){

    if(!req.headers.authorization) {
      let data = {
        status: 'error',
        message: 'Authorization Token Missing'
      }
      return res.status(401).json(data);
    }

    let JWT = req.headers.authorization.substr(7);

    jwt.verify(JWT, config.jwtSecret, (err, decoded) => {
      if(err) {
        let data = {
          status: 'error',
          message: 'Invalid Token. Please Login Again !!'
        }
        return res.status(401).json(data);
      }
    })

    return passport.authenticate('jwt', { session: false },authenticationStrategyCallbackJwt(req, res, next) )(req, res, next);
  }
};


//////////////////////////////////////
// END Set up Auth middleware
//////////////////////////////////////

/**
 * Enforces group permissions for required routes
 * @param {Array} routePermissions
 * @returns {Function} route handler to process request
 * @Example use: permisssionsRequire(["Admin"])
 */
exports.isAuthorized = (routePermissions = []) => {
  return (req, res, next) => {
    if (req.session.user) {
      if (req.session.user.profile) {
        const userPermissions = req.session.user.profile.permissionGroups;
        const userHasPermission = userPermissions.reduce((isGranted, userPermission) => {
          if (routePermissions.includes(userPermission)) isGranted = true;
          return isGranted;
        }, false);

        if (userHasPermission) next();
        else res.status(403).render('403');

      } else {
        res.redirect('/dashboard/')
      }
    } else {
      res.redirect('/users/login');
    }
  }
};


////////////////////////////////////
// PRIVATE METHODS
////////////////////////////////////
function authenticationStrategyCallback(req, res, next) {
  console.log("authenticationStrategyCallback called");
  // Wrapping this anonymous function to pass req, res, and next:
  return (err, user, info) => {
    if (err) {
      return res.send(ApiUtility.failed(err));
    }
    // Check User's Profile and registration status:
    if (user) {


        if(user.isActive){
          // Update User Last Login
          User.updateLastLogin(user._id);
          // User.updateLoginlog(user._id);

          req.logIn(user, function (err) {
            if (err) {
              return res.send(ApiUtility.failed(err.message));
            }
          });

          return res.send(ApiUtility.success(User.getUserDataForApi(user), 'Login Successfully'));

        } else {
          return res.send(ApiUtility.failed("Your account is not active"));
        }
    } else {
      return next('No User Data. Not sure why.');
    }
  }
}

// JWT Respone
function authenticationStrategyCallbackJwt(req, res, next){
  return (err,jwtInfo,info) =>{
    if(err){
      return res.send({ status: 'error', message: err });
    }
    if(jwtInfo){
      req.body.jwtInfo = jwtInfo.jwtInfo;
      return next();
    }
  }
}

// Local Sign Up
function localSignupCallback(req, res, next) {
  console.log("Local Sign Up Strategy Executed");
  return (err, user, info) => {

    if (err) {
      return res.send(ApiUtility.failed(err));
    }

    
    if(user){
      return res.send(ApiUtility.success({userId: user._id}, 'SignUp Successfully'));
    }
  }
}
