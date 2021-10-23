const User = require('../models/user');
const auth = require('../../lib/auth');
const ApiUtility = require('../../lib/api-utility');
const allowForRequest = require('../../utils/common-utilities');
const AdminSurvey = require('../models/admin-survey');
const UserSurvey = require('../models/user-survey');
const ObjectID = require('mongodb').ObjectID;

const user = module.exports;

user.signupUser = auth.authenticate.localSignUp;
user.loginUser = auth.authenticate.localLogin;

user.createAdmin = async function createAdmin(req, res) {
    try {

        if (
            !req.body.name ||
            !req.body.password ||
            !req.body.email
        )
            return res.send(ApiUtility.failed('Missing Required Fields'));

        let savedAdminUser = await User.signUpUserAdmin(req.body);

        return res.send(ApiUtility.success({
            _id: savedAdminUser._id
        }, 'Admin Created Successfully'))

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

user.adminUserDashboardDetails = async function adminUserDashboardDetails(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        var start = new Date();
        start.setUTCHours(0, 0, 0, 0);

        var end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        let userCount = await User.countDocuments({ 'profile.permissionGroups': { $in: ['user'] } });
        let todaySurveyCount = await AdminSurvey.countDocuments({ 'metaData.createdAt': { $gte: start, $lt: end } });
        let userSurveyPendingCount = await UserSurvey.countDocuments({surveyStatus: 'Pending'});
        let userSurveySubmittedCount = await UserSurvey.countDocuments({surveyStatus: 'Submitted'});

        let userSurveyListDetails = await UserSurvey.aggregate([
            {
                $match: {}
            },
            {$sort: {'metaData.createdAt': -1}},
            {$limit: 5},
            { // User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'userId',
                    as: 'userDetails'
                }
            },
            {$unwind: '$userDetails'},
            { // Survey Details
                $lookup: {
                    from: 'admin_surveys',
                    foreignField: '_id',
                    localField: 'surveyId',
                    as: 'surveyDetails'
                }
            },
            {$unwind: '$surveyDetails'},
            { // Admin User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'metaData.createdBy',
                    as: 'adminUserDetails'
                }
            },
            {$unwind: '$adminUserDetails'},
            {
                $project: {
                    surveyName: '$surveyDetails.surveyTitle',
                    userName: { $trim: { input: { $concat: [{ $ifNull: ['$userDetails.profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$userDetails.profile.contactInfo.lastName', ''] }] } } },
                    adminUserName: { $trim: { input: { $concat: [{ $ifNull: ['$adminUserDetails.profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$adminUserDetails.profile.contactInfo.lastName', ''] }] } } },
                    inviteStatus: "$emailStatus",
                    surveyStatus: 1,
                    invitationDate: '$metaData.createdAt'
                }
            }
        ]);

        return res.send(ApiUtility.success({
            userCount: userCount,
            todaySurveyCount: todaySurveyCount,
            userSurvey: {
                pendingCount: userSurveyPendingCount,
                submittedCount: userSurveySubmittedCount,
                totalCount: userSurveySubmittedCount + userSurveyPendingCount,
            },
            userSurveyListDetails: userSurveyListDetails
        }, 'Admin Dashboard Details Successfully.'))

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

user.userDashboardDetails = async function userDashboardDetails(req, res) {
    try {

        if (!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category2'))
            return res.send(ApiUtility.failed('You have no permission to make this request'));

        let userSurveyListDetails = await UserSurvey.aggregate([
            {
                $match: {
                    userId: ObjectID(req.body.jwtInfo.jwtId),
                    emailStatus: 'Sent'
                }
            },
            {$sort: {'metaData.createdAt': -1}},
            {$limit: 5},
            { // User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'userId',
                    as: 'userDetails'
                }
            },
            {$unwind: '$userDetails'},
            { // Survey Details
                $lookup: {
                    from: 'admin_surveys',
                    foreignField: '_id',
                    localField: 'surveyId',
                    as: 'surveyDetails'
                }
            },
            {$unwind: '$surveyDetails'},
            { // Admin User Details
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'metaData.createdBy',
                    as: 'adminUserDetails'
                }
            },
            {$unwind: '$adminUserDetails'},
            {
                $project: {
                    surveyName: '$surveyDetails.surveyTitle',
                    userName: { $trim: { input: { $concat: [{ $ifNull: ['$userDetails.profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$userDetails.profile.contactInfo.lastName', ''] }] } } },
                    adminUserName: { $trim: { input: { $concat: [{ $ifNull: ['$adminUserDetails.profile.contactInfo.firstName', ''] }, " ", { $ifNull: ['$adminUserDetails.profile.contactInfo.lastName', ''] }] } } },
                    inviteStatus: "$emailStatus",
                    surveyStatus: 1,
                    invitationDate: '$metaData.createdAt'
                }
            }
        ]);

        return res.send(ApiUtility.success({
            userSurveyListDetails: userSurveyListDetails
        }, 'User Dashboard Details Successfully.'))

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}
