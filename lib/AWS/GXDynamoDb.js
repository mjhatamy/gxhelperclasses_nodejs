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

    /// var filtersWithComparatorArr = [
    //             {
    //                 "key":"expirationDate",
    //                 "value":currentEpochTime,
    //                 "comp": ">="
    //             },
    //             {
    //                 "key":"expirationDate",
    //                 "value":nextWeekEpochTime,
    //                 "comp": ">="
    //             }
    //         ]
    async query2(tableName, indexName = null, keyValuesWithComparatorArr,  filtersWithComparatorArr = undefined, nextToken = undefined,  ProjectionExpression = undefined){
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = { TableName: tableName };


            var ExpressionAttributeNames = {};
            var ExpressionAttributeValues = {};

            if(!isNullOrUndefined(keyValuesWithComparatorArr)){
                var KeyConditionExpression = "";
                var count = 0;
                for (var index in keyValuesWithComparatorArr) {
                    const item = keyValuesWithComparatorArr[index];
                    ExpressionAttributeNames[`#item${count}${item.key}`] = item.key;
                    ExpressionAttributeValues[`:item${count}${item.key}`] = AWS.DynamoDB.Converter.input(item.value);
                    if (count === 0) { KeyConditionExpression = `#item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    else { KeyConditionExpression = `${KeyConditionExpression} AND #item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    count += 1;
                }
                params.ExpressionAttributeNames = ExpressionAttributeNames;
                params.ExpressionAttributeValues = ExpressionAttributeValues;
                params.KeyConditionExpression = KeyConditionExpression;
            }

            if(!isNullOrUndefined(filtersWithComparatorArr)){
                var FilterExpression = "";
                var count = 0;

                for (var index in filtersWithComparatorArr) {
                    const item = filtersWithComparatorArr[index];
                    ExpressionAttributeNames[`#item${count}${item.key}`] = item.key;
                    ExpressionAttributeValues[`:item${count}${item.key}`] = AWS.DynamoDB.Converter.input(item.value);
                    if (count === 0) { FilterExpression = `${FilterExpression} #item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    else { FilterExpression = `${FilterExpression} AND #item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    count += 1;
                }
                params.ExpressionAttributeNames = ExpressionAttributeNames;
                params.ExpressionAttributeValues = ExpressionAttributeValues;
                params.FilterExpression = FilterExpression;
            }

            if(!isNullOrUndefined(indexName)){
                params.IndexName = indexName;
            }

            if(!isNullOrUndefined(nextToken)){
                params.ExclusiveStartKey = nextToken;
            }

            if(!isNullOrUndefined(ProjectionExpression)) {
                params.ProjectionExpression = ProjectionExpression;
            }

            weak_this.dynamodb.query( params, function (err, data) {
                if (err) { console.error(err); reject(err); return; }
                var items = [];
                for(var index in data.Items){
                    let item = AWS.DynamoDB.Converter.unmarshall(data.Items[index]);
                    if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { continue; }
                    items.push(item);
                }
                //console.log(data);
                resolve({"items":items, "nextToken": data.LastEvaluatedKey});
            });
        });
    }

    async query(tableName, indexName = undefined, KeyValuesJson, partitionKeyComparator = "=",  sortKeyComparator = "=", filtersJson = undefined, ProjectionExpression = undefined){
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = { TableName: tableName };
            if(!isNullOrUndefined(indexName)){ params.IndexName = indexName; }

            var count = 0;
            var KeyConditionExpression = "";
            var ExpressionAttributeValues = {};
            for(var key in KeyValuesJson){
                ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(KeyValuesJson[key]);
                if (count === 0) { KeyConditionExpression = `${KeyConditionExpression} ${key} ${partitionKeyComparator} :${key}`; }
                else { KeyConditionExpression = `${KeyConditionExpression} AND ${key} ${sortKeyComparator} :${key}`; }
                count += 1;
            }
            params.KeyConditionExpression = KeyConditionExpression;
            params.ExpressionAttributeValues = ExpressionAttributeValues;
            if(!isNullOrUndefined(ProjectionExpression)) {
                params.ProjectionExpression = ProjectionExpression;
            }

            weak_this.dynamodb.query( params, function (err, data) {
                if (err) { console.error(err); reject(err); return; }
                var items = [];
                for(var index in data.Items){
                    let item = AWS.DynamoDB.Converter.unmarshall(data.Items[index]);
                    if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { continue; }
                    items.push(item);
                }
                resolve(items);
            });
        });
    }

    async scan(tableName, filtersJson = undefined, indexName = undefined, nextToken = undefined){
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = { TableName: tableName };

            if(!isNullOrUndefined(filtersJson)){
                var FilterExpression = "";
                var ExpressionAttributeNames = {};
                var ExpressionAttributeValues = {};
                var count = 0;
                for (var key in filtersJson) {
                    ExpressionAttributeNames[`#${key}`] = key;
                    ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(filtersJson[key]);
                    if (count === 0) { FilterExpression = `${FilterExpression} #${key} = :${key}`; }
                    else { FilterExpression = `${FilterExpression} AND #${key} = :${key}`; }
                    count += 1;
                }
                params.ExpressionAttributeNames = ExpressionAttributeNames;
                params.ExpressionAttributeValues = ExpressionAttributeValues;
                params.FilterExpression = FilterExpression;
            }

            if(!isNullOrUndefined(indexName)){
                params.IndexName = indexName;
            }

            if(!isNullOrUndefined(nextToken)){
                params.ExclusiveStartKey = nextToken;
            }

            weak_this.dynamodb.scan( params, function (err, data) {
                if (err) { console.error(err); reject(err); return; }
                var items = [];
                for(var index in data.Items){
                    let item = AWS.DynamoDB.Converter.unmarshall(data.Items[index]);
                    if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { continue; }
                    items.push(item);
                }
                //console.log(data);
                resolve({"items":items, "nextToken": data.LastEvaluatedKey});
            });
        });
    }


    /// var filtersWithComparatorArr = [
    //             {
    //                 "key":"expirationDate",
    //                 "value":currentEpochTime,
    //                 "comp": ">="
    //             },
    //             {
    //                 "key":"expirationDate",
    //                 "value":nextWeekEpochTime,
    //                 "comp": ">="
    //             }
    //         ]
    async scanWithComparator(tableName, filtersWithComparatorArr = undefined, indexName = undefined, nextToken = undefined){
        const weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = { TableName: tableName };

            if(!isNullOrUndefined(filtersWithComparatorArr)){
                var FilterExpression = "";
                var ExpressionAttributeNames = {};
                var ExpressionAttributeValues = {};
                var count = 0;
                for (var index in filtersWithComparatorArr) {
                    const item = filtersWithComparatorArr[index];
                    ExpressionAttributeNames[`#item${count}${item.key}`] = item.key;
                    ExpressionAttributeValues[`:item${count}${item.key}`] = AWS.DynamoDB.Converter.input(item.value);
                    if (count === 0) { FilterExpression = `${FilterExpression} #item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    else { FilterExpression = `${FilterExpression} AND #item${count}${item.key} ${item.comp} :item${count}${item.key}`; }
                    count += 1;
                }
                params.ExpressionAttributeNames = ExpressionAttributeNames;
                params.ExpressionAttributeValues = ExpressionAttributeValues;
                params.FilterExpression = FilterExpression;
            }

            if(!isNullOrUndefined(indexName)){
                params.IndexName = indexName;
            }

            if(!isNullOrUndefined(nextToken)){
                params.ExclusiveStartKey = nextToken;
            }

            weak_this.dynamodb.scan( params, function (err, data) {
                if (err) { console.error(err); reject(err); return; }
                var items = [];
                for(var index in data.Items){
                    let item = AWS.DynamoDB.Converter.unmarshall(data.Items[index]);
                    if (isNullOrUndefined(item) || weak_this.isEmpty(item)) { continue; }
                    items.push(item);
                }
                //console.log(data);
                resolve({"items":items, "nextToken": data.LastEvaluatedKey});
            });
        });
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
    async updateItemByKeyValueAndJsonItems(tableName, tableKey, value, itemsToUpdate, updateAction = "SET") {
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

                var UpdateExpression = `${updateAction} `;
                var ExpressionAttributeNames = {};
                var ExpressionAttributeValues = {};
                var count = 0;
                var assignmentOperator = "=";
                if(updateAction === 'ADD'){
                    assignmentOperator = "";
                }
                for (var key in itemsToUpdate) {
                    ExpressionAttributeNames[`#${key}`] = key;
                    ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(itemsToUpdate[key]);
                    if (count === 0) {
                        UpdateExpression = `${UpdateExpression} #${key} ${assignmentOperator} :${key}`;
                    }
                    else {
                        UpdateExpression = `${UpdateExpression}, #${key} ${assignmentOperator} :${key}`
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


    async updateItemByKeyValueAndSortKeyValueAndJsonItems(tableName, partitionKey, partitionValue, sortKey, sortValue, itemsToUpdate, updateAction = "SET") {
        var weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = {
                Key: {
                    [partitionKey]: AWS.DynamoDB.Converter.input(partitionValue), [sortKey]: AWS.DynamoDB.Converter.input(sortValue) },
                ReturnValues: "ALL_NEW",
                TableName: tableName,
            };

            var UpdateExpression = `${updateAction} `;
            var ExpressionAttributeNames = {};
            var ExpressionAttributeValues = {};
            var count = 0;
            var assignmentOperator = "=";
            if(updateAction === 'ADD'){
                assignmentOperator = "";
            }
            for (var key in itemsToUpdate) {
                ExpressionAttributeNames[`#${key}`] = key;
                ExpressionAttributeValues[`:${key}`] = AWS.DynamoDB.Converter.input(itemsToUpdate[key]);
                if (count === 0) {
                    UpdateExpression = `${UpdateExpression} #${key} ${assignmentOperator} :${key}`;
                }
                else {
                    UpdateExpression = `${UpdateExpression}, #${key} ${assignmentOperator} :${key}`
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


    async putItem(tableName, itemsJson, onlyUpdateExitingItem = false) {
        var weak_this = this;
        return new Promise(function(resolve, reject) {
            var params = {
                TableName: tableName,
                ReturnValues: "ALL_NEW",
                Exists: onlyUpdateExitingItem
            };

            var items = {};
            for (var key in itemsJson) {
                items[key] =  AWS.DynamoDB.Converter.input(itemsJson[key]);
            }
            params.Items = items;

            weak_this.dynamodb.putItem(params, function(err, data) {
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
