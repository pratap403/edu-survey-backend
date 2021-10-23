const Survey = require('../models/admin-survey');
const MetaData = require('../models/metaData');
const ApiUtility = require('../../lib/api-utility');
const allowForRequest = require('../../utils/common-utilities');
const ObjectID = require('mongodb').ObjectID;
const User = require('../models/user');
const UserSurvey = require('../models/user-survey');
const emailSender = require('../../lib/send-email');
const Token = require('../models/token');
const emailTemplate = require('../view/survey-email').surveyEmailTemplate;

const adminSurvey = module.exports;

adminSurvey.createSurvey = async function createSurvey(req, res) {

    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        if (!req.body.Title)
            return res.send(ApiUtility.failed('Missing Required Fields'));

        let addSurvey = {};

        addSurvey.surveyTitle = req.body.Title;
        addSurvey.surveyType = req.body.Type;
        addSurvey.questions = [];

        for (let survey of req.body.Question) {

            let question = {
                text: survey.Text,
                type: survey.Type,
                isAnswerRequired: survey.hasRemarks,
                options: [],
                key: survey.ID
            }

            for (let option of survey.options) {
                question.options.push(option.OptionText)
            }

            addSurvey.questions.push(question);

        }

        addSurvey.metaData = new MetaData({
            createdBy: req.body.jwtInfo.jwtId
        });

        let savedSurvey = await Survey.createSurvey(addSurvey);
        return res.send(ApiUtility.success({ _id: savedSurvey._id }, 'Survey Created Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }

}

adminSurvey.listAllSurvey = async function listAllSurvey(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        let searchQuery = {};
        searchQuery['metaData.createdBy'] = ObjectID(req.body.jwtInfo.jwtId);

        let count = await Survey.countDocuments(searchQuery);

        let surveyDetails = await Survey.aggregate([
            {
                $match: searchQuery
            },
            {
                $project: {
                    surveyTitle: "$surveyTitle",
                    surveyType: "$surveyType",
                    createdAt: "$metaData.createdAt"
                }
            }
        ]);

        return res.send(ApiUtility.success({
            count: count,
            list: surveyDetails
        }, 'Admin Survey List Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

adminSurvey.getUserList = async function getUserList(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        let userDetails = await User.aggregate([
            {
                $match: {
                    'profile.permissionGroups': { $in: ['user'] }
                }
            },
            {
                $project: {
                    name: { $trim: { input: { $concat: [{ $ifNull: ['$profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$profile.contactInfo.lastName', ''] }] } } }
                }
            }
        ]);

        return res.send(ApiUtility.success(userDetails, 'User Details Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

adminSurvey.sendUsersInvite = async function sendUsersInvite(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        if (
            !req.body.usersId ||
            !req.body.surveyId
        )
            return res.send(ApiUtility.failed('Missing Required Fields.'));

        let surveyDetails = await Survey.findById({ _id: ObjectID(req.body.surveyId) });

        if (!surveyDetails)
            return res.send(ApiUtility.failed('Survey Not Exists'));

        if (!Array.isArray(req.body.usersId)) {
            emailArr = req.body.usersId.split(',');
        } else {
            emailArr = req.body.usersId;
        }

        for (let userId of emailArr) {

            let userDetails = await User.findById({ _id: ObjectID(userId) });

            if (userDetails) {

                let userSurveyData = {
                    surveyId: req.body.surveyId,
                    metaData: new MetaData(),
                    token: new Token(),
                    userId: userDetails._id,
                    emailStatus: ''
                }
    
                let emailTemplateText = emailTemplate({
                    surveyLink: `${process.env.APP_BASE_URL}/${userSurveyData.token.token}`,
                    userName: userDetails.profile.contactInfo.firstName
                });

                emailSender.sendEmail({
                    recipient: userDetails.local.email,
                    subject: 'Survey Feedback',
                    message: emailTemplateText
                }, userDetails._id).then(async (resolve) => {

                    userSurveyData.metaData.createdBy = req.body.jwtInfo.jwtId;
                    userSurveyData.emailStatus = 'Sent';
                    await UserSurvey.createUserSurvey(userSurveyData);

                }).catch(async (error) => {

                    userSurveyData.metaData.createdBy = req.body.jwtInfo.jwtId;
                    userSurveyData.emailStatus = 'Failed';
                    await UserSurvey.createUserSurvey(userSurveyData);

                });

            } else {
                continue;
            }

        }

        return res.send(ApiUtility.success({}, 'Invite Sent Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

adminSurvey.getUserSurveyList = async function getUserSurveyList(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        let count = await UserSurvey.countDocuments();

        let userSurveyDetails = await UserSurvey.aggregate([
            {
                $match: {}
            },
            {$sort: {'metaData.createdAt': -1}},
            { // User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'userId',
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
                    userSurveyEmailStatus: "$emailStatus",
                    userSurveyStatus: "$surveyStatus",
                    createdAt: '$metaData.createdAt'
                }
            }
        ]);

        return res.send(ApiUtility.success({
            count: count,
            list: userSurveyDetails
        }, 'User Survey Details Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}