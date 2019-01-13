const AWS = require('aws-sdk');
const axios = require('axios');
const os = require('os');
const GXADMIN_ALERT_TYPE = require('./GXAdminAlertTypes');

class GXAdminAlert {
    constructor(aws_region, srcEmailAddr, dstEmailAddr) {
        AWS.config.update({region: aws_region});
        this.srcEmailAddr = srcEmailAddr;
        this.dstEmailAddr = dstEmailAddr;
        this.sns = new AWS.SNS();
    }

    send_to_gx_logger(subject, msg){
        var hostname = os.hostname();
        axios.post('http://54.213.16.81:3000/insert', {
            hostname:hostname,
            subject: subject,
            message: msg
        })
            .then(function (response) {
                console.log("success")
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    async send_mail(subject, message, alert_type = GXADMIN_ALERT_TYPE.NORMAL) {
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            weak_this.send_to_gx_logger(subject, message);
            // Create sendEmail params
            var params = {
                Destination: { CcAddresses: [ weak_this.srcEmailAddr ], ToAddresses: [ weak_this.dstEmailAddr ] },
                Message: { Body: { Text: { Charset: "UTF-8", Data: message } }, Subject: { Charset: 'UTF-8', Data: subject } },
                Source: weak_this.srcEmailAddr, /* required */
                ReplyToAddresses: [ weak_this.srcEmailAddr ],
            };

            try{
                // Create the promise and SES service object
                new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params, function (err, data) {
                    if(err){
                        console.error(err);
                        reject(err);
                        return
                    }

                    console.log(data.MessageId);
                    resolve(data);
                })

                if(alert_type === GXADMIN_ALERT_TYPE.URGENT){
                    weak_this.sendSMS(subject);
                }
            }catch (e) {
                console.error(e);
                reject(e);
            }

        });
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

    getPlatformApplicationArn(pushProvider, isSandbox){
        console.log("process.env.AWS_SNS_APPLE_VOIP_DEV: ", process.env.AWS_SNS_APPLE_VOIP_DEV)
        if(pushProvider.toLowerCase() === 'apple'){
            if(isSandbox){
                return process.env.AWS_SNS_APPLE_VOIP_DEV;
            }else{
                return process.env.AWS_SNS_APPLE_VOIP_PRO;
            }
        }
        return null;
    }

    async createPlatformEndpoint(voipPushKitToken, platformApplicationArn){
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            var params = {
                PlatformApplicationArn: platformApplicationArn, //'arn:aws:sns:us-west-2:903051898489:app/APNS_VOIP_SANDBOX/MyGix-Apple-PushKitVoip-Dev', /* required */
                Token: voipPushKitToken
            };

            weak_this.sns.createPlatformEndpoint(params, function(err, data) {
                if (err){
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }


    async deleteEndpoint(endPointArn){
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            var params = {
                EndpointArn: endPointArn
            };

            weak_this.sns.deleteEndpoint(params, function(err, data) {
                if (err){
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                    return;
                }
                console.log(data);
                resolve(data);
            });
        });
    }

};


module.exports = GXAdminAlert;