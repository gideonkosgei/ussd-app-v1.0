const axios = require('axios');
const endpoints  = require('../configs/endpoints');



let validateUser = function(req, res, next){ 
    const body = {
        phone_number:req.body.phoneNumber        
      };    
   
    const options = {
        url: endpoints.endpoint_validate_user.url,
        method: endpoints.endpoint_validate_user.method,
        headers: endpoints.endpoint_validate_user.headers,  
        data: body
      };  
      
   return  axios(options)
        .then(results => {  
            if(!results.data.exist){                        
                res.send(`END You are not a registered member!`);  
            }else if (!results.data.active){
                res.send(`END You are not an active member!`);
            } else{ 
                next();
            }  
        }).catch(error => {
            const generic_message = 'Request failed.Contact customer care';
            res.send(`END ${generic_message}`);
            console.log(error.message)
        })
};
module.exports = validateUser;



