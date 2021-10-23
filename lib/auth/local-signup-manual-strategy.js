const passportCustom = require('passport-custom');
const CustomStrategy = passportCustom.Strategy;
const User = require('../../server/models/user');

  module.exports = function (passport) {
    passport.use('signup', new CustomStrategy(
      function (req, done) {
        if(
          !req.body.email ||
          !req.body.gender ||
          !req.body.dob ||
          !req.body.password ||
          !req.body.passwordConfirmation ||
          !req.body.name
          ) return done('Missing Required Fields');

        if(req.body.password.trim() !== req.body.passwordConfirmation.trim())
          return done("Password don't match to your confrim password");

        // asynchronous
        process.nextTick(function () {

          console.log("Akshay Pratatp Singh");
          // Internally sigup User
          User.findOne({
            'local.email': req.body.email,
            'profile.permissionGroups': {$in: ['user']}
           }, async function(err, user){  
              if(err) return done(err);

              if(!user){
                  return done(null, await User.signUpUser(req.body));
              } else {
                return done('User Already Exists');
              }

          });
        });
      }));
  };