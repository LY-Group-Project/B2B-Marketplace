const express = require("express");
const router = express.Router();
const { autocomplete } = require("../controllers/addressController");

// GET /api/address/autocomplete?q=...
router.get("/autocomplete", autocomplete);

module.exports = router;
