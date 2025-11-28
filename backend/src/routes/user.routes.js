const express = require('express');
const { registerUser, loginUser, getAllUsers } = require('../controller/user.controller');
const { registerValidationRules, loginValidationRules, validate } = require('../middlewares/validation.middleware');

const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerValidationRules(), validate, registerUser);
router.post('/login', loginValidationRules(), validate, loginUser);
router.get('/users', protect, getAllUsers);

module.exports = router;