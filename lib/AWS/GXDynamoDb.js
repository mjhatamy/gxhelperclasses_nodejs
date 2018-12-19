'use strict';

const { isNullOrUndefined } = require('util');

var AWS = require('aws-sdk');
//AWS.config.update({ region: process.env.AWSRegion });

class GXAWSDynamoDb {
    constructor(aws_region) {
        AWS.config.update({ region: aws_region});
        this.dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
    }
    isEmpty(obj) {
        for (const key in obj) { if (obj.hasOwnProperty(key)) return false; }
        return true;
    }


    async getItemByKeyValue(tableName, keyName, keyValue, ProjectionExpression = null) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = {
                Key: {
                    [keyName]: AWS.DynamoDB.Converter.input(keyValue)
                },
                TableName: tableName
            };
            if (!isNullOrUndefined(ProjectionExpression)) {
                params.ProjectionExpression = ProjectionExpression;
            }
            weak_this.dynamodb.getItem(params, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                let item = AWS.DynamoDB.Converter.unmarshall(data.Item);
                if (weak_this.isEmpty(item)) {
                    resolve(null);
                    return;
                }
                resolve(item);
            });
        });
    }


    async getItemByParitionKeyValueAndSortKeyValue(tableName, partitionKeyName, partitionValue, sortKeyName, sortValue, ProjectionExpression = null) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = {
                Key: {
                    [partitionKeyName]: AWS.DynamoDB.Converter.input(partitionValue),
                    [sortKeyName]: AWS.DynamoDB.Converter.input(sortValue)
                },
                TableName: tableName
            };

            if (!isNullOrUndefined(ProjectionExpression)) {
                params.ProjectionExpression = ProjectionExpression;
            }

            weak_this.dynamodb.getItem(params, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }

                if (isNullOrUndefined(data.Item)) {
                    resolve(null);
                    return;
                }
                let item = AWS.DynamoDB.Converter.unmarshall(data.Item);
                if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { resolve(null); return; }
                resolve(item);
            });
        });
    }




    //// ************************    UPDATE FUNCTIONS
    async updateItemByKeyValueAndJsonItems(tableName, tableKey, value, itemsToUpdate) {
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            try {
                var params = {
                    Key: {
                        [tableKey]: AWS.DynamoDB.Converter.input(value)
                    },
                    ReturnValues: "ALL_NEW",
                    TableName: tableName,
                };

                var UpdateExpression = "SET ";
                var ExpressionAttributeNames = {};
                var ExpressionAttributeValues = {};
                var count = 0;
                for (var key in itemsToUpdate) {
                    ExpressionAttributeNames[`#${key}`] = key;
                    ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(itemsToUpdate[key]);
                    if (count === 0) {
                        UpdateExpression = `${UpdateExpression} #${key} = :${key}`;
                    }
                    else {
                        UpdateExpression = `${UpdateExpression}, #${key} = :${key}`
                    }
                    count += 1;
                }

                params.ExpressionAttributeNames = ExpressionAttributeNames;
                params.ExpressionAttributeValues = ExpressionAttributeValues;
                params.UpdateExpression = UpdateExpression;

                weak_this.dynamodb.updateItem(params, function(err, data) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    let item = AWS.DynamoDB.Converter.unmarshall(data.Attributes);
                    if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { resolve(null); return; }
                    resolve(item);
                })
            }
            catch (e) {
                resolve(e);
            }
        });
    }


    async updateItemByKeyValueAndSortKeyValueAndJsonItems(tableName, partitionKey, partitionValue, sortKey, sortValue, itemsToUpdate) {
        var weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = {
                Key: {
                    [partitionKey]: AWS.DynamoDB.Converter.input(partitionValue), [sortKey]: AWS.DynamoDB.Converter.input(sortValue) },
                ReturnValues: "ALL_NEW",
                TableName: tableName,
            };

            var UpdateExpression = "SET ";
            var ExpressionAttributeNames = {};
            var ExpressionAttributeValues = {};
            var count = 0;
            for (var key in itemsToUpdate) {
                ExpressionAttributeNames[`#${key}`] = key;
                ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(itemsToUpdate[key]);
                if (count === 0) {
                    UpdateExpression = `${UpdateExpression} #${key} = :${key}`;
                }
                else {
                    UpdateExpression = `${UpdateExpression}, #${key} = :${key}`
                }
                count += 1;
            }
            params.ExpressionAttributeNames = ExpressionAttributeNames;
            params.ExpressionAttributeValues = ExpressionAttributeValues;
            params.UpdateExpression = UpdateExpression;

            weak_this.dynamodb.updateItem(params, function(err, data) {
                if (err) {
                    reject(err);
                    return;
                }

                let item = AWS.DynamoDB.Converter.unmarshall(data.Attributes);
                if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { resolve(null); return; }
                resolve(item);
            })
        });
    }

}

module.exports = GXAWSDynamoDb;
