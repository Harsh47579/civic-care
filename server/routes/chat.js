const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const ChatConversation = require('../models/ChatConversation');
const User = require('../models/User');
const AIService = require('../services/AIService');
const llmService = require('../services/llmService');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat API is working',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/chat/message
// @desc    Send a message to the AI chatbot with enhanced civic care NLP
// @access  Private
router.post('/message', auth, async (req, res) => {
  try {
    console.log('🔍 Chat message request received:', {
      headers: req.headers,
      body: req.body,
      userId: req.userId,
      user: req.user,
      timestamp: new Date().toISOString()
    });
    
    // Check if user is authenticated
    if (!req.userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!req.user) {
      console.log('❌ No user object found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User not found'
      });
    }
    
    const { message, conversationId } = req.body;
    const userId = req.userId;
    
    console.log('💬 Processing message:', { 
      message: message?.substring(0, 100) + '...', 
      messageLength: message?.length,
      conversationId, 
      userId 
    });
    
    // Manual validation
    if (!message) {
      console.log('❌ No message provided');
      return res.status(400).json({ 
        success: false,
        message: 'Message is required'
      });
    }
    
    // Trim the message
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      console.log('❌ Message is empty after trimming');
      return res.status(400).json({ 
        success: false,
        message: 'Message cannot be empty'
      });
    }
    
    if (trimmedMessage.length > 1000) {
      console.log('❌ Message too long');
      return res.status(400).json({ 
        success: false,
        message: 'Message must be less than 1000 characters'
      });
    }

    // Enhanced NLP processing for civic care issues
    const nlpResponse = processCivicCareMessage(trimmedMessage);
    
    let aiResponse;
    let conversation;
    
    try {
      // Find or create conversation
      if (conversationId) {
        conversation = await ChatConversation.findOne({ 
          conversationId, 
          userId,
          isActive: true 
        });
      }
      
      if (!conversation) {
        conversation = await ChatConversation.findOrCreate(userId);
      }

      // Add user message
      await conversation.addMessage(trimmedMessage, 'user', userId);

      // Generate dynamic response using LLM
      console.log('🤖 Generating dynamic response using LLM');
      try {
        aiResponse = await llmService.generateResponse({
          userMessage: trimmedMessage,
          nlpData: {
            category: nlpResponse.category,
            department: nlpResponse.department,
            confidence: nlpResponse.confidence,
            followUp: nlpResponse.followUp,
            escalation: nlpResponse.escalation
          }
        });
        console.log('✅ LLM response generated:', aiResponse);
      } catch (llmError) {
        console.error('❌ LLM generation failed, using fallback:', llmError.message);
        // Fallback to enhanced rule-based response
        aiResponse = llmService.generateEnhancedFallback(trimmedMessage, {
          category: nlpResponse.category,
          department: nlpResponse.department,
          confidence: nlpResponse.confidence,
          followUp: nlpResponse.followUp,
          escalation: nlpResponse.escalation
        });
      }

      // Add AI response
      await conversation.addMessage(aiResponse, 'ai');

      // Get updated conversation
      const updatedConversation = await ChatConversation.findById(conversation._id)
        .populate('userId', 'name email')
        .populate('assignedAdmin', 'name email');

      // Emit real-time message to user
      const io = req.app.get('io');
      if (io) {
        io.to(`chat-${conversation.conversationId}`).emit('new-message', {
          conversationId: conversation.conversationId,
          message: {
            content: aiResponse,
            sender: 'ai',
            timestamp: new Date()
          }
        });
      }

      console.log('✅ Chat response sent successfully');

      res.json({
        success: true,
        conversation: updatedConversation,
        message: {
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        },
        nlp: nlpResponse ? { 
          detected: true, 
          category: nlpResponse.category,
          department: nlpResponse.department,
          confidence: nlpResponse.confidence,
          followUp: nlpResponse.followUp,
          escalation: nlpResponse.escalation
        } : null,
        generation: {
          method: 'llm',
          timestamp: new Date(),
          provider: process.env.LLM_PROVIDER || 'ollama'
        }
      });

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      
      // Fallback: Return NLP response without saving to database
      aiResponse = nlpResponse.message || nlpResponse;
      
      res.json({
        success: true,
        message: {
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        },
        fallback: true,
        nlp: nlpResponse ? { 
          detected: true, 
          category: nlpResponse.category,
          department: nlpResponse.department,
          confidence: nlpResponse.confidence,
          followUp: nlpResponse.followUp,
          escalation: nlpResponse.escalation
        } : null
      });
    }

  } catch (error) {
    console.error('🔥 Chat message critical error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Always return a valid JSON response, never crash
    res.json({
      success: true,
      message: {
        content: "I apologize, but I'm having trouble processing your message right now. Please try again or contact support directly.",
        sender: 'ai',
        timestamp: new Date()
      },
      error: true,
      fallback: true
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's chat conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await ChatConversation.find({ 
      userId, 
      isActive: true 
    })
    .populate('userId', 'name email')
    .populate('assignedAdmin', 'name email')
    .sort({ lastMessageAt: -1 })
    .limit(10);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
});

