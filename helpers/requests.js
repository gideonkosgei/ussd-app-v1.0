const axios = require('axios');

// user Authentication  
const validate_member =  function (config,msisdn) {     
    const data = {
      phone_number:msisdn   
    };
    const options = {
      url: config.url,
      method: config.method,
      headers: config.headers,   
      params: data
    }

    return new Promise((resolve, reject) => {
      axios(options).then(res => {        
          resolve(res.data);
      }).catch(err => reject(err));
  });       
}

module.exports = validate_member;




