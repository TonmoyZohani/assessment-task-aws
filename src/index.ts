import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// DynamoDB Client Configuration
const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
}));

const TABLE_NAME = process.env.TABLE_NAME || "Users";
const EMAIL_INDEX = process.env.EMAIL_INDEX || "EmailIndex";

console.log("DynamoDB client initialized with table:", TABLE_NAME);

// Interfaces
interface User {
  UserId: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  status?: string;
}

interface GetUsersArgs {
  search?: string;
  filter?: {
    status?: string;
  };
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  nextToken?: string;
}

interface GetUsersResponse {
  items: User[];
  nextToken: string | null;
}

interface AppSyncEvent {
  info: {
    fieldName: string;
  };
  arguments: {
    input?: CreateUserInput;
    search?: string;
    filter?: any;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    nextToken?: string;
  };
}

// Pagination Utilities
function decodeNextToken(token?: string): any {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch (error) {
    console.error("Error decoding token:", error);
    return undefined;
  }
}

function encodeNextToken(lastEvaluatedKey?: any): string | null {
  if (!lastEvaluatedKey) return null;
  try {
    return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
  } catch (error) {
    console.error("Error encoding token:", error);
    return null;
  }
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Create user function
async function createUser({ name, email, status }: CreateUserInput): Promise<User> {
  console.log("Creating user:", { name, email, status });
  
  // Input validation
  if (!name || !email) {
    throw new Error("Name and email are required");
  }
  
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }

  // Check if email already exists
  const existing = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: EMAIL_INDEX,
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: { ":email": email },
  }));

  if (existing.Items && existing.Items.length > 0) {
    throw new Error("Email already exists");
  }

  const item: User = {
    UserId: randomUUID(), // Using Node.js built-in crypto
    name: name.trim(),
    email: email.toLowerCase().trim(),
    status: status || "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await client.send(new PutCommand({ 
    TableName: TABLE_NAME, 
    Item: item 
  }));
  
  console.log("User created successfully:", item.UserId);
  return item;
}

// Get users function
async function getUsers(args: GetUsersArgs = {}): Promise<GetUsersResponse> {
  const { search, filter, dateFrom, dateTo, limit = 10, nextToken } = args;
  
  console.log("Getting users with args:", { search, filter, dateFrom, dateTo, limit });

  let filters: string[] = [];
  let expressionAttrValues: { [key: string]: any } = {};

  // Search by name or email
  if (search) {
    filters.push("(contains(#name, :search) OR contains(email, :search))");
    expressionAttrValues[":search"] = search;
  }

  // Filter by status
  if (filter?.status) {
    filters.push("#status = :status");
    expressionAttrValues[":status"] = filter.status;
  }

  // Filter by date range
  if (dateFrom && dateTo) {
    filters.push("createdAt BETWEEN :from AND :to");
    expressionAttrValues[":from"] = dateFrom;
    expressionAttrValues[":to"] = dateTo;
  }

  const params = {
    TableName: TABLE_NAME,
    Limit: Math.min(limit, 100),
    ExclusiveStartKey: decodeNextToken(nextToken),
  } as any;

  // Add filter expression only if any filters exist
  if (filters.length > 0) {
    params.FilterExpression = filters.join(" AND ");
    params.ExpressionAttributeValues = expressionAttrValues;
    params.ExpressionAttributeNames = {
      "#name": "name",
      "#status": "status"
    };
  }

  console.log("Scan parameters:", JSON.stringify(params, null, 2));
  
  const data = await client.send(new ScanCommand(params));

  // Sort by createdAt descending
  const sortedItems = (data.Items as User[] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const response: GetUsersResponse = {
    items: sortedItems,
    nextToken: encodeNextToken(data.LastEvaluatedKey) || null,
  };
  
  console.log(`Returning ${sortedItems.length} users`);
  return response;
}

// Main Lambda handler
export const handler = async (event: AppSyncEvent) => {
  console.log("Event received:", JSON.stringify(event, null, 2));
  
  try {
    const field = event.info.fieldName;
    
    if (field === "createUser") {
      console.log("Processing createUser");
      const result = await createUser(event.arguments.input!);
      console.log("CreateUser result:", result);
      return result;
    }
    
    if (field === "getUsers") {
      console.log("Processing getUsers");
      
      const getUsersArgs: GetUsersArgs = {
        search: event.arguments.search,
        filter: event.arguments.filter,
        dateFrom: event.arguments.dateFrom,
        dateTo: event.arguments.dateTo,
        limit: event.arguments.limit,
        nextToken: event.arguments.nextToken
      };
      
      const result = await getUsers(getUsersArgs);
      console.log("GetUsers result count:", result.items.length);
      return result;
    }
    
    throw new Error(`Unknown field: ${field}`);
  } catch (error) {
    console.error("Error in handler:", error);
    throw error;
  }
};

console.log("Lambda function loaded successfully");