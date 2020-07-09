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

//get member eligiblity status
const endpoint_eligibility_status = {
  url: `${api_configs.api}/member`,
  method: 'GET',
  headers: api_configs.headers   
};

//get member balances
const endpoint_balances = {
  url: `${api_configs.api}/member`,
  method: 'GET',
  headers: api_configs.headers   
}; 

//get member balances
const endpoint_loans = {
  url: `${api_configs.api}/loans`,
  method: 'GET',
  headers: api_configs.headers   
}; 

//get loan products
const endpoint_loan_products = {
  url: `${api_configs.api}/GetLoanProducts`,
  method: 'GET',
  headers: api_configs.headers   
}; 

//get loan pre-computations
const endpoint_loan_pre_computations = {
  url: `${api_configs.api}/loanCalculator`,
  method: 'POST',
  headers: api_configs.headers   
}; 

//post loan request
const endpoint_loan_request = {
  url: `${api_configs.api}/ApplyLoan`,
  method: 'POST',
  headers: api_configs.headers   
}; 

module.exports = {
  endpoint_validate_user,
  endpoint_authenticate_user,
  endpoint_eligibility_status,
  endpoint_balances,
  endpoint_loans,
  endpoint_loan_products,
  endpoint_loan_pre_computations,
  endpoint_loan_request
}
 