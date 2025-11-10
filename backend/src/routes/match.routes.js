const express = require('express');
const router = express.Router();
const{getUserMatches} = require('../controller/match.controller')

router.get('/:userId', getUserMatches);

module.exports = router;