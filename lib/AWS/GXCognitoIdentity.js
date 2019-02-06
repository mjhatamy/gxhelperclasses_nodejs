const { isNullOrUndefined, isNull } = require('util');
const CircularJSON = require('circular-json');
const { GXErrors } = require('./../GXErrors');

var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWSRegion });

class GXCognitoIdentity{
    constructor(aws_region, IdentityPoolId, AWS_DEV_IDENTITY_PROVIDER, AWS_Identity_TokenDuration = 360) {
        this.AWS_IdentityPoolId = IdentityPoolId || process.env.AWS_IdentityPoolId;
        this.AWS_DEV_IDENTITY_PROVIDER = AWS_DEV_IDENTITY_PROVIDER || process.env.AWS_DEV_IDENTITY_PROVIDER;
        this.AWS_Identity_TokenDuration = AWS_Identity_TokenDuration || process.env.AWS_Identity_TokenDuration;
        AWS.config.update({ region: aws_region});
        this.cognitoidentity = new AWS.CognitoIdentity({ apiVersion: '2014-06-30' });
    }



    ///On success returns a json object containing
    async getTokenId(username, previousIdentityId = null) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {

            let cognitoidentityParams = {
                IdentityPoolId: weak_this.AWS_IdentityPoolId,
                /* required */

                Logins: { /* required */ },
                //IdentityId: 'MyGix',
                TokenDuration: parseInt(weak_this.AWS_Identity_TokenDuration)
            };

            if(!isNullOrUndefined(previousIdentityId)){
                cognitoidentityParams.IdentityId = previousIdentityId;
            }

            cognitoidentityParams.Logins[process.env.AWS_DEV_IDENTITY_PROVIDER] = username;

            weak_this.cognitoidentity.getOpenIdTokenForDeveloperIdentity(cognitoidentityParams, function(error, data) {
                if (error) {
                    console.log("previousIdentityId: ", previousIdentityId);
                    console.log("Error:", error);
                    //console.log(`Failed to get getOpenIdTokenForDeveloperIdentity. Error: ${error}`);
                    reject(GXErrors.AUTH_TOKEN_RETRIEVE_FAILED);
                    return;
                }

                if (isNullOrUndefined(data)) {
                    //console.log(`getOpenIdTokenForDeveloperIdentity suceeded but data is empty.`);
                    reject(GXErrors.AUTH_TOKEN_RETRIEVE_EMPTY);
                    return;
                }
                console.log("getOpenIdTokenForDeveloperIdentity::> ", CircularJSON.stringify(data));

                //console.log("Data Received : " + data.IdentityId);
                resolve({ identityId: data.IdentityId, token: data.Token});
            });
        })
    }

    ///On success returns a json object containing
    async getIdentityIdForUsername(username, previousIdentityId = null) {
        var weak_this = this;
        return new Promise(function(resolve, reject) {

            var cognitoidentityParams = {
                IdentityPoolId: weak_this.AWS_IdentityPoolId,
                /* required */

                Logins: { /* required */ },
                //IdentityId: 'MyGix',
                TokenDuration: parseInt(weak_this.AWS_Identity_TokenDuration)
            };

            if(!isNullOrUndefined(previousIdentityId)){
                cognitoidentityParams.IdentityId = previousIdentityId;
            }

            cognitoidentityParams.Logins[weak_this.AWS_DEV_IDENTITY_PROVIDER] = username;

            weak_this.cognitoidentity.getOpenIdTokenForDeveloperIdentity(cognitoidentityParams, function(error, data) {
                if (error) {
                    console.log("previousIdentityId: ", previousIdentityId);
                    console.log("Error:", error);
                    //console.log(`Failed to get getOpenIdTokenForDeveloperIdentity. Error: ${error}`);
                    reject(GXErrors.AUTH_TOKEN_RETRIEVE_FAILED);
                    return;
                }

                if (isNullOrUndefined(data)) {
                    console.log(`getOpenIdTokenForDeveloperIdentity suceeded but data is empty.`);
                    reject(GXErrors.AUTH_TOKEN_RETRIEVE_EMPTY);
                    return;
                }
                console.log("getOpenIdTokenForDeveloperIdentity::> ", CircularJSON.stringify(data));

                //console.log("Data Received : " + data.IdentityId);
                resolve({ identityId: data.IdentityId, token: data.Token});
            });
        })
    }

}

module.exports = GXCognitoIdentity;