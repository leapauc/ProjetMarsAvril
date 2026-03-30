const express = require("express");
const {
  getRegistrationById,
  registerToEvent,
  unregisterFromEvent,
} = require("../controllers/registration.controller");

const router = express.Router();

router.get("/:id/registrations", getRegistrationById);
router.post("/:id/register", registerToEvent);
router.delete("/:id", unregisterFromEvent);

module.exports = router;
