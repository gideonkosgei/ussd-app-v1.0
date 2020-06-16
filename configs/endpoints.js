const api_configs = require('../configs/api');

//user validation
 const endpoint_validate_user = {
    url: `${api_configs.api}/searchMember`,
    method: 'GET',
    headers: api_configs.headers   
  }; 

  //user authentication
 const endpoint_authenticate_user = {
  url: `${api_configs.api}/token`,
  method: 'GET',
  headers: api_configs.headers   
}; 

module.exports = {
  endpoint_validate_user,
  endpoint_authenticate_user
}
 