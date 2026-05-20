const Participant = require('../models/Participant');

const generateParticipantId = async () => {
  const last = await Participant.findOne().sort({ createdAt: -1 });
  let nextNum = 1;
  if (last?.participantId) {
    const match = last.participantId.match(/PART(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  return `PART${String(nextNum).padStart(3, '0')}`;
};

// @desc    Add a new participant
// @route   POST /api/participants
// @access  Admin
const createParticipant = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await Participant.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Participant with this email already exists' });
    }

    const participantId = await generateParticipantId();

    const participant = await Participant.create({
      participantId,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim(),
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Participant created successfully',
      data: participant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all participants
// @route   GET /api/participants
// @access  Admin
const getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: participants.length, data: participants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get participant by ID
// @route   GET /api/participants/:id
// @access  Admin
const getParticipantById = async (req, res) => {
  try {
    const participant = await Participant.findOne({ participantId: req.params.id });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    res.status(200).json({ success: true, data: participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update participant
// @route   PUT /api/participants/:id
// @access  Admin
const updateParticipant = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    const participant = await Participant.findOne({ participantId: req.params.id });

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    if (name) participant.name = name.trim();
    if (email) participant.email = email.trim();
    if (phone) participant.phone = phone.trim();
    if (typeof isActive !== 'undefined') participant.isActive = isActive;

    await participant.save();
    res.status(200).json({ success: true, message: 'Participant updated successfully', data: participant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete participant
// @route   DELETE /api/participants/:id
// @access  Admin
const deleteParticipant = async (req, res) => {
  try {
    const participant = await Participant.findOne({ participantId: req.params.id });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    await participant.deleteOne();
    res.status(200).json({ success: true, message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createParticipant,
  getAllParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant
};