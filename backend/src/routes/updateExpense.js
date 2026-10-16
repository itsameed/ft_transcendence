const express = require('express');
const router = express.Router();
const updatedExpense = require('../utils/updateExpense');
const requireAuth = require('../middleware/requireAuth');
const cookieAuth = require('../middleware/cookieAuth');


router.patch('/', requireAuth, cookieAuth, updatedExpense);