const express = require('express');
const UssdMenu = require('ussd-menu-builder');
const menu = new UssdMenu();
const router = express.Router();
const getUserDetails = require('../helpers/requests');
const authenticate_user = require('../helpers/authenticate');
const get_eligibility_status = require('../helpers/get_eligibility_status');
const get_balances = require('../helpers/get_balances');
const get_loans = require('../helpers/get_loans');
const get_loan_products = require('../helpers/get_loan_products');


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
        const phone_number =menu.args.phoneNumber;
        //const phone_number = "+254786991654"; 
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


//handle loans Menu
menu.state('loans', {
    run:  () => {         
        // get bearer token from sessions              
        menu.session.get('bearer_token')
        .then( token => {
            const loans_menu_options = 
            'Loans Menu. Choose option:' +
            '\n1. Request Loan'+
            '\n2. Repay Loan'+
            '\n3. Check Loan Status'+ 
            '\n4. Loan Balances'+
            '\n5. Check Loan Terms'+   
            '\n6. Guarantorship'+            
            '\n\n0. back';

            menu.con(loans_menu_options ); 
        });        
    },
    next: { 
        '1': 'loan_categories',
        '2': 'repay_loan',
        '3': 'check_loan_status',
        '4': 'loan_balances',
        '5': 'loan_terms_categories',   
        '0': 'home'   
    }
});
//request_loan
//handle loan categories
menu.state('loan_categories', {
    run:  () => {   
        
        
        menu.con(
            'Select Loan Category:'+
            '\n1. Mobile Loans'+
            '\n2. Term Loans'+
            '\n\n0. Back'+
            '\n00. Home'
        ); 
    },
    next: {
        '*\\d+': 'request_loan',           
        '0': 'loans',
        '00': 'home',   
    }
});

