
const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let get_balances = function(token){   
  //rebuild header to accept authorization attribute
  const headers ={
    Accept: endpoints.endpoint_eligibility_status.headers.Accept,
    'Content-Type': endpoints.endpoint_eligibility_status.headers["Content-Type"],
    'authorization':  `Bearer ${token}`
  };    
    const options = {
        url: endpoints.endpoint_eligibility_status.url,
        method: endpoints.endpoint_eligibility_status.method,
        headers: headers         
    }; 
    return new Promise((resolve, reject) => {
      axios(options)
      .then(res => {        
          resolve(res.data);
      })
      .catch(err => reject(err));
  });    
};
module.exports = get_balances;



