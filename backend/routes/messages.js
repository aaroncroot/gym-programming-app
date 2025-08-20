const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed'));
    }
  }
});

// Get all conversations for a user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'firstName lastName email role')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCount.get(req.user._id.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount
      };
    });

    res.json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Error fetching conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: { $in: conversation.participants.filter(p => p.toString() !== req.user._id.toString()) } },
        { recipient: req.user._id, sender: { $in: conversation.participants.filter(p => p.toString() !== req.user._id.toString()) } }
      ]
    })
    .populate('sender', 'firstName lastName')
    .populate('recipient', 'firstName lastName')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { recipient: req.user._id, sender: { $in: conversation.participants.filter(p => p.toString() !== req.user._id.toString()) }, read: false },
      { read: true }
    );

    // Update unread count
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      $set: { [`unreadCount.${req.user._id}`]: 0 }
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

// Send a text message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text' } = req.body;

    // Validate recipient exists and is connected to sender
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Check if sender and recipient have a relationship (trainer-client or client-trainer)
    const isTrainer = req.user.role === 'trainer';
    const isClient = recipient.role === 'client';
    
    if (isTrainer && isClient) {
      // Trainer sending to client - check if client is assigned to trainer
      if (recipient.assignedTrainer?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only message your assigned clients' });
      }
    } else if (isClient && isTrainer) {
      // Client sending to trainer - check if trainer is assigned to client
      if (req.user.assignedTrainer?.toString() !== recipient._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only message your assigned trainer' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Invalid message recipient' });
    }

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId]
      });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      messageType
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = new Date();
    
    // Increment unread count for recipient
    const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Populate sender info for response
    await message.populate('sender', 'firstName lastName');
    await message.populate('recipient', 'firstName lastName');

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

// Send a file message
router.post('/send-file', auth, upload.single('file'), async (req, res) => {
  try {
    const { recipientId, messageType = 'file' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/messages/${req.file.filename}`;
    const fileName = req.file.originalname;

    // Validate recipient (same logic as text message)
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const isTrainer = req.user.role === 'trainer';
    const isClient = recipient.role === 'client';
    
    if (isTrainer && isClient) {
      if (recipient.assignedTrainer?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only message your assigned clients' });
      }
    } else if (isClient && isTrainer) {
      if (req.user.assignedTrainer?.toString() !== recipient._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only message your assigned trainer' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Invalid message recipient' });
    }

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, recipientId]
      });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content: `Sent: ${fileName}`,
      messageType,
      fileUrl,
      fileName
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = new Date();
    
    const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Populate sender info
    await message.populate('sender', 'firstName lastName');
    await message.populate('recipient', 'firstName lastName');

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending file:', error);
    res.status(500).json({ success: false, message: 'Error sending file' });
  }
});

// Mark messages as read
router.put('/mark-read/:conversationId', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Message.updateMany(
      { recipient: req.user._id, sender: { $in: conversation.participants.filter(p => p.toString() !== req.user._id.toString()) }, read: false },
      { read: true }
    );

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      $set: { [`unreadCount.${req.user._id}`]: 0 }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, message: 'Error marking messages as read' });
  }
});

module.exports = router; 