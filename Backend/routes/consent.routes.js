const express = require("express");
const { postConsent } = require("../controllers/consent.controller");

const router = express.Router();

router.post("/", postConsent);

module.exports = router;
