const doctorService = require('../services/doctorService');

class DoctorController {
  async register(req, res) {
    try {
      const result = await doctorService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const doctorId = req.user.doctor?.id;
      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }
      
      const result = await doctorService.getProfile(doctorId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const doctorId = req.user.doctor?.id;
      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const updateData = {
        ...req.body,
        userId: req.user.id
      };
      
      const result = await doctorService.updateProfile(doctorId, updateData);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllDoctors(req, res) {
    try {
      const { page = 1, limit = 10, specialty, search } = req.query;
      const result = await doctorService.getAllDoctors(
        parseInt(page),
        parseInt(limit),
        specialty,
        search
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDoctorById(req, res) {
    try {
      const { doctorId } = req.params;
      const result = await doctorService.getDoctorById(doctorId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async verifyDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const { isVerified } = req.body;
      const result = await doctorService.verifyDoctor(doctorId, isVerified);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDoctorStats(req, res) {
    try {
      const doctorId = req.user.doctor?.id;
      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      const result = await doctorService.getDoctorStats(doctorId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DoctorController();
