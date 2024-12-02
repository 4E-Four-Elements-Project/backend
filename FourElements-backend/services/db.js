// const { DynamoDB } = require("@aws-sdk/client-dynamodb");
import { DynamoDB } from "@aws-sdk/client-dynamodb";
// const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDB({
  region:  "eu-north-1",
});

export default db = DynamoDBDocumentClient.from(client);

// module.exports = { db };