// backend/src/controllers/ReportController.js
const Evaluation = require('../models/Evaluation');
const Batch = require('../models/Batch');
const Technology = require('../models/Technology');
const User = require('../models/User');

// @desc    Generate batch evaluation report
// @route   GET /api/reports/batch/:batchId
// @access  Admin
const generateBatchReport = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Get batch details
    const batch = await Batch.findOne({ batchId }).populate('participants', 'username email');
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }
    
    // Get technology details
    const tech = await Technology.findOne({ technologyId: batch.technology });
    
    // Get all evaluations for this batch
    const evaluations = await Evaluation.find({ batch: batchId })
      .populate('participant', 'username email')
      .populate('evaluator', 'username email')
      .sort({ participant: 1, round: 1 });
    
    // Calculate statistics per participant
    const participantStats = {};
    
    batch.participants.forEach(participant => {
      const participantId = participant._id.toString();
      const participantEvaluations = evaluations.filter(
        e => e.participant._id.toString() === participantId
      );
      
      const completedEvaluations = participantEvaluations.filter(e => e.status === 'completed');
      const totalScore = completedEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0);
      const averageScore = completedEvaluations.length > 0 
        ? (totalScore / completedEvaluations.length).toFixed(2)
        : 0;
      
      participantStats[participantId] = {
        participant: {
          id: participant._id,
          username: participant.username,
          email: participant.email
        },
        totalEvaluations: participantEvaluations.length,
        completedEvaluations: completedEvaluations.length,
        pendingEvaluations: participantEvaluations.length - completedEvaluations.length,
        totalScore,
        averageScore,
        roundScores: {}
      };
      
      // Calculate scores per round
      completedEvaluations.forEach(evaluation => {
        participantStats[participantId].roundScores[`Round ${evaluation.round}`] = evaluation.totalScore;
      });
    });
    
    // Overall batch statistics
    const completedCount = evaluations.filter(e => e.status === 'completed').length;
    const pendingCount = evaluations.filter(e => e.status === 'pending').length;
    const averageBatchScore = completedCount > 0
      ? (evaluations
          .filter(e => e.status === 'completed')
          .reduce((sum, e) => sum + (e.totalScore || 0), 0) / completedCount
        ).toFixed(2)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        batch: {
          batchId: batch.batchId,
          name: batch.name,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status
        },
        technology: tech ? {
          technologyId: tech.technologyId,
          name: tech.name,
          rounds: tech.rounds
        } : null,
        statistics: {
          totalParticipants: batch.participants.length,
          totalEvaluations: evaluations.length,
          completedEvaluations: completedCount,
          pendingEvaluations: pendingCount,
          averageBatchScore,
          completionRate: evaluations.length > 0 
            ? ((completedCount / evaluations.length) * 100).toFixed(2) + '%'
            : '0%'
        },
        participantResults: Object.values(participantStats)
      }
    });
  } catch (error) {
    console.error('❌ Generate batch report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate technology-wise report
// @route   GET /api/reports/technology/:technologyId
// @access  Admin
const generateTechnologyReport = async (req, res) => {
  try {
    const { technologyId } = req.params;
    
    // Get technology details
    const tech = await Technology.findOne({ technologyId });
    if (!tech) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Get all batches for this technology
    const batches = await Batch.find({ technology: technologyId });
    
    // Get all evaluations for this technology
    const evaluations = await Evaluation.find({ technology: technologyId })
      .populate('participant', 'username email')
      .populate('evaluator', 'username email');
    
    // Calculate round-wise statistics
    const roundStats = {};
    for (let round = 1; round <= tech.rounds; round++) {
      const roundEvaluations = evaluations.filter(e => e.round === round && e.status === 'completed');
      const roundTotal = roundEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0);
      const roundAverage = roundEvaluations.length > 0 
        ? (roundTotal / roundEvaluations.length).toFixed(2)
        : 0;
      
      roundStats[`Round ${round}`] = {
        totalEvaluations: roundEvaluations.length,
        averageScore: roundAverage,
        highestScore: roundEvaluations.length > 0 
          ? Math.max(...roundEvaluations.map(e => e.totalScore || 0))
          : 0,
        lowestScore: roundEvaluations.length > 0 
          ? Math.min(...roundEvaluations.map(e => e.totalScore || 0))
          : 0
      };
    }
    
    // Overall statistics
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    const totalScore = completedEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0);
    const averageScore = completedEvaluations.length > 0 
      ? (totalScore / completedEvaluations.length).toFixed(2)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        technology: {
          technologyId: tech.technologyId,
          name: tech.name,
          category: tech.category,
          rounds: tech.rounds
        },
        statistics: {
          totalBatches: batches.length,
          totalEvaluations: evaluations.length,
          completedEvaluations: completedEvaluations.length,
          pendingEvaluations: evaluations.length - completedEvaluations.length,
          averageScore,
          completionRate: evaluations.length > 0 
            ? ((completedEvaluations.length / evaluations.length) * 100).toFixed(2) + '%'
            : '0%'
        },
        roundStatistics: roundStats,
        batches: batches.map(b => ({
          batchId: b.batchId,
          name: b.name,
          status: b.status,
          participantCount: b.participants ? b.participants.length : 0
        }))
      }
    });
  } catch (error) {
    console.error('❌ Generate technology report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate participant performance report
// @route   GET /api/reports/participant/:participantId
// @access  Admin, Participant (own)
const generateParticipantReport = async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Check authorization
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = participantId === req.user._id.toString();
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }
    
    // Get participant details
    const participant = await User.findById(participantId).select('-password');
    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    
    // Get all evaluations for this participant
    const evaluations = await Evaluation.find({ participant: participantId })
      .populate('evaluator', 'username email')
      .sort({ round: 1 });
    
    // Group evaluations by technology and batch
    const performanceByTechnology = {};
    const performanceByBatch = {};
    
    for (const evaluation of evaluations) {
      // By technology
      if (!performanceByTechnology[evaluation.technology]) {
        const tech = await Technology.findOne({ technologyId: evaluation.technology });
        performanceByTechnology[evaluation.technology] = {
          technology: tech ? {
            technologyId: tech.technologyId,
            name: tech.name,
            rounds: tech.rounds
          } : null,
          evaluations: [],
          completedCount: 0,
          pendingCount: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      
      performanceByTechnology[evaluation.technology].evaluations.push({
        round: evaluation.round,
        status: evaluation.status,
        totalScore: evaluation.totalScore,
        evaluator: evaluation.evaluator,
        completedDate: evaluation.completedDate
      });
      
      if (evaluation.status === 'completed') {
        performanceByTechnology[evaluation.technology].completedCount++;
        performanceByTechnology[evaluation.technology].totalScore += evaluation.totalScore || 0;
      } else {
        performanceByTechnology[evaluation.technology].pendingCount++;
      }
      
      // By batch
      if (!performanceByBatch[evaluation.batch]) {
        const batch = await Batch.findOne({ batchId: evaluation.batch });
        performanceByBatch[evaluation.batch] = {
          batch: batch ? {
            batchId: batch.batchId,
            name: batch.name,
            technology: batch.technology
          } : null,
          evaluations: [],
          completedCount: 0,
          pendingCount: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      
      performanceByBatch[evaluation.batch].evaluations.push({
        round: evaluation.round,
        status: evaluation.status,
        totalScore: evaluation.totalScore,
        evaluator: evaluation.evaluator,
        completedDate: evaluation.completedDate
      });
      
      if (evaluation.status === 'completed') {
        performanceByBatch[evaluation.batch].completedCount++;
        performanceByBatch[evaluation.batch].totalScore += evaluation.totalScore || 0;
      } else {
        performanceByBatch[evaluation.batch].pendingCount++;
      }
    }
    
    // Calculate averages
    Object.keys(performanceByTechnology).forEach(techId => {
      const perf = performanceByTechnology[techId];
      perf.averageScore = perf.completedCount > 0 
        ? (perf.totalScore / perf.completedCount).toFixed(2)
        : 0;
    });
    
    Object.keys(performanceByBatch).forEach(batchId => {
      const perf = performanceByBatch[batchId];
      perf.averageScore = perf.completedCount > 0 
        ? (perf.totalScore / perf.completedCount).toFixed(2)
        : 0;
    });
    
    // Overall statistics
    const completedCount = evaluations.filter(e => e.status === 'completed').length;
    const totalScore = evaluations
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.totalScore || 0), 0);
    const overallAverage = completedCount > 0 
      ? (totalScore / completedCount).toFixed(2)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        participant: {
          id: participant._id,
          username: participant.username,
          email: participant.email
        },
        overallStatistics: {
          totalEvaluations: evaluations.length,
          completedEvaluations: completedCount,
          pendingEvaluations: evaluations.length - completedCount,
          overallAverageScore: overallAverage,
          completionRate: evaluations.length > 0 
            ? ((completedCount / evaluations.length) * 100).toFixed(2) + '%'
            : '0%'
        },
        performanceByTechnology: Object.values(performanceByTechnology),
        performanceByBatch: Object.values(performanceByBatch)
      }
    });
  } catch (error) {
    console.error('❌ Generate participant report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate evaluator workload report
// @route   GET /api/reports/evaluator/:evaluatorId
// @access  Admin
const generateEvaluatorReport = async (req, res) => {
  try {
    const { evaluatorId } = req.params;
    
    // Get evaluator details
    const evaluator = await User.findById(evaluatorId).select('-password');
    if (!evaluator) {
      return res.status(404).json({
        success: false,
        message: 'Evaluator not found'
      });
    }
    
    // Get all evaluations assigned to this evaluator
    const evaluations = await Evaluation.find({ evaluator: evaluatorId })
      .populate('participant', 'username email')
      .sort({ assignedDate: -1 });
    
    // Calculate statistics
    const completedCount = evaluations.filter(e => e.status === 'completed').length;
    const pendingCount = evaluations.filter(e => e.status === 'pending').length;
    
    // Group by batch
    const batchWorkload = {};
    for (const evaluation of evaluations) {
      if (!batchWorkload[evaluation.batch]) {
        const batch = await Batch.findOne({ batchId: evaluation.batch });
        batchWorkload[evaluation.batch] = {
          batch: batch ? {
            batchId: batch.batchId,
            name: batch.name
          } : null,
          totalAssigned: 0,
          completed: 0,
          pending: 0
        };
      }
      
      batchWorkload[evaluation.batch].totalAssigned++;
      if (evaluation.status === 'completed') {
        batchWorkload[evaluation.batch].completed++;
      } else {
        batchWorkload[evaluation.batch].pending++;
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        evaluator: {
          id: evaluator._id,
          username: evaluator.username,
          email: evaluator.email
        },
        statistics: {
          totalAssignedEvaluations: evaluations.length,
          completedEvaluations: completedCount,
          pendingEvaluations: pendingCount,
          completionRate: evaluations.length > 0 
            ? ((completedCount / evaluations.length) * 100).toFixed(2) + '%'
            : '0%'
        },
        workloadByBatch: Object.values(batchWorkload),
        recentEvaluations: evaluations.slice(0, 10).map(e => ({
          id: e._id,
          participant: e.participant,
          batch: e.batch,
          round: e.round,
          status: e.status,
          assignedDate: e.assignedDate,
          completedDate: e.completedDate
        }))
      }
    });
  } catch (error) {
    console.error('❌ Generate evaluator report error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get overall system statistics
// @route   GET /api/reports/stats
// @access  Admin
const getSystemStats = async (req, res) => {
  try {
    // Count totals
    const totalBatches = await Batch.countDocuments();
    const activeBatches = await Batch.countDocuments({ status: 'ongoing' });
    const totalTechnologies = await Technology.countDocuments({ isActive: true });
    const totalParticipants = await User.countDocuments({ role: 'student' });
    const totalEvaluators = await User.countDocuments({ role: 'admin' }); // Assuming admins can be evaluators
    const totalEvaluations = await Evaluation.countDocuments();
    const completedEvaluations = await Evaluation.countDocuments({ status: 'completed' });
    const pendingEvaluations = await Evaluation.countDocuments({ status: 'pending' });
    
    res.status(200).json({
      success: true,
      data: {
        batches: {
          total: totalBatches,
          active: activeBatches
        },
        technologies: {
          total: totalTechnologies
        },
        users: {
          participants: totalParticipants,
          evaluators: totalEvaluators
        },
        evaluations: {
          total: totalEvaluations,
          completed: completedEvaluations,
          pending: pendingEvaluations,
          completionRate: totalEvaluations > 0 
            ? ((completedEvaluations / totalEvaluations) * 100).toFixed(2) + '%'
            : '0%'
        }
      }
    });
  } catch (error) {
    console.error('❌ Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  generateBatchReport,
  generateTechnologyReport,
  generateParticipantReport,
  generateEvaluatorReport,
  getSystemStats
};