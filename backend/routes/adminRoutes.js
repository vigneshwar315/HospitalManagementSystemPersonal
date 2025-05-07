const express = require("express");
const { verifyAdmin } = require("../middlewares/authMiddleware");
const { adminLogin, getPendingStaff, approveStaff, rejectStaff, getAllUsers, registerStaff, approveDoctor, rejectDoctor, approveReceptionist, rejectReceptionist } = require("../controllers/adminController");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/pending-staff", getPendingStaff);
router.post("/approve-staff", approveStaff);
router.post("/reject-staff", rejectStaff);
router.get("/users", verifyAdmin, getAllUsers);
router.post("/register-staff", verifyAdmin, registerStaff);
router.put("/staff/:id/approve", verifyAdmin, approveStaff);
router.put("/staff/:id/reject", verifyAdmin, rejectStaff);
router.put("/doctors/:id/approve", verifyAdmin, approveDoctor);
router.put("/doctors/:id/reject", verifyAdmin, rejectDoctor);
router.put("/receptionists/:id/approve", verifyAdmin, approveReceptionist);
router.put("/receptionists/:id/reject", verifyAdmin, rejectReceptionist);
// User activity data endpoint
router.get('/user-activity', verifyAdmin, async (req, res) => {
    try {
      // For now, return dummy data until real implementation is ready
      const activityData = [
        { month: 'Jan', active: 10, new: 5 },
        { month: 'Feb', active: 15, new: 8 },
        { month: 'Mar', active: 20, new: 10 },
        { month: 'Apr', active: 25, new: 12 },
        { month: 'May', active: 30, new: 15 },
        { month: 'Jun', active: 35, new: 18 }
      ];
      
      res.json(activityData);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  // Report generation endpoint
  router.get('/reports', verifyAdmin, async (req, res) => {
    try {
      const { type, range } = req.query;
      
      // For now, just return a simple message instead of a PDF
      // Remove the PDF headers
      res.json({ 
        message: "Report generation is not fully implemented yet",
        requestedType: type,
        requestedRange: range
      });
      
      // Later, implement proper PDF generation:
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      // res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: "Report generation failed" });
    }
  });
module.exports = router;
