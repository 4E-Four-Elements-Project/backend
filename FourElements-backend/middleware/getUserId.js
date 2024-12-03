import responseHandler from '../responses/index'
const {sendResponse, sendError} = responseHandler
import db from '../services/db'
import { QueryCommand } from '@aws-sdk/client-dynamodb'

export default getUserId = async (username) => {
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

        if(!result || !result.Items || result.Items.length === 0) {
            return sendError(404, "User not found")
        }

        return result.Items[0]
       
      
    } catch (error) {
        console.error("Error querying DynamoDB:", error)
        sendError(500, "Error querying DynamoDB")
    }   
}