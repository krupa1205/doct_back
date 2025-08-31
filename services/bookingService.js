const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class BookingService {
  async createBooking(bookingData, userId) {
    try {
      // Verify doctor exists and is available
      const doctor = await prisma.doctor.findUnique({
        where: { id: bookingData.doctorId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      if (!doctor.isAvailable || !doctor.isVerified) {
        throw new Error('Doctor is not available for bookings');
      }

      // Check if slot is available (if provided)
      if (bookingData.slotId) {
        const slot = await prisma.slot.findUnique({
          where: { id: bookingData.slotId }
        });

        if (!slot || !slot.isAvailable || slot.doctorId !== bookingData.doctorId) {
          throw new Error('Selected slot is not available');
        }

        // Check for conflicting bookings
        const conflictingBooking = await prisma.booking.findFirst({
          where: {
            slotId: bookingData.slotId,
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        });

        if (conflictingBooking) {
          throw new Error('Selected slot is already booked');
        }
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          userId,
          doctorId: bookingData.doctorId,
          slotId: bookingData.slotId,
          appointmentDate: new Date(bookingData.appointmentDate),
          consultationType: bookingData.consultationType,
          symptoms: bookingData.symptoms,
          notes: bookingData.notes,
          totalAmount: doctor.consultationFee
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          slot: true
        }
      });

      // Mark slot as unavailable if used
      if (bookingData.slotId) {
        await prisma.slot.update({
          where: { id: bookingData.slotId },
          data: { isAvailable: false }
        });
      }

      return {
        success: true,
        message: 'Booking created successfully',
        data: { booking }
      };
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  async getBookings(userId, userRole, page = 1, limit = 10, status = null) {
    try {
      const skip = (page - 1) * limit;
      
      let where = {};
      
      if (userRole === 'USER') {
        where.userId = userId;
      } else if (userRole === 'DOCTOR') {
        where.doctorId = userId;
      }

      if (status) {
        where.status = status;
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
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
            },
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            slot: true
          },
          orderBy: { appointmentDate: 'desc' }
        }),
        prisma.booking.count({ where })
      ]);

      return {
        success: true,
        message: 'Bookings retrieved successfully',
        data: {
          bookings,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  }

  async getBookingById(bookingId, userId, userRole) {
    try {
      let where = { id: bookingId };
      
      if (userRole === 'USER') {
        where.userId = userId;
      } else if (userRole === 'DOCTOR') {
        where.doctorId = userId;
      }

      const booking = await prisma.booking.findFirst({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              gender: true
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          slot: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      return {
        success: true,
        message: 'Booking retrieved successfully',
        data: { booking }
      };
    } catch (error) {
      console.error('Get booking by ID error:', error);
      throw error;
    }
  }

  async updateBooking(bookingId, updateData, userId, userRole) {
    try {
      // Check if user has permission to update this booking
      const existingBooking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          ...(userRole === 'USER' ? { userId } : {}),
          ...(userRole === 'DOCTOR' ? { doctorId: userId } : {})
        }
      });

      if (!existingBooking) {
        throw new Error('Booking not found or access denied');
      }

      // Update booking
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: updateData.status,
          symptoms: updateData.symptoms,
          notes: updateData.notes,
          prescription: updateData.prescription
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          slot: true
        }
      });

      return {
        success: true,
        message: 'Booking updated successfully',
        data: { booking }
      };
    } catch (error) {
      console.error('Update booking error:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId, userId, userRole) {
    try {
      // Check if user has permission to cancel this booking
      const existingBooking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          ...(userRole === 'USER' ? { userId } : {}),
          ...(userRole === 'DOCTOR' ? { doctorId: userId } : {})
        },
        include: { slot: true }
      });

      if (!existingBooking) {
        throw new Error('Booking not found or access denied');
      }

      if (existingBooking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      if (existingBooking.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed booking');
      }

      // Update booking status
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          slot: true
        }
      });

      // Make slot available again if it was used
      if (existingBooking.slotId) {
        await prisma.slot.update({
          where: { id: existingBooking.slotId },
          data: { isAvailable: true }
        });
      }

      return {
        success: true,
        message: 'Booking cancelled successfully',
        data: { booking }
      };
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  }

  async getBookingStats(userId, userRole) {
    try {
      let where = {};
      
      if (userRole === 'USER') {
        where.userId = userId;
      } else if (userRole === 'DOCTOR') {
        where.doctorId = userId;
      }

      const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings
      ] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
        prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.booking.count({ where: { ...where, status: 'CANCELLED' } })
      ]);

      return {
        success: true,
        message: 'Booking stats retrieved successfully',
        data: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          completedBookings,
          cancelledBookings
        }
      };
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw error;
    }
  }
}

module.exports = new BookingService();
