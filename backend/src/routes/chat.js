const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Create or return conversation between participants
router.post('/conversations', auth(), [body('participants').isArray({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const participants = req.body.participants.map(String);
  if (!participants.includes(String(req.user.id))) participants.push(String(req.user.id));
  let conv = await Conversation.findOne({ participants: { $all: participants, $size: participants.length } });
  if (!conv) conv = await Conversation.create({ participants, orderId: req.body.orderId });
  res.json({ success: true, conversation: conv });
});

// Get conversations for user
router.get('/conversations', auth(), async (req, res) => {
  const convs = await Conversation.find({ participants: req.user.id }).sort({ updatedAt: -1 });
  res.json({ success: true, conversations: convs });
});

// Get messages for conversation
router.get('/conversations/:id/messages', auth(), async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '50', 10);
  const msgs = await Message.find({ conversation: req.params.id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ success: true, messages: msgs.reverse() });
});

module.exports = router;
