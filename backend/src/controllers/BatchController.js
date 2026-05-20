// backend/src/controllers/BatchController.js
const Batch = require('../models/Batch');
const Technology = require('../models/Technology');
const User = require('../models/User');

// Helper to generate batch ID
const generateBatchId = async () => {
  try {
    const lastBatch = await Batch.findOne().sort({ batchId: -1 });
    
    let nextNum = 1;
    if (lastBatch && lastBatch.batchId) {
      const match = lastBatch.batchId.match(/BATCH(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    return `BATCH${String(nextNum).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating batchId:', error);
    return 'BATCH001';
  }
};

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Admin
const createBatch = async (req, res) => {
  try {
    const { name, description, startDate, endDate, technology } = req.body;
    
    // Validate required fields
    if (!name || !startDate || !endDate || !technology) {
      return res.status(400).json({
        success: false,
        message: 'Name, start date, end date, and technology are required'
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    // Verify technology exists
    const techExists = await Technology.findOne({ technologyId: technology });
    if (!techExists) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Generate batch ID
    const batchId = await generateBatchId();
    
    // Create batch
    const batch = await Batch.create({
      batchId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      startDate: start,
      endDate: end,
      technology,
      createdBy: req.user._id
    });
    
    console.log('✅ Batch created:', batch.batchId);
    
    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    console.error('❌ Create batch error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Public
const getAllBatches = async (req, res) => {
  try {
    const { status, technology, isActive } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (technology) filter.technology = technology;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const batches = await Batch.find(filter)
      .populate('participants', 'username email')
      .sort({ startDate: -1 });
    
    // Get technology details for each batch
    const batchesWithTech = await Promise.all(
      batches.map(async (batch) => {
        const tech = await Technology.findOne({ technologyId: batch.technology });
        return {
          ...batch.toObject(),
          technologyDetails: tech ? {
            technologyId: tech.technologyId,
            name: tech.name,
            category: tech.category,
            rounds: tech.rounds
          } : null
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: batchesWithTech.length,
      data: batchesWithTech
    });
  } catch (error) {
    console.error('❌ Get all batches error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get batch by ID
// @route   GET /api/batches/:id
// @access  Public
const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findOne({ batchId: id })
      .populate('participants', 'username email role');
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Get technology details
    const tech = await Technology.findOne({ technologyId: batch.technology });
    
    // Check and update status based on dates
    batch.checkStatus();
    await batch.save();
    
    res.status(200).json({
      success: true,
      data: {
        ...batch.toObject(),
        technologyDetails: tech ? {
          technologyId: tech.technologyId,
          name: tech.name,
          category: tech.category,
          rounds: tech.rounds,
          evaluationCriteria: tech.evaluationCriteria
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Get batch by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update batch
// @route   PUT /api/batches/:id
// @access  Admin
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, technology, status, isActive } = req.body;
    
    const batch = await Batch.findOne({ batchId: id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Verify technology if provided
    if (technology) {
      const techExists = await Technology.findOne({ technologyId: technology });
      if (!techExists) {
        return res.status(404).json({
          success: false,
          message: 'Technology not found'
        });
      }
      batch.technology = technology;
    }
    
    // Update fields
    if (name) batch.name = name.trim();
    if (description !== undefined) batch.description = description ? description.trim() : '';
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (status) batch.status = status;
    if (isActive !== undefined) batch.isActive = isActive;
    
    // Validate dates
    if (batch.endDate <= batch.startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    await batch.save();
    
    console.log('✅ Batch updated:', batch.batchId);
    
    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });
  } catch (error) {
    console.error('❌ Update batch error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Admin
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    const batch = await Batch.findOne({ batchId: id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Check if batch has participants
    if (batch.participants && batch.participants.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with ${batch.participants.length} participant(s). Remove participants first or deactivate the batch.`
      });
    }
    
    await batch.deleteOne();
    
    console.log('✅ Batch deleted:', batch.batchId);
    
    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add participants to batch
// @route   POST /api/batches/:id/participants
// @access  Admin
const addParticipantsToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantIds } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Participant IDs array is required'
      });
    }
    
    const batch = await Batch.findOne({ batchId: id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Verify all participants exist and are students
    const participants = await User.find({
      _id: { $in: participantIds },
      role: 'student'
    });
    
    if (participants.length !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some participant IDs are invalid or not students'
      });
    }
    
    // Add participants (avoiding duplicates)
    participantIds.forEach(participantId => {
      if (!batch.participants.includes(participantId)) {
        batch.participants.push(participantId);
      }
    });
    
    await batch.save();
    await batch.populate('participants', 'username email');
    
    console.log('✅ Participants added to batch:', batch.batchId);
    
    res.status(200).json({
      success: true,
      message: 'Participants added successfully',
      data: batch
    });
  } catch (error) {
    console.error('❌ Add participants error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove participant from batch
// @route   DELETE /api/batches/:id/participants/:participantId
// @access  Admin
const removeParticipantFromBatch = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    
    const batch = await Batch.findOne({ batchId: id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    const participantIndex = batch.participants.findIndex(
      p => p.toString() === participantId
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this batch'
      });
    }
    
    batch.participants.splice(participantIndex, 1);
    await batch.save();
    
    console.log('✅ Participant removed from batch:', batch.batchId);
    
    res.status(200).json({
      success: true,
      message: 'Participant removed successfully',
      data: batch
    });
  } catch (error) {
    console.error('❌ Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  addParticipantsToBatch,
  removeParticipantFromBatch
};