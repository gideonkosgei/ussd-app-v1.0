
const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let authenticate_user = function(phone_number,pin){   

  //get token for basic authorization
  //const basic_token = Buffer.from(`${phone_number}:${pin}`, "utf8").toString('base64'); 
  
  //rebuild header to accept authorization attribute
  const headers ={
    /*Accept: endpoints.endpoint_authenticate_user.headers.Accept,
    'Content-Type': endpoints.endpoint_authenticate_user.headers["Content-Type"],
    'authorization':  `Basic ${basic_token}`
    }; */   

    Accept: endpoints.endpoint_authenticate_user.headers.Accept,
    'Content-Type': endpoints.endpoint_authenticate_user.headers["Content-Type"]   
    };  

    const options = {
        url: endpoints.endpoint_authenticate_user.url,
        method: endpoints.endpoint_authenticate_user.method,
        headers: headers,
        auth: {
          username: phone_number,
          password: pin
        }       
    };    
   
    return new Promise((resolve, reject) => {
      axios(options)
      .then(res => {           
          resolve(res.data);
      })
      .catch(err => reject(err));
  });    
};
module.exports = authenticate_user;



