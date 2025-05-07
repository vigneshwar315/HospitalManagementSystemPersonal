const express = require("express");
const router = express.Router();
const labController = require("../controllers/labController");
const { verifyLabTechnician } = require("../middlewares/authMiddleware");

// Get pending lab tests with patient details
router.get("/pending-tests", verifyLabTechnician, labController.getLabRequests);

// Submit lab test results
router.put("/submit-result", verifyLabTechnician, labController.updateLabResult);

module.exports = router;