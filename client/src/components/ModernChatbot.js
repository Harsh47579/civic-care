import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from '../config/api';
import toast from 'react-hot-toast';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Shield,
  Minimize2,
  Maximize2,
  Loader2,
  Bell,
  Sparkles
} from 'lucide-react';
import { formatAIResponse, generateActionButtons } from '../utils/formatAIResponse';
import NivaranIcon from './NivaranIcon';

const ModernChatbot = ({ isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { isAuthenticated, user } = useAuth();
  const { socket } = useSocket();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    };

    const handleStopTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleTyping);
    socket.on('user-stopped-typing', handleStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
      socket.off('user-stopped-typing', handleStopTyping);
    };
  }, [socket, isAuthenticated, conversationId]);

  // Handle authentication retry for rate limiting
  // Remove the problematic authentication retry mechanism
  // The AuthContext already handles token validation properly

  // Fetch conversations
  const { data: conversations, refetch: refetchConversations } = useQuery(
    'conversations',
    async () => {
      const response = await axios.get('/api/chat/conversations');
      return response.data;
    },
    {
      enabled: isAuthenticated,
      onError: (error) => {
        console.error('Error fetching conversations:', error);
      }
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    async (messageData) => {
      console.log('Sending message with data:', messageData);
      console.log('User authenticated:', isAuthenticated);
      console.log('User:', user);
      console.log('Token in localStorage:', localStorage.getItem('token'));
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Ensure messageData has the correct format
      const requestData = {
        message: messageData.message,
        conversationId: messageData.conversationId || null
      };
      
      console.log('Request data being sent:', requestData);
      console.log('Request headers:', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      const response = await axios.post('/api/chat/message', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        console.log('Message sent successfully:', data);
        
        const enhancedMessage = {
          ...data.message,
          nlp: data.nlp,
          fallback: data.fallback,
          error: data.error
        };
        
        setMessages(prev => [...prev, enhancedMessage]);
        setMessage('');
        setIsTyping(false);
        refetchConversations();
        
        if (data.conversation && !conversationId) {
          setConversationId(data.conversation.conversationId);
        }
      },
      onError: (error) => {
        console.error('Send message error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          toast.error('Please login again to continue chatting');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to send messages');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later');
        } else {
          toast.error('Failed to send message. Please try again');
        }
        
        setIsTyping(false);
      }
    }
  );

  // Admin send message mutation
  const sendAdminMessageMutation = useMutation(
    async (messageData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/chat/admin/message', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMessages(prev => [...prev, data.message]);
        setMessage('');
        setIsTyping(false);
        refetchConversations();
      },
      onError: (error) => {
        console.error('Send admin message error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          toast.error('Please login again to continue chatting');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to send messages');
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later');
        } else {
          toast.error('Failed to send admin message. Please try again');
        }
        
        setIsTyping(false);
      }
    }
  );

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    console.log('Handle send message called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user.id:', user?.id);
    console.log('isAdmin:', isAdmin);
    
    // Check authentication more thoroughly
    if (!isAuthenticated) {
      console.error('User not authenticated');
      toast.error('Please login to send messages');
      return;
    }
    
    if (!user) {
      console.error('User object not found');
      toast.error('Please login again');
      return;
    }
    
    if (!user._id && !user.id) {
      console.error('User ID not found');
      toast.error('Please login again');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      toast.error('Please login again');
      return;
    }
    
    // Verify token is valid by making a test request
    try {
      const testResponse = await axios.get('/api/auth/me');
      console.log('Token validation successful:', testResponse.data);
    } catch (error) {
      console.error('Token validation failed:', error);
      toast.error('Please login again - session expired');
      return;
    }

    const messageText = message.trim();
    setMessage('');
    setIsTyping(true);

    const userMessage = {
      content: messageText,
      sender: 'user',
      senderId: user?.id,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    if (socket && conversationId) {
      socket.emit('typing', { conversationId, userId: user?.id, isTyping: true });
    }

    try {
      if (isAdmin) {
        console.log('Sending admin message');
        await sendAdminMessageMutation.mutateAsync({
          conversationId,
          message: messageText
        });
      } else {
        console.log('Sending user message');
        const response = await sendMessageMutation.mutateAsync({
          message: messageText,
          conversationId
        });
        
        if (response.conversation && !conversationId) {
          setConversationId(response.conversation.conversationId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response?.status === 401) {
        toast.error('Please login again to continue chatting');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to send messages');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later');
      } else {
        toast.error('Failed to send message. Please try again');
      }
      
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
      if (socket && conversationId) {
        socket.emit('stop-typing', { conversationId, userId: user?.id });
      }
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (socket && conversationId) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      socket.emit('typing', { conversationId, userId: user?.id, isTyping: true });
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { conversationId, userId: user?.id });
      }, 1000);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsTyping(false);
  };

  // Get message sender info
  const getMessageSender = (message) => {
    if (message.sender === 'user') {
      return { name: 'You', icon: User, color: 'bg-blue-500' };
    } else if (message.sender === 'admin') {
      return { name: 'Admin', icon: Shield, color: 'bg-purple-500' };
    } else if (message.sender === 'announcement') {
      return { name: 'Announcement', icon: Bell, color: 'bg-yellow-500' };
    } else {
      return { name: 'Nivaran Assistant', icon: Bot, color: 'bg-green-500' };
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle action button clicks
  const handleActionButton = (button, message) => {
    switch (button.action) {
      case 'report':
        toast.success(`Redirecting to report ${button.category} issue...`);
        break;
      case 'status':
        toast.success('Redirecting to status page...');
        break;
      case 'escalate':
        toast.success(`Escalating to ${message.nlp.department}...`);
        break;
      case 'categories':
        toast.success('Showing all issue categories...');
        break;
      default:
        toast.info('Action not implemented yet');
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render chatbot if not authenticated
  }

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            isOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'
          }`}
        >
          <MessageCircle size={24} className="transition-transform group-hover:rotate-12" />
          <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20"></div>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl transition-all duration-500 transform ${
          isMinimized ? 'h-16 w-80' : 'h-[500px] w-96'
        } ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <NivaranIcon size="small" />
              <div>
                <span className="font-semibold text-lg">
                  {isAdmin ? 'Admin Chat' : 'Nivaran Assistant'}
                </span>
                <p className="text-xs text-primary-100">
                  {isAdmin ? 'Manage conversations' : 'AI-powered support'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-primary-700 rounded-lg p-2 transition-colors"
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary-700 rounded-lg p-2 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[380px] bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot size={32} className="text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {isAdmin 
                        ? 'Select a conversation to start chatting'
                        : 'Welcome to Nivaran Assistant!'
                      }
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {isAdmin 
                        ? 'Choose a conversation from the list to begin'
                        : 'I\'m here to help you report issues and get support. How can I assist you today?'
                      }
                    </p>
                    {!isAdmin && (
                      <button
                        onClick={startNewConversation}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        Start New Conversation
                      </button>
                    )}
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const sender = getMessageSender(msg);
                    const SenderIcon = sender.icon;
                    const isUser = msg.sender === 'user';
                    
                    const displayContent = isUser ? msg.content : formatAIResponse(msg);
                    
                    return (
                      <div
                        key={index}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`max-w-xs ${isUser ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-3 rounded-2xl ${
                              isUser
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isUser ? 'bg-primary-500' : 'bg-gray-100'
                              }`}>
                                <SenderIcon size={12} className={isUser ? 'text-white' : 'text-gray-600'} />
                              </div>
                              <span className="text-xs font-semibold">
                                {sender.name}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{displayContent}</p>
                            
                            {!isUser && msg.nlp && msg.nlp.detected && (
                              <div className="mt-3 space-y-2">
                                {generateActionButtons(msg).slice(0, 2).map((button, btnIndex) => (
                                  <button
                                    key={btnIndex}
                                    onClick={() => handleActionButton(button, msg)}
                                    className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                      button.variant === 'primary' 
                                        ? 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105'
                                        : button.variant === 'urgent'
                                        ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                                    }`}
                                  >
                                    {button.text}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {isTyping && (
                  <div className="flex justify-start animate-fade-in-up">
                    <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <Bot size={12} className="text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold">Nivaran Assistant</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={handleTyping}
                      placeholder="Type your message..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      disabled={isTyping}
                    />
                    {message.trim() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim() || isTyping}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl px-4 py-3 transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isTyping ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ModernChatbot;
