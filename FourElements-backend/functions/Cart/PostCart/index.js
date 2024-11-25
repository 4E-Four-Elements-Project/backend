const {sendResponse, sendError} = require('../../../reponses/handler')

exports.handler = async (event) => {
  try {
    sendResponse("Hello")
  } catch (error) {
    sendError(404, error)
  }
  };
  