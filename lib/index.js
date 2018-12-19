'use strict';

var GXAWSDynamoDb = require('./AWS/GXDynamoDb');
var GXAWSS3 = require('./AWS/GXAWSS3');
var GXErrors = require('./GXErrors');
module.exports = { GXAWSDynamoDb: GXAWSDynamoDb,
                    GXAWSS3: GXAWSS3, GXErrors: GXErrors };