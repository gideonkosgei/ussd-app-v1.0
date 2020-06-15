const express = require('express');
const UssdMenu = require('ussd-menu-builder');
const listMembers = require('../helpers/requests');


const menu = new UssdMenu();
const router = express.Router();

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

    
});

//landing page
menu.startState({
    run: function () {     
       // let user = req.body.phoneNumber;
        let response = listMembers()
            .then(result => {
                let i = 0;
                let positions = [];
                for (i = 0; i < result.data.length; i++) {
                    positions.push(result.data[i].phone);
                }   
               
                let currentMenu = [];
                let posts = "";
                let indexOfLastElement = 0;
                //persisting positions throughout the session
                menu.session.set('positions', positions)
                    .then(() => {
                        return positions
                    }).catch(error => {
                        if (error) console.log("Error", error)
                    })
                //selecting positions to display to phoneNumber    
                for (let index = 0; index < 7; index++) {
                    posts += `\n${index + 1}. ${positions[index]}`
                    indexOfLastElement++;
                    //persisting content of page to be diplayed to phoneNumber 
                    menu.session.set('currentMenu', currentMenu)
                        .then(() => {
                            currentMenu.push(positions[index]);
                        }).catch(error => {
                            if (error) console.log("Error", error)
                        })
                }
                if (positions.length > currentMenu.length) {
                    posts += `\n99. next`;
                }
                //index of the last element selected
                menu.session.set('indexOfLastElement', indexOfLastElement)
                    .then(() => {
                        return indexOfLastElement
                    }).catch(error => {
                        if (error) console.log("Error", error)
                    })
                return posts
            })
            .catch(error => {
                if (error) console.log("Error", error)
            })
        //displaying result to phoneNumber
        response.then(result => {
           // menu.con(`Welcome ${menu.args.userName}  \nSelect phone number  ${result}`);   
            menu.con(`Dear Gideon, Welcome to SACCO Platform ,Please enter PIN to proceed`);             
            
               
        }).catch(error => {
            if (error) console.log("Error", error)
        })
    },
    next: {
        '*^[1-7]$': 'getContestants',
        '99': 'getNextPosition',
    }
});



menu.on('error', err => {
    // handle errors
    console.log(err);
});

router.post('*', async (req, res) => {  
    const {phoneNumber,sessionId,serviceCode,text,userName}=   req.body;   
    console.log(phoneNumber); 
    let args = {
        phoneNumber: phoneNumber,
        sessionId: sessionId,
        serviceCode: serviceCode,
        text: text,
        userName: userName
    };
    let resMsg = await menu.run(args);
    res.send(resMsg);
});

module.exports = router;
