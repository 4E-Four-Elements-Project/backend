function sendResponse(data) {

  const cspHeader = 
  "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self'; style-src 'self'; font-src 'self' https://fonts.googleapis.com; object-src 'none';"
  //OBS! remove 'unsafe-inline' before production
  //connect-src: Include self and your API URLs if you’re making API calls.

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Security-Policy-Report-Only":  cspHeader // change to "Content-Security-Policy" for production
      },
      body: JSON.stringify({
        data,
      }),
    };
  }
  
 function sendError(statusCode, errorMessage) {
    return {
      statusCode: statusCode,
      body: JSON.stringify({ errorMessage }),
    };
  }
  
  export default { sendResponse, sendError };
  