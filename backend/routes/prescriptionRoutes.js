const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  downloadPrescription,
  deletePrescription
} = require('../controllers/prescriptionController');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'prescriptions/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes
router.post('/', protect, restrictTo('doctor'), upload.single('file'), createPrescription);
router.get('/patient/:patientId', protect, getPatientPrescriptions);
router.get('/doctor', protect, restrictTo('doctor'), getDoctorPrescriptions);
router.get('/:id/download', protect, downloadPrescription);
router.delete('/:id', protect, restrictTo('admin', 'doctor'), deletePrescription);

module.exports = router; 