import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../config/api';
import useSocket from '../hooks/useSocket';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        loading: false
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date()
        })),
        unreadCount: 0
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const socket = useSocket();

  // Fetch notifications
  const fetchNotifications = async (page = 1, limit = 20, unread = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get('/api/notifications', {
        params: { page, limit, unread }
      });
      
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch notifications' });
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      dispatch({ type: 'MARK_ALL_READ' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners for notifications');
      
      // Listen for new notifications
      socket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      // Listen for issue status updates
      socket.on('issue_status_update', (data) => {
        const notification = {
          _id: `temp_${Date.now()}`,
          type: 'status_update',
          title: `Issue ${data.status}`,
          message: `Your issue "${data.issueTitle}" has been ${data.status}`,
          data: { issueId: data.issueId },
          isRead: false,
          createdAt: new Date()
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      // Listen for admin announcements
      socket.on('admin_announcement', (announcement) => {
        const notification = {
          _id: `temp_${Date.now()}`,
          type: 'system_announcement',
          title: 'Admin Announcement',
          message: announcement.message,
          data: { announcementId: announcement._id },
          isRead: false,
          createdAt: new Date()
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      return () => {
        console.log('Cleaning up socket listeners');
        if (socket) {
          socket.off('notification');
          socket.off('issue_status_update');
          socket.off('admin_announcement');
        }
      };
    } else {
      console.log('Socket not available for notifications');
    }
  }, [socket]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const value = {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