// @route   GET /api/chat/conversation/:conversationId
// @desc    Get specific conversation with messages
// @access  Private
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const conversation = await ChatConversation.findOne({
      conversationId,
      userId,
      isActive: true
    })
    .populate('userId', 'name email')
    .populate('assignedAdmin', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark messages as read
    await conversation.markAsRead();

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
});

// @route   POST /api/chat/admin/message
// @desc    Send admin message to user's conversation
// @access  Private (Admin only)
router.post('/admin/message', auth, [
  body('conversationId').isString().withMessage('Conversation ID is required'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId, message } = req.body;

    const conversation = await ChatConversation.findOne({
      conversationId,
      isActive: true
    }).populate('userId', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Add admin message
    await conversation.addMessage(message, 'admin', req.userId);

    // Get updated conversation
    const updatedConversation = await ChatConversation.findById(conversation._id)
      .populate('userId', 'name email')
      .populate('assignedAdmin', 'name email');

    // Emit real-time message to user
    const io = req.app.get('io');
    if (io) {
      io.to(`chat-${conversation.conversationId}`).emit('new-message', {
        conversationId: conversation.conversationId,
        message: {
          content: message,
          sender: 'admin',
          senderId: req.userId,
          timestamp: new Date()
        }
      });
    }

    res.json({
      success: true,
      conversation: updatedConversation,
      message: {
        content: message,
        sender: 'admin',
        senderId: req.userId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Admin message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending admin message'
    });
  }
});

// @route   GET /api/chat/admin/conversations
// @desc    Get all conversations for admin panel
// @access  Private (Admin only)
router.get('/admin/conversations', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status = 'active', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await ChatConversation.find({
      isActive: status === 'all' ? { $exists: true } : status === 'active'
    })
    .populate('userId', 'name email')
    .populate('assignedAdmin', 'name email')
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await ChatConversation.countDocuments({
      isActive: status === 'all' ? { $exists: true } : status === 'active'
    });

    res.json({
      success: true,
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
});

// @route   PUT /api/chat/conversation/:conversationId/assign
// @desc    Assign conversation to admin
// @access  Private (Admin only)
router.put('/conversation/:conversationId/assign', auth, [
  body('adminId').isMongoId().withMessage('Valid admin ID is required')
], async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { adminId } = req.body;

    const conversation = await ChatConversation.findOneAndUpdate(
      { conversationId, isActive: true },
      { assignedAdmin: adminId },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('assignedAdmin', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Assign conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning conversation'
    });
  }
});

// @route   PUT /api/chat/conversation/:conversationId/status
// @desc    Update conversation status
// @access  Private (Admin only)
router.put('/conversation/:conversationId/status', auth, [
  body('status').isIn(['active', 'resolved', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId } = req.params;
    const { status } = req.body;

    const conversation = await ChatConversation.findOneAndUpdate(
      { conversationId },
      { status, isActive: status === 'active' },
      { new: true }
    )
    .populate('userId', 'name email')
    .populate('assignedAdmin', 'name email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Update conversation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating conversation status'
    });
  }
});

/**
 * Enhanced NLP processing for civic care issues
 * Detects common civic issues and provides intelligent responses
 */
