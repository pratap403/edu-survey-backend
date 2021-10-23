var mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

module.exports.sendEmail = function (requestData, email) {
    return new Promise(function (resolve, reject) {

        var data = {
            from: process.env.MAILGUN_SENDER_EMAIL,
            to: requestData.recipient,
            subject: requestData.subject,
            text: requestData.message
        };

        mailgun.messages().send(data, function (error, body) {

            if (error)
                reject(email);

            resolve(body);
        });

    })
}