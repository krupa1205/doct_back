const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.get('/', specialtyController.getAllSpecialties);

// Admin routes
router.post('/', authenticateToken, authorizeRoles('ADMIN'), specialtyController.createSpecialty);
router.put('/:specialtyId', authenticateToken, authorizeRoles('ADMIN'), specialtyController.updateSpecialty);
router.delete('/:specialtyId', authenticateToken, authorizeRoles('ADMIN'), specialtyController.deleteSpecialty);
router.get('/stats', authenticateToken, authorizeRoles('ADMIN'), specialtyController.getSpecialtyStats);

module.exports = router;
