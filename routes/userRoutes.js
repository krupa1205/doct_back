const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  validate, 
  userRegistrationSchema, 
  userLoginSchema, 
  userUpdateSchema 
} = require('../middleware/validation');

// Public routes
router.post('/register', validate(userRegistrationSchema), userController.register);
router.post('/login', validate(userLoginSchema), userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, validate(userUpdateSchema), userController.updateProfile);
router.post('/change-password', authenticateToken, userController.changePassword);
router.post('/deactivate', authenticateToken, userController.deactivateAccount);

// Admin routes
router.get('/', authenticateToken, authorizeRoles('ADMIN'), userController.getAllUsers);

module.exports = router;
