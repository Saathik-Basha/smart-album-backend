module.exports=(statusCode,body,headers = {})=>(
    {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        ...headers
      },
      body:JSON.stringify(body),
    }
)