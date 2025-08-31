const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Send a message
router.post('/message', async (req, res) => {
  try {
    const { sessionId, senderId, content, type = 'TEXT' } = req.body;

    // Validate required fields
    if (!sessionId || !senderId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, Sender ID, and content are required'
      });
    }

    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to inactive session'
      });
    }

    // Check if sender is part of the session
    if (senderId !== session.userId && senderId !== session.doctorId) {
      return res.status(403).json({
        success: false,
        message: 'Sender is not part of this session'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        sessionId,
        senderId,
        content,
        type
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get messages for a session
router.get('/messages/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { sessionId },
        skip,
        take: parseInt(limit),
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.message.count({ where: { sessionId } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark messages as read
router.put('/messages/:sessionId/read', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Mark messages as read (excluding messages sent by the user)
    await prisma.message.updateMany({
      where: {
        sessionId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count for a user
router.get('/messages/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get sessions where user is either patient or doctor
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { userId },
          { doctorId: userId }
        ],
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    const sessionIds = sessions.map(session => session.id);

    // Count unread messages (excluding messages sent by the user)
    const unreadCount = await prisma.message.count({
      where: {
        sessionId: { in: sessionIds },
        senderId: { not: userId },
        isRead: false
      }
    });

    res.status(200).json({
      success: true,
      message: 'Unread message count retrieved successfully',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a message
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if message exists and user is the sender
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
