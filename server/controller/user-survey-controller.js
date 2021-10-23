const UserSurvey = require('../models/user-survey');
const ApiUtility = require('../../lib/api-utility');
const allowForRequest = require('../../utils/common-utilities');
const ObjectID = require('mongodb').ObjectID;

const userSurvey = module.exports;

userSurvey.getSurveyList = async function getSurveyList(req, res) {
    try {
        
        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        let searchQuery = {
            userId: ObjectID(req.body.jwtInfo.jwtId),
            emailStatus: 'Sent'
        }

        let count = await UserSurvey.countDocuments(searchQuery);

        let userSurveyDetails = await UserSurvey.aggregate([
            {
                $match: searchQuery
            },
            {
                $sort: {'metaData.createdAt': -1}
            },
            { // User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'metaData.createdBy',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            { //Survey Details
                $lookup: {
                    from: 'admin_surveys',
                    foreignField: '_id',
                    localField: 'surveyId',
                    as: 'surveyDetails'
                }
            },
            { $unwind: '$surveyDetails' },
            { // Projection
                $project: {
                    name: { $trim: { input: { $concat: [{ $ifNull: ['$userDetails.profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$userDetails.profile.contactInfo.lastName', ''] }] } } },
                    surveyName: "$surveyDetails.surveyTitle",
                    createdAt: '$metaData.createdAt',
                    surveyId: 1,
                    token: "$token.token",
                    surveyStatus: 1
                }
            }
        ]);

        return res.send(ApiUtility.success({
            count: count,
            list: userSurveyDetails
        }, 'Survey List Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

userSurvey.getSurveyFormDetails = async function getSurveyFormDetails(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));
        
        if(!req.body.token)
        return res.send(ApiUtility.failed("Missing Required Fields"));

        let surveyFormDetails = await UserSurvey.aggregate([
            {
                $match: {
                    'token.token': req.body.token,
                    userId: ObjectID(req.body.jwtInfo.jwtId)
                }
            },
            { // Survey Details
                $lookup: {
                    from: 'admin_surveys',
                    foreignField: '_id',
                    localField: 'surveyId',
                    as: 'surveyDetails'
                }
            },
            {$unwind: '$surveyDetails'},
            {
                $project: {
                    surveyTitle: '$surveyDetails.surveyTitle',
                    surveyQuestion: '$surveyDetails.questions',
                }
            }
        ]);

        return res.send(ApiUtility.success(surveyFormDetails[0], 'Survey Form Details Fetched Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

userSurvey.submitSurveyDetails = async function submitSurveyDetails (req, res) {
    try {
        
        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        if(
            !req.body.token ||
            !req.body.formData
        )
        return res.send(ApiUtility.failed('Missing Required Fields.'));

        let surveyDetails = await UserSurvey.findOne({
            'token.token': req.body.token,
            userId: ObjectID(req.body.jwtInfo.jwtId)
        });

        if(!surveyDetails)
        return res.send(ApiUtility.failed('Survey Not Exists.'));

        if(surveyDetails.token.isExpired)
        return res.send(ApiUtility.failed('Survey Submission Token Expired.'));

        if(surveyDetails.surveyStatus === 'Submitted')
        return res.send(ApiUtility.failed('Survey Already Submitted.'))

        await UserSurvey.findOneAndUpdate({
            'token.token': req.body.token
        }, {
            surveyStatus: 'Submitted',
            answer: req.body.formData
        });

        return res.send(ApiUtility.success({}, 'Survey Submitted Successfully.'))


    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}