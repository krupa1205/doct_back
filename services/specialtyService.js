const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SpecialtyService {
  async getAllSpecialties() {
    try {
      const specialties = await prisma.specialty.findMany({
        orderBy: { name: 'asc' }
      });

      return {
        success: true,
        message: 'Specialties retrieved successfully',
        data: { specialties }
      };
    } catch (error) {
      console.error('Get specialties error:', error);
      throw error;
    }
  }

  async createSpecialty(specialtyData) {
    try {
      // Check if specialty already exists
      const existingSpecialty = await prisma.specialty.findUnique({
        where: { name: specialtyData.name }
      });

      if (existingSpecialty) {
        throw new Error('Specialty with this name already exists');
      }

      const specialty = await prisma.specialty.create({
        data: {
          name: specialtyData.name,
          description: specialtyData.description
        }
      });

      return {
        success: true,
        message: 'Specialty created successfully',
        data: { specialty }
      };
    } catch (error) {
      console.error('Create specialty error:', error);
      throw error;
    }
  }

  async updateSpecialty(specialtyId, updateData) {
    try {
      const specialty = await prisma.specialty.update({
        where: { id: specialtyId },
        data: {
          name: updateData.name,
          description: updateData.description
        }
      });

      return {
        success: true,
        message: 'Specialty updated successfully',
        data: { specialty }
      };
    } catch (error) {
      console.error('Update specialty error:', error);
      throw error;
    }
  }

  async deleteSpecialty(specialtyId) {
    try {
      // Check if any doctors are using this specialty
      const doctorsCount = await prisma.doctor.count({
        where: { specialty: { contains: specialtyId } }
      });

      if (doctorsCount > 0) {
        throw new Error('Cannot delete specialty that is being used by doctors');
      }

      await prisma.specialty.delete({
        where: { id: specialtyId }
      });

      return {
        success: true,
        message: 'Specialty deleted successfully'
      };
    } catch (error) {
      console.error('Delete specialty error:', error);
      throw error;
    }
  }

  async getSpecialtyStats() {
    try {
      const specialties = await prisma.specialty.findMany({
        include: {
          _count: {
            select: {
              doctors: true
            }
          }
        }
      });

      // Get doctor count for each specialty
      const specialtyStats = await Promise.all(
        specialties.map(async (specialty) => {
          const doctorCount = await prisma.doctor.count({
            where: { specialty: specialty.name }
          });

          return {
            id: specialty.id,
            name: specialty.name,
            description: specialty.description,
            doctorCount,
            createdAt: specialty.createdAt,
            updatedAt: specialty.updatedAt
          };
        })
      );

      return {
        success: true,
        message: 'Specialty stats retrieved successfully',
        data: { specialties: specialtyStats }
      };
    } catch (error) {
      console.error('Get specialty stats error:', error);
      throw error;
    }
  }
}

module.exports = new SpecialtyService();
