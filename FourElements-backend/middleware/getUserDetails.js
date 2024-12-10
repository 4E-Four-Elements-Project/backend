import responseHandler from '../responses/index'
const {sendError} = responseHandler
import db from '../services/db'
import { QueryCommand } from '@aws-sdk/client-dynamodb'

const getUser = async (username) => {

    //Save params for database query
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

        //Returns user details if found in database
        return result.Items[0]
       
      
    } catch (error) {
        console.error("Error querying DynamoDB:", error)
        sendError(500, "Error querying DynamoDB")
    }   
}

export default getUser