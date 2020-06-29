
const axios = require('axios');
const endpoints  = require('../configs/endpoints');

let get_loan_products= function(token){     
  const headers ={    
    Accept: endpoints.endpoint_loan_products.headers.Accept,
    'Content-Type': endpoints.endpoint_loan_products.headers["Content-Type"],
    'authorization':  `Bearer ${token}`
  };    
    const options = {
        url: endpoints.endpoint_loan_products.url,
        method: endpoints.endpoint_loan_products.method,
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
module.exports = get_loan_products;



