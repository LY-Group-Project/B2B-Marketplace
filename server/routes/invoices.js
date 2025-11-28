const express = require("express");
const router = express.Router();
const { generateInvoice, getInvoiceHTML } = require("../controllers/invoiceController");
const { auth } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");

// Download invoice as PDF
router.get("/:id/pdf", auth, validateObjectId("id"), generateInvoice);

// Get invoice as HTML (for browser printing)
router.get("/:id/html", auth, validateObjectId("id"), getInvoiceHTML);

module.exports = router;
