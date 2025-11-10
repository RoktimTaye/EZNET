const express = require('express');

const { getChatHistory } = require('../controller/chat.controller');

const router = express.Router();

router.get('/history/:user1/:user2', getChatHistory);

module.exports = router;