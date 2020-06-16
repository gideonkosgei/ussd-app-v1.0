const express = require('express');
const UssdMenu = require('ussd-menu-builder');
const menu = new UssdMenu();
const router = express.Router();
const getUserDetails = require('../helpers/requests');
const authenticate_user = require('../helpers/authenticate');

let sessions = {};
//session configurations
menu.sessionConfig({   
    start: (sessionId, callback) => {
        // initialize current session if it doesn't exist
        // this is called by menu.run()
        if (!(sessionId in sessions)) sessions[sessionId] = {};
        callback();
    },
    end: (sessionId, callback) => {
        // clear current session
        // this is called by menu.end()
        delete sessions[sessionId];
        callback();
    },
    set: (sessionId, key, value, callback) => {
        // store key-value pair in current session
        sessions[sessionId][key] = value;
        callback();
    },
    get: (sessionId, key, callback) => {
        // retrieve value by key in current session
        let value = sessions[sessionId][key];
        callback(null, value);
    }

    /*start: function(sessionId){
        return new Promise((resolve, reject) => {
            if (!(sessionId in sessions)) sessions[sessionId] = {};
            resolve();
        });
    },

    end: function(sessionId, ){
        return new Promise((resolve, reject) => {
            delete sessions[sessionId];
            resolve();
        });
    },
    
    set: function(sessionId, key, value){
        return new Promise((resolve, reject) => {
            sessions[sessionId][key] = value;
            resolve();
        });
    },
   
    // retrieve value by key in current session
    get: function(sessionId, key){
        return new Promise((resolve, reject) => {
            let value = sessions[sessionId][key];
            resolve(value);
        });
    }*/
});

//landing page
menu.startState({
    run:  () => {  
        getUserDetails(menu.args.phoneNumber)
        .then(results => {
            const user = results.name.toUpperCase();            
            menu.con(`Dear ${user}, Welcome to Tritel SACCO. Enter PIN To Proceed`);  
        }).catch(error => {  
            console.log(error.message)
            menu.end('Request failed.Contact customer care');
        }); 
    },
    next: {
        '*\\d+': 'authenticate_user'    
    }
});

//handling user authentication
menu.state('authenticate_user', {
    run:  () => {
        const pin = menu.val;
        //const phone_number =menu.args.phoneNumber;
        const phone_number = "+254786991654";     

        authenticate_user(phone_number,pin)
        .then((results) => { 
            const bearer_token  = results.token;
            menu.session.set('bearer_token', bearer_token)
            .then( () => {
                menu.con('Main Menu. Choose option:' +
                '\n1. Check balances'+
                '\n2. Check loan eligibility'+
                '\n3. M-pesa'+
                '\n4. Loans'+
                '\n000. logout'       
                ); 
            });   
        }).catch(error => {             
            menu.end('Wrong PIN. Try Again!');
            console.log(error.message);
        }); 
    },
    next: {  
        '1': 'check_balances',
        '2': 'check_loan_eligibility',
        '3': 'M-pesa', 
        '4': 'loans',
        '000': 'logout'
    }
});

menu.on('error', err => {
    // handle errors
    console.log(err);
});

router.post('*', async (req, res) => {    
    const {phoneNumber,sessionId,serviceCode,text}=   req.body; 
    let args = {
        phoneNumber: phoneNumber,
        sessionId: sessionId,
        serviceCode: serviceCode,
        text: text        
    };
        let resMsg = await menu.run(args);
        res.send(resMsg); 
});
module.exports = router;
