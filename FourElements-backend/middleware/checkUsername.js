import db from '../services/db'
import { QueryCommand } from '@aws-sdk/client-dynamodb'

export default async function getUserByUsername (username) {
    const params = {
        TableName: 'UsersTable',
        IndexName: 'UsernameIndex',
        KeyConditionExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': { S: username }
        }
    }

    try {
        const result = await db.send(new QueryCommand(params))
        console.log('result:', result);

        if (result && result.Items && Array.isArray(result.Items) && result.Items.length > 0) {
            return true  // Username exists
        }

        return false
      
    } catch (error) {
        console.error("Error querying DynamoDB:", error)
        throw new Error("Error querying DynamoDB")
    }   
}

