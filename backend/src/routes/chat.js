const express = require('express');
const { body, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Shop = require('../models/Shop');
const auth = require('../middleware/auth');

const router = express.Router();

// Create or return conversation between participants
router.post('/conversations', auth(), [body('participants').isArray({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const participants = req.body.participants.map(String);
  if (!participants.includes(String(req.user.id))) participants.push(String(req.user.id));
  let conv = await Conversation.findOne({ participants: { $all: participants, $size: participants.length } });
  if (!conv) conv = await Conversation.create({ participants, orderId: req.body.orderId, postId: req.body.postId });
  res.json({ success: true, conversation: conv });
});

// Get conversations for user
router.get('/conversations', auth(), async (req, res) => {
  const convs = await Conversation.find({ participants: req.user.id }).sort({ updatedAt: -1 }).lean();
  // Gather participant info
  const ids = new Set();
  for (const c of convs) for (const p of c.participants || []) ids.add(String(p));
  const users = await User.find({ _id: { $in: Array.from(ids) } })
    .select('username email profile.fullName profile.avatarUrl role')
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
  // Gather shops for those users (sellers)
  const shops = await Shop.find({ owner: { $in: users.map((u) => u._id) } })
    .select('owner name slug logo')
    .lean();
  const shopByOwner = Object.fromEntries(shops.map((s) => [String(s.owner), s]));
  const enriched = convs.map((c) => ({
    ...c,
    participantsInfo: (c.participants || []).map((id) => ({ id, ...(userMap[String(id)] || {}) })),
    meta: {
      shops: Object.fromEntries((c.participants || []).map((id) => [String(id), shopByOwner[String(id)] || null])),
    },
  }));
  res.json({ success: true, conversations: enriched });
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

// Send a message to a conversation
router.post(
  '/conversations/:id/messages',
  auth(),
  [body('text').optional().isString(), body('attachments').optional().isArray()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });
    // Ensure user is participant
    if (!conv.participants.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }
    const msg = await Message.create({
      conversation: conv._id,
      sender: req.user.id,
      text: req.body.text || '',
      attachments: req.body.attachments || [],
      readBy: [req.user.id],
    });
    // Touch the conversation updatedAt
    await Conversation.updateOne({ _id: conv._id }, { $set: { updatedAt: new Date() } });

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`conv:${conv._id}`).emit('chat:message', {
        conversationId: String(conv._id),
        message: msg,
      });
    }
    res.status(201).json({ success: true, message: msg });
  }
);

module.exports = router;