menu.state('loan_terms_categories', {
    run:  () => {    
        menu.con(
            'Select Loan Category:'+
            '\n1. Mobile Loans'+
            '\n2. Term Loans'+
            '\n\n0. Back'+
            '\n00. Home'
        ); 
    },
    next: {
        '*\\d+': 'loan_terms_show_loans',           
        '0': 'loans',
        '00': 'home',   
    }
});
//handle loan request
menu.state('request_loan', {
    run:  () => {    
        menu.session.get('bearer_token')
        .then( token => {
            get_eligibility_status(token)
            .then((results) => {            
                const data =JSON.parse(results.loan_calculator);               
                loans = '';                 
                let counter = 1;
                data.map((res)=>{ 
                    loans = `${loans}\n ${counter}. ${res.loan_product_name}`;
                    counter = counter + 1;
                });                
                menu.con(
                    `Select Loan: ${loans}`+ 
                    '\n\n0. Back'+
                    '\n00. Home'
                ); 
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
    },
    next: {
        '*\\d+': 'loan_request_amount',           
        '0': 'Back',
        '00': 'home',   
    }
});

//handle loan_request_amount
menu.state('loan_request_amount', {
    run:  () => {    
        menu.session.get('bearer_token')
        .then( token => {

                menu.con(
                    'Enter Amount (Max: xxxxxxx):'+                    
                    '\n\n0. Back'+
                    '\n00. Home'
                );                   
        });
    },
    next: {
        '*\\d+': 'loan_request_term',            
        '0': 'Back',
        '00': 'home',   
    }
});

//handle loan_request_term
menu.state('loan_request_term', {
    run:  () => {    
        menu.session.get('bearer_token')
        .then( token => {
                menu.con(
                    'Enter Loan Term(months):'+                   
                    '\n\n0. Back'+
                    '\n00. Home'
                );                   
        });
    },
    next: {
        '*\\d+': 'loan_request_finalize',            
        '0': 'Back',
        '00': 'home',   
    }
});

//handle loan_request_finalize
menu.state('loan_request_finalize', {
    run:  () => {    
        menu.session.get('bearer_token')
        .then( token => {
                menu.con(
                    'Loan Details Confirmation:'+  
                    '\nLoan Name : Development'+
                    '\nLoan Amount: 40,000'+                 
                    '\nLoan Term: 12 Months'+
                    '\n\n1. finish'+
                    '\n0. Back'+
                    '\n00. Home'
                );                   
        });
    },
    next: {
        '*\\d+': 'loan_request_done',            
        '0': 'Back',
        '00': 'home',   
    }
});


//handle loan_request_done
menu.state('loan_request_done', {
    run:  () => {    
        menu.session.get('bearer_token')
        .then( token => {
                menu.con(
                    'Loan Application Completed Successfully!'+
                    '\n\n1. Check Loan status'+ 
                    '\n00. Home'                     
                );                   
        });
    },
    next: { 
        '1': 'check_loan_status', 
        '00': 'home',     
    }
});


//handle member loan Balances
menu.state('loan_balances', {
    run:  () => {   
        menu.session.get('bearer_token')
        .then( token => {
            get_loans(token)
            .then((results) => {  
                 balances = '';  
                 results.map((res)=>{ 
                     if (res.loan_balance > 0) {
                        balances = `${balances}\n${res.loan_product_type[1]} : ${res.loan_balance.toLocaleString('en')}`;                
                     }
                   });
                menu.con(
                    `Loan Balances: ${balances}
                    \n0. Back
                     00. Home `
                ); 
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
    },
    next: {           
        '0': 'loans',
        '00': 'home'   
    }
});


//handle member loan statuses
menu.state('check_loan_status', {
    run:  () => {   
        menu.session.get('bearer_token')
        .then( token => {
            get_loans(token)
            .then((results) => {  
                 balances = '';  
                 results.map((res)=>{ 
                     if (res.loan_balance > 0) {
                        balances = `${balances}\n${res.loan_product_type[1]} : ${res.state}`;                
                     }
                   });
                menu.con(
                    `Loan Statuses: ${balances}
                    \n0. Back
                     00. Home `
                ); 
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
    },
    next: {           
        '0': 'loans',
        '00': 'home'   
    }
});

//handle loan listing based on categ for loan terms
menu.state('loan_terms_show_loans', {
    run:  () => { 

     function show_loans(category){
        menu.session.get('bearer_token')
        .then( token => {
            get_loan_products(token)
            .then((results) => {      
                loans = ''; 
                let categorised_loans_terms =[];                
                let counter = 1; 
                let data ={}
                const categorised_loans = results.data.filter(res => res.loan_category === category); 
                categorised_loans.map((res)=>{ 
                    loans = `${loans}\n ${counter}. ${res.display_name}`;                     
                    data = {"id":counter,"name":res.display_name,"interest_rate":res.interest_rate,"grace_period":res.grace_period,"Loan_max":res.max_loan_amount,"max_guarantors":res.max_no_of_guarantors};
                    categorised_loans_terms.push(data);                   
                    counter = counter + 1;                 
                  });
                menu.session.set('categorised_loans_terms', categorised_loans_terms)            
                .then( () => {
                menu.con(
                    `Select Loan:${loans}`+ 
                    '\n\n0. Back'+
                    '\n00. Home'
                    );                 
                });                  
                         
                
            }).catch(error => {             
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
     }
     
    const category = (menu.val === '1')? 'mobile' : (menu.val === '2')? 'term' : 'undefined';
    if (category === 'mobile' || category === 'term'){
        menu.session.set('loan_category', category)            
            .then( () => {
                show_loans(category);          
            });  
    } else {
        menu.session.get('loan_category')
        .then( categ => {       
            show_loans(categ); 
        }); 
    }     
    },
    next: {
        '*\\d+': 'loan_terms_view',           
        '0': 'loan_terms_categories',
        '00': 'home',   
    }
});

// view loan terms
menu.state('loan_terms_view', {
    run:  () => {   
        const loan_selected = menu.val ;               
        menu.session.get('categorised_loans_terms')
        .then( loans => {
            let loan_terms_filtered = loans.filter(res => res.id === parseInt(loan_selected));
            menu.con(
                `${loan_terms_filtered[0].name} Terms`+ 
                `\nInterest Rate : ${loan_terms_filtered[0].interest_rate}%`+ 
                `\nLoan Limit : ${loan_terms_filtered[0].Loan_max}`+
                `\nGrace Period(Months) : ${loan_terms_filtered[0].grace_period}`+
                `\nMax Guarantor(s): ${loan_terms_filtered[0].max_guarantors}`+               
                '\n\n0. Back'+
                '\n00. Home'
                ); 
                  
        });
    },
    next: {
        '*\\d+': 'loan_terms_view',           
        '0': 'loan_terms_show_loans',
        '00': 'home',   
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
