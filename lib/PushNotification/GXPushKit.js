const PushNotifications = require('node-pushnotifications');
const { isNullOrUndefined } = require('util');
const CircularJson = require('circular-json');

class GXPushKit{
    constructor(provider, key, cert, passphrase, type = "voip"){
        this.provider = provider;
        this.key = key;
        this.cert = cert;
        this.passphrase = passphrase;
        this.type = type;
    }

    sendPushKit(payloadJson, badge = 1, deviceTokens, isSandbox = true, title, priority = 'high', topic = undefined){
        const weak_this = this;
        return new Promise(async function (resolve, reject) {
            const settings = { };
            if(weak_this.provider === 'apple') {
                settings.apn = {
                    key: weak_this.key,
                    cert: weak_this.cert,
                    passphrase: weak_this.passphrase,
                    production: !isSandbox
                }
            }

            const data = { title: title, priority: priority };
            data.custom = payloadJson;
            data.badge = badge;

            if(!isNullOrUndefined(topic)){
                data.topic = topic;
            }

            const push = new PushNotifications(settings);

            push.send(deviceTokens, data, (err, result) => {
                if(err){ reject(err);  return; }

                for(const index in result){
                    const item = result[index];
                    if(item.failure > 0 ){
                        if(!isNullOrUndefined(item.message)){
                            for(const rIndex in item.message){
                                const rItem = item.message[rIndex];
                                if(!isNullOrUndefined(rItem.errorMsg)){
                                    reject(rItem.errorMsg);
                                    return;
                                }
                                if(!isNullOrUndefined(rItem.error)){
                                    reject(rItem.error);
                                    return;
                                }
                            }
                        }
                    }
                }

                console.log(`Results::> ${CircularJson.stringify(result)}`);
                resolve(result);
            });
        });
    }
}

module.exports = GXPushKit;