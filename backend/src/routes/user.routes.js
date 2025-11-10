const express = require('express');
const { registerUser, loginUser, getAllUsers } = require('../controller/user.controller');
const { registerValidationRules, loginValidationRules, validate } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/register', registerValidationRules(), validate, registerUser);
router.post('/login', loginValidationRules(), validate, loginUser);
router.get('/users', getAllUsers);

module.exports = router;