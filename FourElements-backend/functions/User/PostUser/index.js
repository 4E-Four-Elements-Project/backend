import responseHandler from '../../../responses/index'
const {sendResponse, sendError} = responseHandler
import db from '../../../services/db'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import middy from '@middy/core'
import { v4 as uuid } from 'uuid'
import jsonBodyParser from '@middy/http-json-body-parser'
import httpErrorHandler from '@middy/http-error-handler'
import validator from '@middy/validator'
import {transpileSchema} from '@middy/validator/transpile'
import hashPassword from '../../../middleware/hash'
import getUserByUsername from '../../../middleware/checkUsername'

const TABLE_NAME = 'UsersTable'

 // GLÖM INTE SÖKNING ANVÄNDARNAMN INNAN ID FINSN
  // GlobalSecondaryIndexes:
  // - IndexName: UsernameIndex
  //   KeySchema:
  //     - AttributeName: username
  //       KeyType: HASH
  //   Projection:
  //     ProjectionType: ALL

const createUserHandler = async (event, context) => {
  const userId = uuid()
  const {username, email, password} = event.body
  console.log(event);

  //Check if username already exist in database
  const isUsernameTaken = await getUserByUsername(username)
  if(isUsernameTaken) return sendError(400, "Username already taken")
    console.log(isUsernameTaken);
    
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
        role: "customer"
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


module.exports.handler = middy(createUserHandler)
  .use(jsonBodyParser())
  .use(validator({ eventSchema: transpileSchema(schema) }))
  .use(httpErrorHandler())