function processCivicCareMessage(message) {
  try {
    const lowerMessage = message.toLowerCase();
    console.log('🔍 Processing message:', message);
    console.log('🔍 Lowercase message:', lowerMessage);
    
    // Define civic care issue categories with keywords
    const civicCategories = {
      water: {
        keywords: ['water', 'drinking water', 'water supply', 'tap water', 'water pressure', 'water quality', 'leak', 'leakage', 'pipeline', 'water tank', 'water problem', 'water issue', 'shortage', 'cut', 'disconnection', 'billing', 'meter', 'connection', 'taste', 'filter', 'purification', 'dirty', 'brown', 'smelly'],
        responses: [
          "I understand you're facing water supply issues. This is a critical civic problem that needs immediate attention. Let me help you report this to the Water Board with proper documentation and priority classification.",
          "Water is essential for daily life and public health. I'll help you escalate this water-related issue to the Water Board immediately and ensure it gets the attention it deserves.",
          "I can help you report water problems effectively. Please provide details about the location, duration, and specific issues you're experiencing so I can create a comprehensive report for faster resolution."
        ],
        department: "Water Board",
        priority: "high",
        escalation: "This water issue will be escalated to senior officials for immediate action. Contact Water Board at +91-XXX-XXXX",
        followUp: "Would you like me to help you create a detailed report with photos and location details for faster resolution?",
        aiFeatures: ["Location mapping", "Priority assessment", "Photo documentation", "Follow-up tracking"]
      },
      
      garbage: {
        keywords: ['garbage', 'waste', 'trash', 'rubbish', 'litter', 'dumping', 'collection', 'dustbin', 'bin', 'cleanliness', 'recycling', 'segregation', 'compost', 'landfill', 'pickup', 'schedule', 'overflowing', 'stray', 'animals', 'smell', 'dirty'],
        responses: [
          "I see you're concerned about waste management. This affects public health and hygiene significantly. Let me help you report this to the Municipal Corporation with proper categorization and priority classification.",
          "Garbage disposal issues are important for community health and environmental safety. I'll help you get this resolved quickly and ensure proper waste management practices are followed.",
          "I can assist you with comprehensive waste management issues. Please provide details about the location, type of waste, and frequency of collection problems so I can create an effective report."
        ],
        department: "Municipal Corporation",
        priority: "medium",
        escalation: "This waste management issue will be reported to the sanitation department for immediate cleanup. Contact Municipal Corporation at +91-XXX-XXXX",
        followUp: "Would you like information about proper waste segregation and recycling practices?",
        aiFeatures: ["Waste categorization", "Collection scheduling", "Health impact assessment", "Community awareness"]
      },
      
      pothole: {
        keywords: ['pothole', 'potholes', 'road', 'street', 'pavement', 'asphalt', 'crater', 'road damage', 'bumpy road', 'road repair', 'hole in road', 'road hole', 'crack', 'bump', 'flooded', 'narrow', 'widening', 'speed', 'bump', 'signage', 'markings', 'construction', 'maintenance'],
        responses: [
          "Road infrastructure issues are serious safety concerns that need immediate attention. Let me help you report this to the Public Works Department with detailed documentation for immediate repair and safety measures.",
          "I understand you're facing road problems that could affect public safety and daily commute. I'll help you escalate this to the appropriate department with priority classification and safety assessment.",
          "Road maintenance is crucial for public safety and smooth transportation. Please provide details about the specific road issues, location, and any safety hazards you've observed so I can create a comprehensive report."
        ],
        department: "Public Works Department",
        priority: "high",
        escalation: "This road safety issue will be escalated to the engineering department for immediate assessment and repair. Contact PWD at +91-XXX-XXXX",
        followUp: "Would you like me to help you document the road condition with photos for faster repair approval?",
        aiFeatures: ["Safety assessment", "Traffic impact analysis", "Repair priority", "Photo documentation"]
      },
      
      lighting: {
        keywords: ['light', 'street light', 'lamp', 'lighting', 'dark', 'broken light', 'flickering', 'power', 'electricity', 'outage'],
        responses: [
          "Street lighting issues are handled by the Electricity Department. Let me help you report this.",
          "I can help you report lighting problems. Please specify the location and describe the issue.",
          "Power and lighting issues can be reported through our system. What's the exact location?"
        ],
        department: "Electricity Department",
        escalation: "Contact Electricity Department at +91-XXX-XXXX"
      },
      
      traffic: {
        keywords: ['traffic', 'signal', 'jam', 'congestion', 'parking', 'vehicle', 'roadblock', 'accident', 'rush hour'],
        responses: [
          "Traffic issues are managed by Traffic Police. For urgent matters, contact them directly.",
          "I can help you report traffic-related problems. Please provide location and time details.",
          "Traffic management issues can be escalated to the Traffic Department. Let me help you report this."
        ],
        department: "Traffic Police",
        escalation: "Contact Traffic Police at +91-XXX-XXXX"
      },
      
      drainage: {
        keywords: ['drain', 'sewer', 'flooding', 'water logging', 'blocked drain', 'sewage', 'overflow', 'monsoon', 'rain', 'drainage', 'waterlogging', 'blocked', 'clogged', 'smell', 'wastewater', 'manhole', 'cover', 'broken', 'stagnant', 'mosquito', 'disease', 'health'],
        responses: [
          "Drainage problems can cause serious health and safety issues, including waterborne diseases. Let me help you report this to the Municipal Corporation with priority classification and health impact assessment.",
          "I understand you're facing drainage issues that could lead to waterlogging and health problems. I'll help you escalate this to the appropriate department immediately for public health protection.",
          "Proper drainage is essential for public health and preventing waterborne diseases. Please provide details about the drainage problem, its impact on the community, and any health concerns you've noticed."
        ],
        department: "Municipal Corporation",
        priority: "high",
        escalation: "This drainage issue will be escalated to the health department for immediate action to prevent disease spread. Contact Municipal Corporation at +91-XXX-XXXX",
        followUp: "Would you like me to help you report this as a health hazard for immediate cleanup?",
        aiFeatures: ["Health impact assessment", "Disease prevention", "Flood risk analysis", "Community health monitoring"]
      },
      
      electricity: {
        keywords: ['electricity', 'power', 'outage', 'cut', 'supply', 'transformer', 'wire', 'cable', 'shock', 'spark', 'flicker', 'voltage', 'meter', 'billing', 'connection', 'disconnection', 'safety', 'electrical', 'energy'],
        responses: [
          "Power supply issues are critical for daily life and can affect essential services. Let me help you report this to the Electricity Board with proper documentation for immediate restoration and safety assessment.",
          "I understand you're facing electricity problems that could impact your daily activities. I'll help you escalate this to the power department with priority classification for quick resolution and safety measures.",
          "Electricity is essential for modern life and public services. I'll help you get this power issue resolved quickly and ensure reliable supply for your area."
        ],
        department: "Electricity Board",
        priority: "high",
        escalation: "This power issue will be escalated to the emergency response team for immediate restoration. Contact Electricity Board at +91-XXX-XXXX",
        followUp: "Would you like me to help you report this as an emergency power outage?",
        aiFeatures: ["Power grid analysis", "Safety assessment", "Emergency response", "Service restoration tracking"]
      },
      
      healthcare: {
        keywords: ['hospital', 'clinic', 'doctor', 'medicine', 'pharmacy', 'ambulance', 'emergency', 'health', 'medical', 'treatment', 'facility', 'staff', 'appointment', 'queue', 'waiting', 'service', 'patient', 'care', 'nurse', 'bed', 'equipment'],
        responses: [
          "Healthcare services are critical for public welfare and life. Let me help you report this health-related issue to the Health Department with proper documentation and priority classification.",
          "I understand you're facing healthcare problems that could affect public health. I'll help you escalate this to the health department for immediate attention and resolution.",
          "Access to quality healthcare is a fundamental right. I'll help you get this health issue resolved quickly and ensure proper medical services are available for everyone."
        ],
        department: "Health Department",
        priority: "high",
        escalation: "This healthcare issue will be escalated to the health commissioner for immediate action. Contact Health Department at +91-XXX-XXXX",
        followUp: "Would you like me to help you connect with emergency health services if this is urgent?",
        aiFeatures: ["Health service assessment", "Emergency response", "Patient care tracking", "Medical facility monitoring"]
      },
      
      education: {
        keywords: ['school', 'college', 'education', 'teacher', 'student', 'classroom', 'facility', 'infrastructure', 'admission', 'fees', 'quality', 'learning', 'books', 'uniform', 'midday', 'meal', 'library', 'laboratory', 'playground', 'transport'],
        responses: [
          "Education is the foundation of development and future prosperity. Let me help you report this education-related issue to the Education Department for proper resolution and quality improvement.",
          "I understand you're concerned about educational facilities and quality. I'll help you escalate this to the education department for immediate attention and better learning outcomes.",
          "Quality education is essential for children's future and community development. I'll help you get this education issue resolved quickly and ensure proper learning facilities are available."
        ],
        department: "Education Department",
        priority: "medium",
        escalation: "This education issue will be escalated to the education director for immediate action. Contact Education Department at +91-XXX-XXXX",
        followUp: "Would you like me to help you connect with education officials for immediate assistance?",
        aiFeatures: ["Educational quality assessment", "Infrastructure monitoring", "Student welfare tracking", "Learning outcome analysis"]
      }
    };
    
    // Detect issue category
    let detectedCategory = null;
    let confidence = 0;
    
    for (const [category, config] of Object.entries(civicCategories)) {
      // Simple keyword matching - check if any keyword is in the message
      const matches = config.keywords.filter(keyword => lowerMessage.includes(keyword.toLowerCase()));
      
      console.log(`🔍 Checking ${category}: matches=${matches.length}, keywords checked:`, config.keywords.slice(0, 5));
      
      if (matches.length > 0) {
        // Simple confidence based on number of matches
        let categoryConfidence = matches.length * 0.3; // Each match adds 0.3 confidence
        
        console.log(`🔍 ${category} confidence: ${categoryConfidence}`);
        
        if (categoryConfidence > confidence) {
          confidence = categoryConfidence;
          detectedCategory = category;
          console.log(`✅ Detected category: ${category} with confidence: ${confidence}`);
        }
      }
    }
    
    // Generate response based on detected category
    if (detectedCategory && confidence > 0.05) {
      const categoryConfig = civicCategories[detectedCategory];
      const randomResponse = categoryConfig.responses[Math.floor(Math.random() * categoryConfig.responses.length)];
      
      return {
        message: randomResponse,
        category: detectedCategory,
        department: categoryConfig.department,
        priority: categoryConfig.priority || 'medium',
        escalation: categoryConfig.escalation,
        followUp: categoryConfig.followUp || generateFollowUpQuestions(detectedCategory),
        aiFeatures: categoryConfig.aiFeatures || [],
        confidence: confidence,
        timestamp: new Date().toISOString(),
        status: 'detected',
        urgency: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low'
      };
    }
    
    // Enhanced default response for unrecognized messages
    return {
      message: "I'm here to help with civic care issues. You can ask about water supply, garbage collection, road problems, street lighting, traffic issues, drainage problems, electricity issues, healthcare services, or education facilities. How can I assist you today?",
      category: 'general',
      department: 'General Support',
      priority: 'low',
      escalation: "For general inquiries, please contact our support team at +91-XXX-XXXX",
      confidence: 0,
      followUp: [
        "What type of civic issue are you facing?",
        "Please provide your location for better assistance",
        "Would you like to file a formal report?",
        "I can help you with water, waste, roads, lighting, traffic, drainage, electricity, healthcare, or education issues"
      ],
      aiFeatures: ["Issue categorization", "Department routing", "Priority assessment"],
      timestamp: new Date().toISOString(),
      status: 'general_inquiry',
      urgency: 'low'
    };
    
  } catch (error) {
    console.error('NLP processing error:', error);
    return {
      message: "I didn't understand your query. Please try again with more details about your civic care issue.",
      category: 'error',
      confidence: 0
    };
  }
}

