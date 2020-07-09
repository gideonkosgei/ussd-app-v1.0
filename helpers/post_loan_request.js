const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let post_loan_request = function(token,data){     
  const headers ={    
    Accept: endpoints.endpoint_loan_request.headers.Accept,
    'Content-Type': endpoints.endpoint_loan_request.headers["Content-Type"],
    'authorization':  `Bearer ${token}`
  }; 

    const options = {
        url: endpoints.endpoint_loan_request.url,
        method: endpoints.endpoint_loan_request.method,
        headers: headers,
        data: data     
    };      
    return new Promise((resolve, reject) => {   
      axios(options)
      .then(res => {        
          resolve(res.data);
      })
      .catch(err => reject(err));
  });    
};
module.exports = post_loan_request;



