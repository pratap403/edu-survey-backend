const mongoose = require('mongoose');
const MetaData = require('./metaData');
const Token = require('./token');

const userSurvey = mongoose.Schema({

    surveyId: mongoose.Schema.ObjectId,
    metaData: MetaData.schema,
    token: Token.schema,
    userId: mongoose.Schema.ObjectId,
    emailStatus: {
        type: String,
        enum: ['Failed', 'Sent'],
        default: 'Failed'
    },
    surveyStatus: {
        type: String,
        enum: ['Pending', 'Submitted'],
        default: 'Pending'
    },
    answer:{}

});

userSurvey.statics.createUserSurvey = async function createUserSurvey(data) {
    try {
        
        let UserSurvey = mongoose.model('user_survey', userSurvey);
        let newUserSurvey = new UserSurvey(data);
        await newUserSurvey.save();
        return true;

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = mongoose.model('user_survey', userSurvey);