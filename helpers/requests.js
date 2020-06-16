
const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let getUserDetails = function(phone_number){  
  const body = {
    phone_number:phone_number       
  };   

    const options = {
        url: endpoints.endpoint_validate_user.url,
        method: endpoints.endpoint_validate_user.method,
        headers: endpoints.endpoint_validate_user.headers,  
        data: body
    };    

    return new Promise((resolve, reject) => {
      axios(options)
      .then(res => {        
          resolve(res.data);
      })
      .catch(err => reject(err));
  });  
   
};

module.exports = getUserDetails;



