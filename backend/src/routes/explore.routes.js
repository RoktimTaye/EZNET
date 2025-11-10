const express = require("express");
const { getExploreFeed } = require("../controller/explore.controller");
const router = express.Router();

router.get("/:userId", getExploreFeed);

module.exports = router;