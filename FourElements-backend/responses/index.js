function sendResponse(data) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        data,
      }),
    };
  }
  
 function sendError(statusCode, errorMessage) {
    return {
      statusCode: statusCode,
      body: JSON.stringify({ errorMessage: "Oh my.. something went terribly wrong!" }),
    };
  }
  
  // module.exports = { sendResponse, sendError };
  export default { sendResponse, sendError };
  