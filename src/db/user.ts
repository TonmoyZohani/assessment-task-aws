import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { client, TABLE_NAME, EMAIL_INDEX } from "./client";
import { v4 as uuidv4 } from "uuid";
import { decodeNextToken, encodeNextToken } from "../utils/pagination";

export async function createUser({
  name,
  email,
  status,
}: {
  name: string;
  email: string;
  status?: string;
}) {
  // Check unique email
  const existing = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: EMAIL_INDEX,
      KeyConditionExpression: "#email = :email",
      ExpressionAttributeNames: { "#email": "email" },
      ExpressionAttributeValues: { ":email": email },
    })
  );

  if (existing.Items && existing.Items.length > 0) {
    throw new Error("Email already exists");
  }

  const item = {
    UserId: uuidv4(),
    name,
    email,
    status: status || "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUsers(args: any) {
  const { search, filter, dateFrom, dateTo, limit = 10, nextToken } = args;

  let FilterExpression = "";
  const ExpressionAttributeValues: Record<string, any> = {};
  const ExpressionAttributeNames: Record<string, string> = {
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
    if (FilterExpression) FilterExpression += " AND ";
    FilterExpression += "#status = :status";
    ExpressionAttributeValues[":status"] = filter.status;
  }

  if (dateFrom && dateTo) {
    if (FilterExpression) FilterExpression += " AND ";
    FilterExpression += "#createdAt BETWEEN :from AND :to";
    ExpressionAttributeValues[":from"] = dateFrom;
    ExpressionAttributeValues[":to"] = dateTo;
  }

  const params: any = {
    TableName: TABLE_NAME,
    Limit: limit,
    ExclusiveStartKey: decodeNextToken(nextToken),
    ExpressionAttributeNames,
  };

  if (FilterExpression) {
    params.FilterExpression = FilterExpression;
    params.ExpressionAttributeValues = ExpressionAttributeValues;
  }

  const data = await client.send(new ScanCommand(params));

  const sortedItems = (data.Items || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    items: sortedItems,
    nextToken: encodeNextToken(data.LastEvaluatedKey) || null,
  };
}
