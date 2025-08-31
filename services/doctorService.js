const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class DoctorService {
  async register(doctorData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: doctorData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if license number already exists
      const existingDoctor = await prisma.doctor.findUnique({
        where: { licenseNumber: doctorData.licenseNumber }
      });

      if (existingDoctor) {
        throw new Error('Doctor with this license number already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(doctorData.password, 12);

      // Create user and doctor in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: doctorData.email,
            passwordHash,
            name: doctorData.name,
            phone: doctorData.phone,
            role: 'DOCTOR'
          }
        });

        // Create doctor profile
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            licenseNumber: doctorData.licenseNumber,
            specialty: doctorData.specialty || doctorData.specialtyIds?.[0] || 'General Medicine',
            experience: doctorData.experience || 0,
            education: doctorData.education,
            bio: doctorData.bio || doctorData.shortBio,
            image: doctorData.image,
            consultationFee: doctorData.consultationFee || (doctorData.priceCents / 100)
          }
        });

        return { user, doctor };
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.user.id, email: result.user.email, role: result.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Get complete user data
      const userWithDoctor = await prisma.user.findUnique({
        where: { id: result.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              licenseNumber: true,
              specialty: true,
              experience: true,
              education: true,
              bio: true,
              consultationFee: true,
              rating: true,
              totalReviews: true,
              isAvailable: true,
              isVerified: true
            }
          }
        }
      });

      return {
        success: true,
        message: 'Doctor registered successfully',
        data: {
          user: userWithDoctor,
          token
        }
      };
    } catch (error) {
      console.error('Doctor registration error:', error);
      throw error;
    }
  }

  async getProfile(doctorId) {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              role: true,
              isActive: true,
              emailVerified: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return {
        success: true,
        message: 'Doctor profile retrieved successfully',
        data: { doctor }
      };
    } catch (error) {
      console.error('Get doctor profile error:', error);
      throw error;
    }
  }

  async updateProfile(doctorId, updateData) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update user data
        if (updateData.name || updateData.phone) {
          await tx.user.update({
            where: { id: updateData.userId },
            data: {
              name: updateData.name,
              phone: updateData.phone
            }
          });
        }

        // Update doctor data
        const doctor = await tx.doctor.update({
          where: { id: doctorId },
          data: {
            specialty: updateData.specialty,
            experience: updateData.experience,
            education: updateData.education,
            bio: updateData.bio,
            consultationFee: updateData.consultationFee,
            isAvailable: updateData.isAvailable
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                role: true,
                isActive: true,
                emailVerified: true,
                updatedAt: true
              }
            }
          }
        });

        return doctor;
      });

      return {
        success: true,
        message: 'Doctor profile updated successfully',
        data: { doctor: result }
      };
    } catch (error) {
      console.error('Update doctor profile error:', error);
      throw error;
    }
  }

  async getAllDoctors(page = 1, limit = 10, specialty = null, search = null) {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        isAvailable: true,
        isVerified: true,
        user: {
          isActive: true
        }
      };

      if (specialty) {
        where.specialty = specialty;
      }

      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { specialty: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: [
            { rating: 'desc' },
            { totalReviews: 'desc' }
          ]
        }),
        prisma.doctor.count({ where })
      ]);

      return {
        success: true,
        message: 'Doctors retrieved successfully',
        data: {
          doctors,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get all doctors error:', error);
      throw error;
    }
  }

  async getDoctorById(doctorId) {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          slots: {
            where: {
              isAvailable: true,
              startTime: {
                gte: new Date()
              }
            },
            orderBy: { startTime: 'asc' }
          }
        }
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return {
        success: true,
        message: 'Doctor retrieved successfully',
        data: { doctor }
      };
    } catch (error) {
      console.error('Get doctor by ID error:', error);
      throw error;
    }
  }

  async verifyDoctor(doctorId, isVerified = true) {
    try {
      const doctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: { isVerified },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return {
        success: true,
        message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: { doctor }
      };
    } catch (error) {
      console.error('Verify doctor error:', error);
      throw error;
    }
  }

  async getDoctorStats(doctorId) {
    try {
      const [
        totalBookings,
        completedBookings,
        pendingBookings,
        totalRevenue,
        averageRating
      ] = await Promise.all([
        prisma.booking.count({
          where: { doctorId }
        }),
        prisma.booking.count({
          where: { doctorId, status: 'COMPLETED' }
        }),
        prisma.booking.count({
          where: { doctorId, status: 'PENDING' }
        }),
        prisma.booking.aggregate({
          where: { 
            doctorId, 
            status: 'COMPLETED',
            paymentStatus: 'COMPLETED'
          },
          _sum: { totalAmount: true }
        }),
        prisma.booking.aggregate({
          where: { 
            doctorId, 
            status: 'COMPLETED'
          },
          _avg: { rating: true }
        })
      ]);

      return {
        success: true,
        message: 'Doctor stats retrieved successfully',
        data: {
          totalBookings,
          completedBookings,
          pendingBookings,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          averageRating: averageRating._avg.rating || 0
        }
      };
    } catch (error) {
      console.error('Get doctor stats error:', error);
      throw error;
    }
  }
}

module.exports = new DoctorService();