/**
 * Generate follow-up questions based on detected category
 */
function generateFollowUpQuestions(category) {
  const followUpMap = {
    water: [
      "What's your exact location?",
      "Is this affecting multiple households?",
      "How long has this issue been going on?",
      "Is the water completely unavailable or just low pressure?"
    ],
    garbage: [
      "Which area is affected?",
      "Is this about collection timing or overflowing bins?",
      "Are you reporting for a residential or commercial area?",
      "How many days has garbage not been collected?"
    ],
    pothole: [
      "What's the exact street name and area where the pothole is located?",
      "How big is the pothole? (small, medium, large)",
      "Is the pothole causing traffic problems or vehicle damage?",
      "Have you seen any accidents or near-misses due to this pothole?",
      "Is this pothole on a main road or residential street?"
    ],
    lighting: [
      "Which street or area is affected?",
      "Is the light completely off or flickering?",
      "How many street lights are not working?",
      "Is this a recurring problem?"
    ],
    traffic: [
      "What's the location of the traffic issue?",
      "What time of day does this usually happen?",
      "Is this about traffic signals or road congestion?",
      "Has this caused any accidents?"
    ],
    drainage: [
      "Which area is experiencing waterlogging?",
      "Is this blocking road access?",
      "Are homes getting flooded?",
      "Is this a recurring issue during rains?"
    ]
  };
  
  return followUpMap[category] || [
    "Can you provide more details?",
    "What's your location?",
    "How urgent is this issue?"
  ];
}

// @route   GET /api/chat/llm-health
// @desc    Check LLM service health
// @access  Private (Admin only)
router.get('/llm-health', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    const health = await llmService.checkHealth();
    
    res.json({
      success: true,
      llm: health,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('LLM health check error:', error);
    res.status(500).json({
      success: false,
      message: 'LLM health check failed',
      error: error.message
    });
  }
});

module.exports = router;
