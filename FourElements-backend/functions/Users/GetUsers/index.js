const {sendResponse, sendError} = require('../../../reponses/handler')

exports.handler = async (event) => {
  try {
    sendResponse("Hello")
  } catch (error) {
    sendError(404, error)
  }
  };
  
  // GLÖM INTE SÖKNING ANVÄNDARNAMN INNAN ID FINSN
  // GlobalSecondaryIndexes:
  // - IndexName: UsernameIndex
  //   KeySchema:
  //     - AttributeName: username
  //       KeyType: HASH
  //   Projection:
  //     ProjectionType: ALL