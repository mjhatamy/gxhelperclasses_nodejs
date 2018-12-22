const AWS = require('aws-sdk');

const GXADMIN_ALERT_TYPE = require('./GXAdminAlertTypes');

class GXAdminAlert {
    constructor(aws_region, srcEmailAddr, dstEmailAddr) {
        AWS.config.update({region: aws_region});
        this.srcEmailAddr = srcEmailAddr;
        this.dstEmailAddr = dstEmailAddr;
    }
    async send_mail(subject, message, alert_type = GXADMIN_ALERT_TYPE.NORMAL) {
        // Create sendEmail params
        var params = {
            Destination: { CcAddresses: [ this.srcEmailAddr ], ToAddresses: [ this.dstEmailAddr ] },
            Message: { Body: { Text: { Charset: "UTF-8", Data: message } }, Subject: { Charset: 'UTF-8', Data: subject } },
            Source: this.srcEmailAddr, /* required */
            ReplyToAddresses: [ this.srcEmailAddr ],
        };

        // Create the promise and SES service object
        var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

        // Handle promise's fulfilled/rejected states
        sendPromise.then(
            function (data) { console.log(data.MessageId); }).catch(
            function (err) { console.error(err, err.stack);  });

        if(alert_type === GXADMIN_ALERT_TYPE.URGENT){
            this.sendSMS(subject);
        }
    }

    async sendSMS(subject) {
        const weak_this = this;
        // Create publish parameters
        var params = { Message: `MyGix Server error: ${subject}`, PhoneNumber: process.env.AWS_ADMIN_ALERT_PHONE_NUMBER };

        // Create promise and SNS service object
        var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
        // Handle promise's fulfilled/rejected states
        publishTextPromise.then(
            function (data) { console.log(`${weak_this.constructor.name}::sendSMS > A SMS Message with ID:'${data.MessageId} was sent.'`); }).catch(
            function (err) { console.error(err, err.stack); });
    }
};


module.exports = GXAdminAlert;