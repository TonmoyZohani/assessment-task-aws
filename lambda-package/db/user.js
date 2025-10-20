"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUsers = getUsers;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_1 = require("./client");
const uuid_1 = require("uuid");
const pagination_1 = require("../utils/pagination");
async function createUser({ name, email, status, }) {
    // Check unique email
    const existing = await client_1.client.send(new lib_dynamodb_1.QueryCommand({
        TableName: client_1.TABLE_NAME,
        IndexName: client_1.EMAIL_INDEX,
        KeyConditionExpression: "#email = :email",
        ExpressionAttributeNames: { "#email": "email" },
        ExpressionAttributeValues: { ":email": email },
    }));
    if (existing.Items && existing.Items.length > 0) {
        throw new Error("Email already exists");
    }
    const item = {
        UserId: (0, uuid_1.v4)(),
        name,
        email,
        status: status || "ACTIVE",
        createdAt: new Date().toISOString(),
    };
    await client_1.client.send(new lib_dynamodb_1.PutCommand({ TableName: client_1.TABLE_NAME, Item: item }));
    return item;
}
async function getUsers(args) {
    const { search, filter, dateFrom, dateTo, limit = 10, nextToken } = args;
    let FilterExpression = "";
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {
        "#name": "name",
        "#email": "email",
        "#status": "status",
        "#createdAt": "createdAt",
    };
    if (search) {
        FilterExpression +=
            "(contains(#name, :search) OR contains(#email, :search))";
        ExpressionAttributeValues[":search"] = search;
    }
    if (filter?.status) {
        if (FilterExpression)
            FilterExpression += " AND ";
        FilterExpression += "#status = :status";
        ExpressionAttributeValues[":status"] = filter.status;
    }
    if (dateFrom && dateTo) {
        if (FilterExpression)
            FilterExpression += " AND ";
        FilterExpression += "#createdAt BETWEEN :from AND :to";
        ExpressionAttributeValues[":from"] = dateFrom;
        ExpressionAttributeValues[":to"] = dateTo;
    }
    const params = {
        TableName: client_1.TABLE_NAME,
        Limit: limit,
        ExclusiveStartKey: (0, pagination_1.decodeNextToken)(nextToken),
        ExpressionAttributeNames,
    };
    if (FilterExpression) {
        params.FilterExpression = FilterExpression;
        params.ExpressionAttributeValues = ExpressionAttributeValues;
    }
    const data = await client_1.client.send(new lib_dynamodb_1.ScanCommand(params));
    const sortedItems = (data.Items || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
        items: sortedItems,
        nextToken: (0, pagination_1.encodeNextToken)(data.LastEvaluatedKey) || null,
    };
}
