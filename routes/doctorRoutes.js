const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRoles, requireDoctor, requireAdmin } = require('../middleware/auth');
const { 
  validate, 
  doctorRegistrationSchema, 
  doctorUpdateSchema 
} = require('../middleware/validation');

// Public routes
router.post('/register', validate(doctorRegistrationSchema), doctorController.register);
router.get('/', doctorController.getAllDoctors);
router.get('/:doctorId', doctorController.getDoctorById);

// Doctor routes
router.get('/profile/me', authenticateToken, requireDoctor, doctorController.getProfile);
router.put('/profile/me', authenticateToken, requireDoctor, validate(doctorUpdateSchema), doctorController.updateProfile);
router.get('/stats/me', authenticateToken, requireDoctor, doctorController.getDoctorStats);

// Admin routes
router.put('/:doctorId/verify', authenticateToken, requireAdmin, doctorController.verifyDoctor);

module.exports = router;
