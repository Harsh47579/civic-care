const Notification = require('../models/Notification');
const { io } = require('socket.io');

class NotificationService {
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      const notification = await Notification.createNotification(userId, type, title, message, data);
      
      // Emit real-time notification
      const ioInstance = io();
      if (ioInstance) {
        ioInstance.to(`user-${userId}`).emit('notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async notifyIssueStatusUpdate(issue, oldStatus, newStatus) {
    try {
      const statusMessages = {
        'pending': 'Your issue has been submitted and is pending review',
        'acknowledged': 'Your issue has been acknowledged by the department',
        'in_progress': 'Your issue is now being worked on',
        'resolved': 'Your issue has been resolved!',
        'closed': 'Your issue has been closed',
        'rejected': 'Your issue has been rejected'
      };

      const notificationType = `issue_${newStatus}`;
      const title = `Issue ${newStatus.replace('_', ' ')}`;
      const message = statusMessages[newStatus] || `Your issue status has been updated to ${newStatus}`;

      await this.createNotification(
        issue.reportedBy,
        notificationType,
        title,
        message,
        {
          issueId: issue._id,
          metadata: {
            oldStatus,
            newStatus,
            issueTitle: issue.title
          }
        }
      );

      // Also emit socket event for real-time updates
      const ioInstance = io();
      if (ioInstance) {
        ioInstance.to(`user-${issue.reportedBy}`).emit('issue_status_update', {
          issueId: issue._id,
          issueTitle: issue.title,
          status: newStatus,
          oldStatus
        });
      }
    } catch (error) {
      console.error('Error notifying issue status update:', error);
    }
  }

  static async notifyAdminAnnouncement(announcement) {
    try {
      // Get all users to send announcement to
      const User = require('../models/User');
      const users = await User.find({ isActive: true }).select('_id');
      
      // Create notifications for all users
      const notificationPromises = users.map(user => 
        this.createNotification(
          user._id,
          'system_announcement',
          'Admin Announcement',
          announcement.message,
          { announcementId: announcement._id }
        )
      );

      await Promise.all(notificationPromises);

      // Emit socket event for real-time updates
      const ioInstance = io();
      if (ioInstance) {
        ioInstance.emit('admin_announcement', announcement);
      }
    } catch (error) {
      console.error('Error notifying admin announcement:', error);
    }
  }

  static async notifyIssueReported(issue) {
    try {
      await this.createNotification(
        issue.reportedBy,
        'issue_submitted',
        'Issue Submitted',
        `Your issue "${issue.title}" has been submitted successfully`,
        { issueId: issue._id }
      );
    } catch (error) {
      console.error('Error notifying issue reported:', error);
    }
  }

  static async notifyCommentAdded(issue, comment) {
    try {
      // Notify the issue reporter about new comments
      if (comment.user.toString() !== issue.reportedBy.toString()) {
        await this.createNotification(
          issue.reportedBy,
          'comment_added',
          'New Comment',
          `Someone commented on your issue "${issue.title}"`,
          { 
            issueId: issue._id,
            commentId: comment._id
          }
        );
      }
    } catch (error) {
      console.error('Error notifying comment added:', error);
    }
  }
}

module.exports = NotificationService;
