const { isNullOrUndefined } = require('util');
const CircularJSON = require('circular-json');
const { GXErrors } = require('./../GXErrors');
const GXAdminAlert = require('./GXAdminAlert');

var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWSRegion });

const path = require('path');
const this_fileName = path.basename(__filename);

class GXAWSS3 {
    constructor(aws_region) {
        this.aws_region = aws_region;
        this.s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    }

    async copyVoiceMailGreetingItemFor(srcBucket, srcKey, phoneNumber, srcKeyBasePath = null) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                const phoneNumber_first_3_digits = phoneNumber.substring(0, 3);
                const phoneNumber_second_3_digits = phoneNumber.substring(3, 6);
                const dstBucket = `${process.env.S3_BUCKET_VOICEMAIL_GREETINGS}`;

                const fileExt = path.extname(srcKey);

                var dstKey = ""
                if (!isNullOrUndefined(srcKeyBasePath)) {
                    dstKey = `${srcKeyBasePath}/${phoneNumber_first_3_digits}/${phoneNumber_second_3_digits}/${phoneNumber}${fileExt}`;
                }
                else {
                    dstKey = `${phoneNumber_first_3_digits}/${phoneNumber_second_3_digits}/${phoneNumber}${fileExt}`;
                }


                const copySource = `${srcBucket}/${srcKey}`;
                const params = {
                    Bucket: dstBucket,
                    Key: dstKey,
                    CopySource: copySource
                };
                weak_this.s3.copyObject(params, function(err, data) {
                    if (err) {
                        let errMsg = `${weak_this.constructor.name}::copyVoiceMailGreetingItemFor:> Request to copy S3 object from:${params.CopySource} to:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.log(errMsg);
                        new GXAdminAlert(weak_this.aws_region).sendMail(`${weak_this.constructor.name}::copyVoiceMailGreetingItemFor:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }
                    //console.log(`${weak_this.constructor.name}::copyVoiceMailGreetingItemFor:> Response data: ${CircularJSON.stringify(data)}`);

                    resolve({ "bucket": dstBucket, "key": dstKey });
                });
            }
            catch (e) {
                console.error(`${this_fileName}::copyVoiceMailGreetingItemFor:>Failed. Error:, ${CircularJSON.stringify(e)}`);
                resolve(e);
            }
        });
    }

    deleteVoiceMailItemFor(bucket, key) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                const params = { Bucket: bucket, Key: key };
                weak_this.s3.deleteObject(params, async function(err, data) {
                    if (err) {
                        let errMsg = `${weak_this.constructor.name}::deleteVoiceMailItemFor:> Request to delete S3 object in:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.log(errMsg);
                        await new GXAdminAlert(weak_this.aws_region).sendMail(`${weak_this.constructor.name}::deleteVoiceMailItemFor:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }
                    //console.log(`${weak_this.constructor.name}::deleteVoiceMailItemFor:> Response data: ${CircularJSON.stringify(data)}`);

                    resolve("done");
                });
            }
            catch (e) {
                console.error(`${this_fileName}::deleteVoiceMailItemFor:>Failed. Error:, ${CircularJSON.stringify(e)}`);
                resolve(e);
            }
        })
    }

    checkIfFileExist(bucket, key) {
        const weak_this = this;
        return new Promise( async function(resolve, reject) {
            try {
                var params = {
                    Bucket: bucket,
                    Key: key
                };
                weak_this.s3.headObject(params, async function(err, data) {
                    if (err) {
                        if (err.code === "NotFound" || err.code === "Forbidden" || err.code === "NoSuchKey") {
                            console.error(`${this_fileName}::checkIfFileExist:> errorCode: ${err.code}`);
                            resolve(false);
                            return;
                        }
                        let errMsg = `${this_fileName}::checkIfFileExist:> Request to check existance S3 object in:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.log(errMsg);
                        await new GXAdminAlert(weak_this.aws_region).sendMail(`${this_fileName}::checkIfFileExist:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            }
            catch (e) {
                console.error(`${this_fileName}::checkIfFileExist:>Failed. Error:, ${CircularJSON.stringify(e)}`);
                resolve(e);
            }
        });
    }


    getFile(bucket, key) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                var params = {
                    Bucket: bucket,
                    Key: key
                };
                weak_this.s3.getObject(params, async function(err, data) {
                    if (err) {
                        let errMsg = `${this_fileName}::getFile:> Request to get S3 object in:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.error(errMsg);
                        await new GXAdminAlert(weak_this.aws_region).sendMail(`${this_fileName}::getFile:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }

                    //console.log("Data:", data);
                    resolve(data);
                });
            }
            catch (e) {
                console.error(`${this_fileName}::getFile:>Failed. Error:, ${CircularJSON.stringify(e)}`);
                resolve(e);
            }
        });
    }


    deleteObject(bucket, key) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                const params = { Bucket: bucket, Key: key };
                weak_this.s3.deleteObject(params, async function(err, data) {
                    if (err) {
                        let errMsg = `${this_fileName}::deleteObject:> Request to delete S3 object in:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.log(errMsg);
                        await new GXAdminAlert(weak_this.aws_region).sendMail(`${weak_this.constructor.name}::deleteObject:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }
                    resolve("done");
                });
            }
            catch (e) {
                console.error(`${this_fileName}::deleteObject:>Failed. Error:, ${CircularJSON.stringify(e)}`);
                resolve(e);
            }
        })
    }

    putFileForPublicAuthenticatedRead(buffer, bucket, key) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                var params = {
                    ACL: "authenticated-read",
                    Bucket: bucket,
                    Key: key,
                    Body: buffer
                };
                weak_this.s3.putObject(params, async function(err, data) {
                    if (err) {
                        let errMsg = `${this_fileName}::putFileForPublicAuthenticatedRead:> Request to put S3 object in:${params.Bucket}/${params.Key} failed with error:${CircularJSON.stringify(err)}.`;
                        console.error(errMsg);
                        await new GXAdminAlert(weak_this.aws_region).sendMail(`${weak_this.constructor.name}::putFileForPublicAuthenticatedRead:> Failed.`, errMsg);
                        reject(err);
                        return;
                    }

                    resolve(data);
                });
            }
            catch (e) {
                console.error("Failed. Error:", CircularJSON.stringify(e));
                resolve(e);
            }
        });
    }

}

module.exports = GXAWSS3;
