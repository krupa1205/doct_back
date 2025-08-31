const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a new session
router.post('/session', async (req, res) => {
  try {
    const { userId, doctorId, bookingId } = req.body;

    // Validate required fields
    if (!userId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Doctor ID are required'
      });
    }

    // Check if user and doctor exist
    const [user, doctor] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId,
        doctorId,
        bookingId: bookingId || null,
        status: 'ACTIVE'
      },
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
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get session by ID
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Session retrieved successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// End session
router.put('/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      },
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
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      data: { session }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user sessions
router.get('/sessions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    const where = { userId };
    
    if (status) {
      where.status = status;
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
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
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.session.count({ where })
    ]);

    res.status(200).json({
      success: true,
      message: 'User sessions retrieved successfully',
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get doctor sessions
router.get('/sessions/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    const where = { doctorId };
    
    if (status) {
      where.status = status;
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.session.count({ where })
    ]);

    res.status(200).json({
      success: true,
      message: 'Doctor sessions retrieved successfully',
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get doctor sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
