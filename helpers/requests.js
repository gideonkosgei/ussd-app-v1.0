
const axios = require('axios');
const endpoint_validate_member  = require('../configs/endpoints');

const options = {
    url: endpoint_validate_member.url,
    method: endpoint_validate_member.method,
    headers: endpoint_validate_member.headers   
    //params: data
  }


let listMembers = function(){  
    return new Promise((resolve, reject) => {
      axios(options)
      .then(res => {        
          resolve(res);
      })
      .catch(err => reject(err));
  });  
   
};

module.exports = listMembers;



