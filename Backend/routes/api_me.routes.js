const express = require("express");
const {
  getMyData,
  updateMyData,
  deleteMyData,
} = require("../controllers/api_me.controller");

const router = express.Router();

router.get("/:id", getMyData);
router.put("/:id", updateMyData);
router.delete("/:id", deleteMyData);

module.exports = router;
