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
const get_loan_pre_computation = require('../helpers/get_loan_pre_computation');
const post_loan_request = require('../helpers/post_loan_request');

//session configurations
let sessions = {};
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
        '*\\d+': 'loan_request_show_loans',           
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





//handle loan listing based on categ for loan request
menu.state('loan_request_show_loans', {
    run:  () => { 
     function show_loans(category){
        menu.session.get('bearer_token')
        .then( token => {
            get_eligibility_status(token)
            .then((results) => {                      
                loans = ''; 
                let eligibility_properties =[];                
                let counter = 1; 
                let data ={}
                const categorised_loans = JSON.parse(results.loan_calculator).filter(res => res.loan_category === category); 
                categorised_loans.map((res)=>{ 
                    loans = `${loans}\n ${counter}. ${res.loan_product_name}`;                     
                    data = {"id":counter,"loan_product_id":res.loan_product_id,"loan_product_name":res.loan_product_name,"max_amount":res.amount};
                    eligibility_properties.push(data);                   
                    counter = counter + 1;                 
                  });                 
                menu.session.set('eligibility_properties', eligibility_properties)            
                .then( () => {
                menu.con(
                    `Select Loan:${loans}`+ 
                    '\n\n0. Back'+
                    '\n00. Home'
                    );                 
                });                  
                         
                
            }).catch(error => {             e
                menu.end('Request failed!');
                console.log(error.message);
            });        
        });
     }
     
    const category = (menu.val === '1')? 'mobile' : (menu.val === '2')? 'term' : 'undefined';
    if (category === 'mobile' || category === 'term'){
        menu.session.set('loan_request_category', category)            
            .then( () => {
                show_loans(category);          
            });  
    } else {
        menu.session.get('loan_request_category')
        .then( categ => {       
            show_loans(categ); 
        }); 
    }     
    },
    next: {
        '*\\d+': 'loan_request_amount',           
        '0': 'loan_terms_categories',
        '00': 'home',   
    }
});


//handle loan_request_amount
menu.state('loan_request_amount', {
    run:  () => { 
        menu.session.get('eligibility_properties')
        .then( loans => {
            menu.session.get('loan_details')            
            .then( details => {                
                const loan_selected = (typeof details==='undefined') ? menu.val:  (typeof details==='object' && menu.val !== '0') ? menu.val: details.loan_selected;           
                const loan_terms_filtered = loans.filter(res => res.id === parseInt(loan_selected)); 
                const loan_details = {"loan_selected":loan_selected,"loan_product_id":loan_terms_filtered[0].loan_product_id,"loan_product_name":loan_terms_filtered[0].loan_product_name,"max_amount":loan_terms_filtered[0].max_amount} ;             
                menu.session.set('loan_details', loan_details)            
                .then( () => {                
                    menu.con(
                        `Enter Amount (Max: ${Math.floor(loan_terms_filtered[0].max_amount).toLocaleString('en')}):`+                    
                        '\n\n0. Back'+
                        '\n00. Home'
                    );     
                });               

            }
            );                              
        });
    },
    next: {
        '*\\d+': 'loan_request_term',            
        '0': 'loan_request_show_loans',
        '00': 'home',   
    }
});

//handle loan_request_term
menu.state('loan_request_term', {
    run:  () => {
        const loan_amount = menu.val ;
        menu.session.set('loan_amount', loan_amount)            
            .then( () => { 
                menu.session.get('loan_details')
                .then( loan_props => {                    
                    const msg = (loan_amount>loan_props.max_amount) ? `Invalid Amount! \nMax Amount: ${loan_props.max_amount} \nRequested Amount: ${loan_amount} \n\n0. Back \n00. Home ` :'Enter Loan Term(months):\n\n0. Back \n00. Home' ;
                    menu.con(                                       
                       `${msg}`                        
                    );

                }
                );               
                     
            }); 
    },
    next: {
        '*\\d+': 'loan_details_confirmation',            
        '0': 'loan_request_amount',
        '00': 'home',   
    }
});

//handle loan_details_confirmation
menu.state('loan_details_confirmation', {
    run:  () => { 
        const loan_term = menu.val ;
        menu.session.set('loan_term', loan_term)            
            .then( () => {
                menu.session.get('bearer_token')
                    .then( token => {
                        menu.session.get('loan_details')
                        .then( loan_details => {
                            menu.session.get('loan_amount')
                            .then( loan_amount => {
                                menu.session.get('loan_term')
                                .then( loan_term => { 
                                const params = {
                                        loan_product_type: loan_details.loan_product_id,
                                        loan_category: 'term',
                                        requested_amount: loan_amount       
                                      };                                                                    
                                    get_loan_pre_computation(token,params)
                                    .then((results) => {                                        
                                        menu.con(
                                            `Product: ${loan_details.loan_product_name} `+
                                            `\nTerm: ${loan_term} Months`+
                                            `\nAmount: ${loan_amount.toLocaleString('en')} `+  
                                            `\nCharges: ${results[0].charges.toLocaleString('en')} `+ 
                                            `\nInterest: ${results[0].interest.toLocaleString('en')} `+                                       
                                            '\n\n1. Accept'+
                                            '\n2. Decline'                                            
                                        ); 
                                    }).catch(error => {             
                                        menu.end('Request failed!');
                                        console.log(error.message);
                                    });
                                              
                                });
                                             
                            });
                                             
                        });
                                             
                    });          
            });            
        
    },
    next: {
        '1': 'loan_request_finalize',            
        '2': 'loans',
         
    }
});


//handle loan_request_finalize
menu.state('loan_request_finalize', {
    run:  () => { 
        menu.session.get('bearer_token')
            .then( token => {
                menu.session.get('loan_details')
                .then( loan_details => {
                    menu.session.get('loan_amount')
                    .then( loan_amount => {
                        menu.session.get('loan_term')
                        .then( loan_term => {                             
                         const params = {
                                loan_product: loan_details.loan_product_id,
                                loan_category: 'term',
                                requested_amount: parseInt(loan_amount)       
                                };  

                            post_loan_request(token,params)
                            .then((results) => {    
                                
                                const msg = (results.length>0) ? `Failed. ${results[0].description} \n\n00. Home` :'Loan Application Successfully! Funds sent to your Mpesa account. Thank you! \n\n1. Check Loan status\n00. Home';
                                menu.con(
                                    `${msg}`                                                                     
                                ); 
                            }).catch(error => {             
                                menu.end('Request failed!');
                                console.log(error.message);
                            });
                                        
                        });
                                        
                    });
                                        
                });
                                        
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
