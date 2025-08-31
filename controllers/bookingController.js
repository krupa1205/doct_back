const bookingService = require('../services/bookingService');

class BookingController {
  async createBooking(req, res) {
    try {
      const result = await bookingService.createBooking(req.body, req.user.id);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getBookings(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await bookingService.getBookings(
        req.user.id,
        req.user.role,
        parseInt(page),
        parseInt(limit),
        status
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      const result = await bookingService.getBookingById(
        bookingId,
        req.user.id,
        req.user.role
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const result = await bookingService.updateBooking(
        bookingId,
        req.body,
        req.user.id,
        req.user.role
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const result = await bookingService.cancelBooking(
        bookingId,
        req.user.id,
        req.user.role
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getBookingStats(req, res) {
    try {
      const result = await bookingService.getBookingStats(
        req.user.id,
        req.user.role
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BookingController();
