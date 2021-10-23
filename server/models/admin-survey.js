const mongoose = require('mongoose');
const MetaData = require('./metaData');

const surveySchema = mongoose.Schema({
    surveyTitle: {
        type: String,
        required: true
    },
    surveyType: {
        type: String,
        required: true
    },
    questions: [],
    metaData: MetaData.schema
});

surveySchema.statics.createSurvey = async function createSurvey(data) {
    try {
        
        let foundSurvey = await this.findOne({
            surveyTitle: data.surveyTitle
        });

        if(foundSurvey)
        throw new Error('Survey Already Created.');

        let Survey = mongoose.model('admin_survey', surveySchema);
        let newSurvey = new Survey(data);

        let savedNewUser = await newSurvey.save();
        return savedNewUser._id;

    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = mongoose.model('admin_survey', surveySchema);