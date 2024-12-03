import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDB({
  region: "eu-north-1", // Ensure this is the correct region
});

// Create the DynamoDB Document Client
const db = DynamoDBDocumentClient.from(client);

// Export the client
export default db;
