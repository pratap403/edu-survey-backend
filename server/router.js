const express = require('express');
const router = express.Router();
const auth = require('../lib/auth');

const userController = require('./controller/user-controller');
const adminSurveyController = require('./controller/admin-survey-controller');
const userSurveyController = require('./controller/user-survey-controller');

router.get('/', ((req, res) => {
    return res.status(200).send({status: 'success', message: "Initailization Successfull."})
}));

/** ADMIN AUTHENTICATION API */
router.post('/admin/user-signup', userController.createAdmin);

/** USER AUTHENTICATION API */
router.post('/user/signup', userController.signupUser);
router.post('/user/login', userController.loginUser);

/** ADMIN SURVEY API */
router.post('/admin/create-survey', auth.authenticate.jwt_auth, adminSurveyController.createSurvey);
router.get('/admin/get-survey-list', auth.authenticate.jwt_auth, adminSurveyController.listAllSurvey);
router.get('/admin/get-user-list', auth.authenticate.jwt_auth, adminSurveyController.getUserList);
router.post('/admin/send-users-invite', auth.authenticate.jwt_auth, adminSurveyController.sendUsersInvite);
router.get('/admin/get-user-survey-list', auth.authenticate.jwt_auth, adminSurveyController.getUserSurveyList);

/** USER SURVEY API */
router.get('/user/get-survey-list', auth.authenticate.jwt_auth, userSurveyController.getSurveyList);
router.post('/user/get-survey-form-details', auth.authenticate.jwt_auth, userSurveyController.getSurveyFormDetails);
router.post('/user/submit-survey-details', auth.authenticate.jwt_auth, userSurveyController.submitSurveyDetails);

/** DASHBOARD API */
router.get('/admin/dashboard-details', auth.authenticate.jwt_auth, userController.adminUserDashboardDetails);
router.get('/user/dashboard-details', auth.authenticate.jwt_auth, userController.userDashboardDetails);


module.exports = router;