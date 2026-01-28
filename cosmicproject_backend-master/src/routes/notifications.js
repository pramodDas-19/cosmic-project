const express = require('express');
const {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const { validateCreateNotification } = require('../middleware/validation');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user notifications
router.get('/', getUserNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Create notification (super-admin and manager only)
router.post('/', authorize('super-admin', 'manager'), validateCreateNotification, createNotification);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Cleanup test/demo notifications (SuperAdmin only)
router.delete('/cleanup/demo', authorize('superadmin'), async (req, res) => {
  try {
    const testQuery = {
      $or: [
        { title: { $regex: /test|demo/i } },
        { message: { $regex: /test|demo|verify the system/i } }
      ]
    };

    const result = await Notification.deleteMany(testQuery);
    
    logger.info(`Demo notifications cleanup: ${result.deletedCount} deleted by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: `Deleted ${result.deletedCount} test/demo notifications`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    logger.error(`Cleanup demo notifications error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup demo notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

module.exports = router;