"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_INDEX = exports.TABLE_NAME = exports.client = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
exports.client = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({}));
exports.TABLE_NAME = process.env.TABLE_NAME;
exports.EMAIL_INDEX = process.env.EMAIL_INDEX || "EmailIndex";
