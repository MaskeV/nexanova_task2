const Batch = require('../models/Batch');
const Participant = require('../models/Participant');
const Technology = require('../models/Technology');
const User = require('../models/User');


const generateBatchId = async () => {
  try {
    const lastBatch = await Batch.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastBatch?.batchId) {
      const match = lastBatch.batchId.match(/BATCH(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    return `BATCH${String(nextNum).padStart(3, '0')}`;
  } catch {
    return 'BATCH001';
  }
};

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Admin (FR-1.1)
const createBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, technology } = req.body;

    if (!name || !startDate || !endDate || !technology) {
      return res.status(400).json({ success: false, message: 'Name, start date, end date, and technology are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const techExists = await Technology.findOne({ technologyId: technology });
    if (!techExists) {
      return res.status(404).json({ success: false, message: 'Technology not found' });
    }

    const batchId = await generateBatchId();

    const batch = await Batch.create({
      batchId,
      name: name.trim(),
      description: description?.trim(),
      startDate: start,
      endDate: end,
      technology,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Batch created successfully', data: batch });
  } catch (error) {
    console.error('Create batch error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v.message]));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all batches (with optional filters)
// @route   GET /api/batches
// @access  Public
const getAllBatches = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.technology) filter.technology = req.query.technology;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const batches = await Batch.find(filter)
      .populate('participants', 'name email')
      .sort({ startDate: -1 });

    const batchesWithTech = await Promise.all(
      batches.map(async (batch) => {
        const tech = await Technology.findOne({ technologyId: batch.technology });
        return { ...batch.toObject(), technologyDetails: tech || null };
      })
    );

    res.status(200).json({ success: true, count: batchesWithTech.length, data: batchesWithTech });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get batch by ID
// @route   GET /api/batches/:id
// @access  Public
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id })
      .populate('participants', 'name email role');

    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    batch.checkStatus();
    await batch.save();

    const tech = await Technology.findOne({ technologyId: batch.technology });

    res.status(200).json({ success: true, data: { ...batch.toObject(), technologyDetails: tech || null } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Admin
const updateBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, technology, status, isActive } = req.body;

    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (technology) {
      const techExists = await Technology.findOne({ technologyId: technology });
      if (!techExists) return res.status(404).json({ success: false, message: 'Technology not found' });
      batch.technology = technology;
    }

    if (name) batch.name = name.trim();
    if (description !== undefined) batch.description = description?.trim() || '';
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (status) batch.status = status;
    if (typeof isActive !== 'undefined') batch.isActive = isActive;

    if (batch.endDate <= batch.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    await batch.save();
    res.status(200).json({ success: true, message: 'Batch updated successfully', data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Admin
const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (batch.participants?.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with ${batch.participants.length} participant(s). Remove participants first.`,
      });
    }

    await batch.deleteOne();
    res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add participants to batch (FR-3.1)
// @route   POST /api/batches/:id/participants
// @access  Admin
const addParticipantsToBatch = async (req, res) => {
  try {
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Participant IDs array is required' });
    }

    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Verify all IDs belong to users with role 'participant' (FR-3.1)
    const participants = await Participant.find({ _id: { $in: participantIds }, role: 'participant' });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({ success: false, message: 'Some IDs are invalid or not participants' });
    }

    participantIds.forEach((id) => {
      if (!batch.participants.includes(id)) batch.participants.push(id);
    });

    await batch.save();
    await batch.populate('participants', 'name email');

    res.status(200).json({ success: true, message: 'Participants added successfully', data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove participant from batch
// @route   DELETE /api/batches/:id/participants/:participantId
// @access  Admin
const removeParticipantFromBatch = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const idx = batch.participants.findIndex((p) => p.toString() === req.params.participantId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Participant not found in this batch' });

    batch.participants.splice(idx, 1);
    await batch.save();

    res.status(200).json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  addParticipantsToBatch,
  removeParticipantFromBatch,
};