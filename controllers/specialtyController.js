const specialtyService = require('../services/specialtyService');

class SpecialtyController {
  async getAllSpecialties(req, res) {
    try {
      const result = await specialtyService.getAllSpecialties();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createSpecialty(req, res) {
    try {
      const result = await specialtyService.createSpecialty(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateSpecialty(req, res) {
    try {
      const { specialtyId } = req.params;
      const result = await specialtyService.updateSpecialty(specialtyId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteSpecialty(req, res) {
    try {
      const { specialtyId } = req.params;
      const result = await specialtyService.deleteSpecialty(specialtyId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSpecialtyStats(req, res) {
    try {
      const result = await specialtyService.getSpecialtyStats();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new SpecialtyController();
