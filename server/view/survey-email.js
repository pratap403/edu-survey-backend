module.exports.surveyEmailTemplate = function (data) {

    return `<strong>Dear ${data.userName}.</strong> </br>
    <p>We recently sent you an invite to our ${data.surveyLink} to let us know your experience with our services.</p> </br>
    <p>Your feedback matters to us, and your response will help us improve the quality of our services.</p>`

}