
const axios = require('axios');
const endpoint_validate_member  = require('../configs/endpoints');

const options = {
    url: endpoint_validate_member.url,
    method: endpoint_validate_member.method,
    headers: endpoint_validate_member.headers   
    //params: data
  }


let validateMember = function(req, res, next){ 
   let user = req.body.phoneNumber;
   let mobileNumber = [];
   let i = 0;
   return  axios(options)
        .then(results => { 
            for (i = 0; i < results.data.length; i++) {
                mobileNumber.push(results.data[i].phone);
            } 
            let validUser = mobileNumber.includes(user);         
                  
            if(validUser){                        
                req.body.user = user;                        
                next()
            }else{
                res.send(`END You are not a registered member!`)
            }
              
        }).catch(error => {
            console.log("Error",error)
        })
};

module.exports = validateMember;



