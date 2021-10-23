'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User = require('../../server/models/user');

module.exports = function (passport) {
    passport.use('local', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {

            // asynchronous
            process.nextTick(function () {

                User.findOne({
                    'local.email': username
                }, function (err, user) {
                    // if there are any errors, return the error
                    if (err) return done(err);

                    // if no user is found, return the message
                    if (!user) {
                        return done('User not exist. Please Signup First');
                    }

                    if (!user.isPasswordValid(password)){
                        return done('Oops! Wrong password.');
                    } else {
                        return done(null, user, 'Login successfull!');
                    }
                });
            });
        }));
};
