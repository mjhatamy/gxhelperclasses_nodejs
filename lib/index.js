'use strict';

var GXAWSDynamoDb = require('./AWS/GXDynamoDb');
var GXAWSS3 = require('./AWS/GXAWSS3');
var GXErrors = require('./GXErrors');
var GxError = require('./GxError');
var GXPushKit = require('./PushNotification/GXPushKit');

var GXCognitoIdentity = require('./AWS/GXCognitoIdentity');

var GXAdminAlert = require('./AWS/GXAdminAlert');
var GXADMIN_ALERT_TYPE = require('./AWS/GXAdminAlertTypes');

module.exports = { GXAWSDynamoDb: GXAWSDynamoDb, GXAWSS3: GXAWSS3, GXErrors: GXErrors, GxError: GxError,
    GXCognitoIdentity:GXCognitoIdentity, GXPushKit: GXPushKit,
    GXADMIN_ALERT_TYPE: GXADMIN_ALERT_TYPE, GXAdminAlert: GXAdminAlert };