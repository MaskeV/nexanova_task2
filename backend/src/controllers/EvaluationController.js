// backend/src/controllers/EvaluationController.js
const Evaluation = require('../models/Evaluation');
const Batch = require('../models/Batch');
const Technology = require('../models/Technology');
const User = require('../models/User');

// @desc    Create evaluation assignment (Admin assigns evaluator to participant for specific round)
// @route   POST /api/evaluations/assign
// @access  Admin
const assignEvaluation = async (req, res) => {
  try {
    const { batchId, participantId, evaluatorId, round, technology } = req.body;
    
    // Validate required fields
    if (!batchId || !participantId || !evaluatorId || !round || !technology) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, participant ID, evaluator ID, round, and technology are required'
      });
    }
    
    // Verify batch exists
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Verify technology exists
    const tech = await Technology.findOne({ technologyId: technology });
    if (!tech) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Verify round is valid for this technology
    if (round < 1 || round > tech.rounds) {
      return res.status(400).json({
        success: false,
        message: `Invalid round. Technology ${tech.name} has ${tech.rounds} round(s)`
      });
    }
    
    // Verify participant exists and is in the batch
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found or is not a student'
      });
    }
    
    if (!batch.participants.includes(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Participant is not in this batch'
      });
    }
    
    // Verify evaluator exists
    const evaluator = await User.findById(evaluatorId);
    if (!evaluator) {
      return res.status(404).json({
        success: false,
        message: 'Evaluator not found'
      });
    }
    
    // Check if evaluation already exists for this participant, round, and technology
    const existingEvaluation = await Evaluation.findOne({
      batch: batchId,
      participant: participantId,
      round,
      technology
    });
    
    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation already assigned for this participant, round, and technology'
      });
    }
    
    // Create evaluation assignment
    const evaluation = await Evaluation.create({
      batch: batchId,
      participant: participantId,
      evaluator: evaluatorId,
      technology,
      round,
      assignedBy: req.user._id
    });
    
    // Populate details
    await evaluation.populate([
      { path: 'participant', select: 'username email' },
      { path: 'evaluator', select: 'username email' }
    ]);
    
    console.log('✅ Evaluation assigned:', evaluation._id);
    
    res.status(201).json({
      success: true,
      message: 'Evaluation assigned successfully',
      data: evaluation
    });
  } catch (error) {
    console.error('❌ Assign evaluation error:', error);
    
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

// @desc    Get evaluations assigned to an evaluator
// @route   GET /api/evaluations/my-evaluations
// @access  Evaluator
const getMyEvaluations = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = { evaluator: req.user._id };
    if (status) filter.status = status;
    
    const evaluations = await Evaluation.find(filter)
      .populate('participant', 'username email')
      .populate('evaluator', 'username email')
      .sort({ assignedDate: -1 });
    
    // Get batch and technology details
    const evaluationsWithDetails = await Promise.all(
      evaluations.map(async (evaluation) => {
        const batch = await Batch.findOne({ batchId: evaluation.batch });
        const tech = await Technology.findOne({ technologyId: evaluation.technology });
        
        return {
          ...evaluation.toObject(),
          batchDetails: batch ? {
            batchId: batch.batchId,
            name: batch.name,
            startDate: batch.startDate,
            endDate: batch.endDate
          } : null,
          technologyDetails: tech ? {
            technologyId: tech.technologyId,
            name: tech.name,
            rounds: tech.rounds,
            evaluationCriteria: tech.evaluationCriteria.filter(c => c.roundNumber === evaluation.round)
          } : null
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: evaluationsWithDetails.length,
      data: evaluationsWithDetails
    });
  } catch (error) {
    console.error('❌ Get my evaluations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit evaluation scores and feedback
// @route   PUT /api/evaluations/:id/submit
// @access  Evaluator
const submitEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { scores, feedback, totalScore } = req.body;
    
    const evaluation = await Evaluation.findById(id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }
    
    // Verify evaluator is assigned to this evaluation
    if (evaluation.evaluator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit this evaluation'
      });
    }
    
    // Check if already submitted
    if (evaluation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Evaluation already submitted'
      });
    }
    
    // Validate scores
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Scores are required'
      });
    }
    
    // Update evaluation
    evaluation.scores = scores;
    evaluation.feedback = feedback || '';
    evaluation.totalScore = totalScore || scores.reduce((sum, s) => sum + (s.score || 0), 0);
    evaluation.status = 'completed';
    evaluation.completedDate = new Date();
    
    await evaluation.save();
    
    console.log('✅ Evaluation submitted:', evaluation._id);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: evaluation
    });
  } catch (error) {
    console.error('❌ Submit evaluation error:', error);
    
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

// @desc    Get evaluation by ID
// @route   GET /api/evaluations/:id
// @access  Admin, Evaluator (assigned), Participant (own)
const getEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluation = await Evaluation.findById(id)
      .populate('participant', 'username email')
      .populate('evaluator', 'username email');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }
    
    // Check authorization
    const isAdmin = req.user.role === 'admin';
    const isAssignedEvaluator = evaluation.evaluator._id.toString() === req.user._id.toString();
    const isParticipant = evaluation.participant._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAssignedEvaluator && !isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this evaluation'
      });
    }
    
    // Get batch and technology details
    const batch = await Batch.findOne({ batchId: evaluation.batch });
    const tech = await Technology.findOne({ technologyId: evaluation.technology });
    
    res.status(200).json({
      success: true,
      data: {
        ...evaluation.toObject(),
        batchDetails: batch ? {
          batchId: batch.batchId,
          name: batch.name
        } : null,
        technologyDetails: tech ? {
          technologyId: tech.technologyId,
          name: tech.name,
          evaluationCriteria: tech.evaluationCriteria.filter(c => c.roundNumber === evaluation.round)
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Get evaluation by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all evaluations (Admin)
// @route   GET /api/evaluations
// @access  Admin
const getAllEvaluations = async (req, res) => {
  try {
    const { batch, technology, status, round } = req.query;
    
    const filter = {};
    if (batch) filter.batch = batch;
    if (technology) filter.technology = technology;
    if (status) filter.status = status;
    if (round) filter.round = parseInt(round);
    
    const evaluations = await Evaluation.find(filter)
      .populate('participant', 'username email')
      .populate('evaluator', 'username email')
      .sort({ assignedDate: -1 });
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    console.error('❌ Get all evaluations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get evaluations for a specific batch
// @route   GET /api/evaluations/batch/:batchId
// @access  Admin
const getBatchEvaluations = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { round, status } = req.query;
    
    const filter = { batch: batchId };
    if (round) filter.round = parseInt(round);
    if (status) filter.status = status;
    
    const evaluations = await Evaluation.find(filter)
      .populate('participant', 'username email')
      .populate('evaluator', 'username email')
      .sort({ round: 1, participant: 1 });
    
    // Get batch and technology details
    const batch = await Batch.findOne({ batchId });
    const tech = batch ? await Technology.findOne({ technologyId: batch.technology }) : null;
    
    res.status(200).json({
      success: true,
      count: evaluations.length,
      batchDetails: batch ? {
        batchId: batch.batchId,
        name: batch.name,
        technology: batch.technology
      } : null,
      technologyDetails: tech ? {
        technologyId: tech.technologyId,
        name: tech.name,
        rounds: tech.rounds
      } : null,
      data: evaluations
    });
  } catch (error) {
    console.error('❌ Get batch evaluations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get participant's evaluations
// @route   GET /api/evaluations/participant/:participantId
// @access  Admin, Participant (own)
const getParticipantEvaluations = async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Check authorization
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = participantId === req.user._id.toString();
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these evaluations'
      });
    }
    
    const evaluations = await Evaluation.find({ participant: participantId })
      .populate('evaluator', 'username email')
      .sort({ round: 1, assignedDate: -1 });
    
    // Get batch and technology details for each evaluation
    const evaluationsWithDetails = await Promise.all(
      evaluations.map(async (evaluation) => {
        const batch = await Batch.findOne({ batchId: evaluation.batch });
        const tech = await Technology.findOne({ technologyId: evaluation.technology });
        
        return {
          ...evaluation.toObject(),
          batchDetails: batch ? {
            batchId: batch.batchId,
            name: batch.name
          } : null,
          technologyDetails: tech ? {
            technologyId: tech.technologyId,
            name: tech.name
          } : null
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: evaluationsWithDetails.length,
      data: evaluationsWithDetails
    });
  } catch (error) {
    console.error('❌ Get participant evaluations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete evaluation assignment
// @route   DELETE /api/evaluations/:id
// @access  Admin
const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluation = await Evaluation.findById(id);
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }
    
    // Prevent deletion of completed evaluations
    if (evaluation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed evaluation'
      });
    }
    
    await evaluation.deleteOne();
    
    console.log('✅ Evaluation deleted:', evaluation._id);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete evaluation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  assignEvaluation,
  getMyEvaluations,
  submitEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getBatchEvaluations,
  getParticipantEvaluations,
  deleteEvaluation
};