const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  validate, 
  bookingSchema, 
  bookingUpdateSchema 
} = require('../middleware/validation');

// All booking routes require authentication
router.use(authenticateToken);

// User and Doctor routes
router.post('/', validate(bookingSchema), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:bookingId', bookingController.getBookingById);
router.put('/:bookingId', validate(bookingUpdateSchema), bookingController.updateBooking);
router.post('/:bookingId/cancel', bookingController.cancelBooking);

module.exports = router;
