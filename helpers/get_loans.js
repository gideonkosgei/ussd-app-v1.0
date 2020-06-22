
const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let get_loans = function(token){   
  
  const headers ={    
    Accept: endpoints.endpoint_loans.headers.Accept,
    'Content-Type': endpoints.endpoint_loans.headers["Content-Type"],
    'authorization':  `Bearer ${token}`
  };    
    const options = {
        url: endpoints.endpoint_loans.url,
        method: endpoints.endpoint_loans.method,
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
module.exports = get_loans;



