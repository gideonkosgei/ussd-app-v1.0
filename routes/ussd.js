const express = require('express');
const UssdMenu = require('ussd-menu-builder');
const menu = new UssdMenu();
const router = express.Router();
const getUserDetails = require('../helpers/requests');
const authenticate_user = require('../helpers/authenticate');
const get_eligibility_status = require('../helpers/get_eligibility_status');
const get_balances = require('../helpers/get_balances');


let sessions = {};
//session configurations
menu.sessionConfig({
    start: (sessionId) => {
        return new Promise((resolve, reject) => {
            if (!(sessionId in sessions)) sessions[sessionId] = {};
            resolve();
        });
    },
    end: (sessionId) => {
        return new Promise((resolve, reject) => {
            delete sessions[sessionId];
            resolve();
        });
    },    
    set: (sessionId, key, value) => {
        return new Promise((resolve, reject) => {
            sessions[sessionId][key] = value;
            resolve();
        });
    },
    get: (sessionId, key) => {
        return new Promise((resolve, reject) => {
            let value = sessions[sessionId][key];
            resolve(value);
        });
    }
});

//index & password input menu
menu.startState({
    run:  () => {  
        getUserDetails(menu.args.phoneNumber)
        .then(results => {
            const user = results.name.toUpperCase();            
            menu.con(`Dear ${user}, Welcome to Tritel SACCO. Enter PIN To Proceed`);  
        }).catch(error => {  
            console.log(error.message)
            menu.end('Request failed!');
        }); 
    },
    next: {
        '*\\d+': 'home'    
    }
});

//handle user authentication & Display main menu if authentication is successful
menu.state('home', {
    run:  () => {
        const pin = menu.val;       
        //const phone_number =menu.args.phoneNumber;
        const phone_number = "+254786991654";         
        const main_menu_options = 
            'Main Menu. Choose option:' +
            '\n1. Check balances'+
            '\n2. Check loan eligibility'+
            '\n3. M-pesa'+
            '\n4. Loans'+
            '\n\n000. logout'             
        /* 
            Need to check if the user is authenticated 
            The user my be returning home from menus down the hierarchy
         */        
        menu.session.get('bearer_token')
        .then( token => { 
            //if the token is set, authenticate 
            if (typeof token === 'undefined'){
                authenticate_user(phone_number,pin)
                .then((results) => { 
                    const bearer_token  = results.token;  
                    // store the bearer token in session & display main menu 
                    menu.session.set('bearer_token', bearer_token)            
                    .then( () => {
                        menu.con(main_menu_options );                 
                    });   
                }).catch(error => {             
                    menu.end('Wrong PIN. Try Again!');
                    console.log(error.message);
                });  
            } else {
                menu.con(main_menu_options );
            }        
        });        
    },
    next: {  
        '1': 'check_balances',
        '2': 'check_loan_eligibility',
        '3': 'M-pesa', 
        '4': 'loans',
        '000': '__start__'
    }
});

//handle user balances
menu.state('check_balances', {
    run:  () => { 
        // get bearer token from sessions              
        menu.session.get('bearer_token')
        .then( token => {
            get_balances(token)
            .then((results) => {  
                const deposits = results.current_deposits.toLocaleString('en');
                const loans = results.current_loan.toLocaleString('en');
                const savings = results.current_savings.toLocaleString('en');
                const shares = results.current_shares.toLocaleString('en');
                const unallocated = results.current_unallocated.toLocaleString('en'); 

                const resp = `\n Deposits : ${deposits}\n Loans : ${loans} \n Savings : ${savings} \n Shares : ${shares}\n Unallocated : ${unallocated}`;
                               
                menu.con(
                    `My Balances: ${resp} 
                    \n0. Back `
                ); 
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
        
        },
        next: {           
            '0': 'home'                      
        }
});

//handle member eligibility status
menu.state('check_loan_eligibility', {
    run:  () => {         
        // get bearer token from sessions              
        menu.session.get('bearer_token')
        .then( token => {
            get_eligibility_status(token)
            .then((results) => {            
                const data =JSON.parse(results.loan_calculator); 
                statuses = '';  
                data.map((res)=>{ 
                    statuses = `${statuses}\n${res.loan_product_name} : ${res.amount.toLocaleString('en')}`;
                });                
                menu.con(
                    `Max Eligible Amount: ${statuses} 
                    \n0. Back `
                ); 
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
    },
    next: {           
        '0': 'home'   
    }
});

menu.on('error', err => {   
    console.log(err); // handle errors
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
