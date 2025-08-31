const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

class UserService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
          gender: userData.gender,
          address: userData.address,
          role: userData.role || 'USER'
        },
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
          createdAt: true
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          token
        }
      };
    } catch (error) {
      console.error('User registration error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          doctor: {
            select: {
              id: true,
              specialty: true,
              isVerified: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          token
        }
      };
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  }

  async getProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
          updatedAt: true,
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

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      };
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: updateData.name,
          phone: updateData.phone,
          dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
          gender: updateData.gender,
          address: updateData.address
        },
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
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async deactivateAccount(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      console.error('Deactivate account error:', error);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 10, role = null) {
    try {
      const skip = (page - 1) * limit;
      
      const where = role ? { role } : {};
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            doctor: {
              select: {
                id: true,
                specialty: true,
                isVerified: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
