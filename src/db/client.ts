import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const TABLE_NAME = process.env.TABLE_NAME as string;
export const EMAIL_INDEX = process.env.EMAIL_INDEX || "EmailIndex";
