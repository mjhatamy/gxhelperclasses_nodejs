const AWS = require('aws-sdk');
const axios = require('axios');
const { isNullOrUndefined } = require('util');
const os = require('os');
const CircularJSON = require('circular-json');
const GXADMIN_ALERT_TYPE = require('./GXAdminAlertTypes');

const path = require('path');
const thisFileName = path.basename(__filename);

class GXAdminAlert {
    constructor(awsRegion, srcEmailAddr = null, dstEmailAddr = null) {

        if(isNullOrUndefined(awsRegion)){
            if(isNullOrUndefined(process.env.AWSRegion)){
                throw new Error(`Initializing ${thisFileName} require passing AWS Region argument (awsRegion) or defining process.env.AWSRegion`);
            }
            this.awsRegion = process.env.AWSRegion;
        }else{
            this.awsRegion = awsRegion;
        }

        AWS.config.update( { region: this.awsRegion } );

        if(isNullOrUndefined(srcEmailAddr)){
            if(isNullOrUndefined(process.env.AWS_ADMIN_ALERT_SOURCE_EMAIL_ADDRESS)){
                throw new Error(`Initializing ${thisFileName} require passing Source Email Address argument or defining process.env.AWS_ADMIN_ALERT_SOURCE_EMAIL_ADDRESS`);
            }
            this.srcEmailAddr = process.env.AWS_ADMIN_ALERT_SOURCE_EMAIL_ADDRESS;
        }else{
            this.srcEmailAddr = srcEmailAddr;
        }

        if(isNullOrUndefined(dstEmailAddr)){
            if(isNullOrUndefined(process.env.AWS_ADMIN_ALERT_DST_EMAIL_ADDRESS)){
                throw new Error(`Initializing ${thisFileName} require passing Destination Email Address argument or defining process.env.AWS_ADMIN_ALERT_DST_EMAIL_ADDRESS`);
            }
            this.dstEmailAddr = process.env.AWS_ADMIN_ALERT_DST_EMAIL_ADDRESS;
        }else{
            this.dstEmailAddr = dstEmailAddr;
        }
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
                console.log(`${thisFileName}:> Succeeded. Response:${CircularJSON.stringify(response)}`)
            })
            .catch(function (error) {
                console.log(`${thisFileName}:> failed. error: ${CircularJSON.stringify(error)}`);
            });
    }

    notify(subject, message, alert_type = GXADMIN_ALERT_TYPE.NORMAL){
        const weakThis = this;
        return new Promise( async function f(resolve, reject) {
            try {
                const result = await weakThis.sendMail(subject, message, alert_type);
                if(alert_type === GXADMIN_ALERT_TYPE.URGENT){
                    await weakThis.sendMail(subject);
                }
                resolve(result);
            }catch (e) {
                console.error(`${thisFileName}::notify:> Failed. error: ${CircularJSON.stringify(e)}`);
                reject(e);
            }
        });
    }

    async sendMail(subject, message, alert_type = GXADMIN_ALERT_TYPE.NORMAL) {
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
                        console.error(`${thisFileName}::send_mail:> failed on AWS.SES. error: ${CircularJSON.stringify(err)}`);
                        reject(err);
                        return
                    }

                    console.log(`${thisFileName}::send_mail:> succeeded. data.MessageId:${data.MessageId}`);
                    resolve(data);
                });

                if(alert_type === GXADMIN_ALERT_TYPE.URGENT){
                    weak_this.sendSMS(subject);
                }
            }catch (e) {
                console.error(`${thisFileName}::send_mail:> catched an error. data.MessageId:${e}`);
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
            function (data) { console.log(`${thisFileName}::sendSMS > A SMS Message with ID:'${data.MessageId} was sent.'`); }).catch(
            function (err) { console.error(err, err.stack); });
    }

    getPushKitPlatformApplicationArn(pushProvider, isSandbox){
        //console.log("process.env.AWS_SNS_APPLE_VOIP_DEV: ", process.env.AWS_SNS_APPLE_PUSHKIT_DEV)
        if(pushProvider.toLowerCase() === 'apple'){
            if(isSandbox){
                return process.env.AWS_SNS_APPLE_PUSHKIT_DEV;
            }else{
                return process.env.AWS_SNS_APPLE_PUSHKIT_PRO;
            }
        }
        return null;
    }

    getPushNotificationPlatformApplicationArn(pushProvider, isSandbox){
        //console.log("process.env.AWS_SNS_APPLE_PUSH_NOTIFICATION_DEV: ", process.env.AWS_SNS_APPLE_PUSH_NOTIFICATION_DEV)
        if(pushProvider.toLowerCase() === 'apple'){
            if(isSandbox){
                return process.env.AWS_SNS_APPLE_PUSH_NOTIFICATION_DEV;
            }else{
                return process.env.AWS_SNS_APPLE_PUSH_NOTIFICATION_PRO;
            }
        }
        return null;
    }

    async createPlatformEndpoint(token, platformApplicationArn){
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            var params = {
                PlatformApplicationArn: platformApplicationArn, //'arn:aws:sns:us-west-2:903051898489:app/APNS_VOIP_SANDBOX/MyGix-Apple-PushKitVoip-Dev', /* required */
                Token: token
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
                //console.log(data);
                resolve(data);
            });
        });
    }



    async sendVoIPCallPushNotification(endPointArn, isSandbox){
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            const epoch_time = Math.floor( Date.now() / 1000 );
            var payload = {};
            var m_payload = {
                APNS_SANDBOX: {
                    aps:{
                        "content-available" : 1,

                        category:"gxnotification.call.incmmingCall",
                        "thread-id" : `${epoch_time}`
                    }
                }
            }

            if(isSandbox){
                payload.APNS_VOIP_SANDBOX = JSON.stringify(m_payload.APNS_SANDBOX);
            }else{
                payload.APNS_VOIP = JSON.stringify(m_payload.APNS_SANDBOX);
            }

            payload = JSON.stringify(payload);

            var params = {
                Message: payload,
                MessageStructure: 'json',
                TargetArn: endPointArn
            };

            weak_this.sns.publish(params, function(err, data) {
                if (err){
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                    return;
                }
                //console.log(data);
                resolve(data);
            });
        });
    }


    async sendGIXPushNotification(endPointArn, platform, isSandbox, data = null, isEncrypted = false, threadId = null ){
        const weak_this = this;
        return new Promise(function (resolve, reject) {
            const epoch_time = Math.floor( Date.now() / 1000 );
            var payload = {};

            var m_payload = {
                APNS_SANDBOX: {
                    aps:{
                        "content-available" : 1,
                        "mutable-content": 1,
                        "thread-id": epoch_time
                    }
                }
            };

            if(platform === 'apple'){
                if(!isNullOrUndefined(data)){
                    if(isEncrypted){
                        m_payload.APNS_SANDBOX["ENCRYPTED_DATA"] = data;
                        m_payload.APNS_SANDBOX["IS_ENCRYPTED"] = true;
                    }else{
                        m_payload.APNS_SANDBOX["PLAIN_DATA"] = data;
                        m_payload.APNS_SANDBOX["IS_ENCRYPTED"] = false;
                    }
                }

                if(isSandbox){
                    payload.APNS_SANDBOX = JSON.stringify(m_payload.APNS_SANDBOX);
                }else{
                    payload.APNS = JSON.stringify(m_payload.APNS_SANDBOX);
                }
            }

            payload = JSON.stringify(payload);

            var params = {
                Message: payload,
                MessageStructure: 'json',
                TargetArn: endPointArn
            };

            console.log(params)
            weak_this.sns.publish(params, function(err, data) {
                if (err){
                    console.log(err, err.stack); // an error occurred
                    reject(err);
                    return;
                }
                //console.log(data);
                resolve(data);
            });
        });
    }


};


module.exports = GXAdminAlert;