const express = require('express');
const requireAuth = require('../../controllers/middleware.js');

const router = express.Router();

// this is the file where the function we can use to get the settlement of a user
// when the browser sends a get request for the settlement . the engine instantly uses this file
// this will contains the business logic of the whole settlement Schema 

router.get('/', requireAuth, (req, res) => {
    // try {
        // const settlement = Mongoose.Schema.find()
        // let i = 0;
        // while (i < re)   
    // }
    // catch (error) {
        
    // }
});

module.exports = router;