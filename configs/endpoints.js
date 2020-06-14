const api_configs = require('../configs/api');

//user authentication
 const endpoint_validate_member = {
    url: `${api_configs.api}/members`,
    method: 'GET',
    headers: api_configs.headers   
  }; 

module.exports = endpoint_validate_member;
 