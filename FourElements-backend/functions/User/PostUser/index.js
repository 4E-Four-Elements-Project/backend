import responseHandler from '../../../responses/index'
import middy from '@middy/core'
import { v4 as uuid } from 'uuid'
import db from '../../../services/db'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { QueryCommand } from '@aws-sdk/client-dynamodb'
import jsonBodyParser from '@middy/http-json-body-parser'
import bcrypt from "bcryptjs";
// import httpErrorHandler from '@middy/http-error-handler'
// import validator from '@middy/validator'
// import { transpileSchema } from '@middy/validator/transpile'
import hash from '../../../middleware/hash'
// import getUserByUsername from '../../../middleware/checkUsername.js'
import roles from '../../../services/roles'

const {sendResponse, sendError} = responseHandler
const {hashPassword} = hash
const TABLE_NAME = 'UsersTable'

const getUserByUsername = async (username) => {
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

const createUserHandler = async (event, context) => {
  const userId = uuid()
  const {username, email, password} = event.body
  console.log(event);

  //Check if username already exist in database
  const isUsernameTaken = await getUserByUsername(username)
  if(isUsernameTaken) return sendError(400, "Username already taken")
    
  try {
    //Hash password
    const hashedPassword = await hashPassword(password)

    //Save parameters
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: userId,
        username: username,
        password: hashedPassword,
        email: email,
        role: "user",
        tokens: []
      },
    }
    
    //Send request to database
    await db.send(new PutCommand(params))

    return sendResponse({ message: 'User created successfully', userId: userId })

  } catch (error) {
    console.error('Error creating user:', error)
    return sendError(500, "Failed to create user")

  }
}

const schema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        username: { type: 'string', minLength: 4 },
        email: { type: 'string', minLength: 10 },
        password: { type: 'string', minLength: 7 },
      },
      required: ['username', 'email', 'password'],
    },
  },
}


export const handler = middy(createUserHandler)
  .use(jsonBodyParser())
  // .use(validator({ eventSchema: transpileSchema(schema) }))
  // .use(httpErrorHandler())