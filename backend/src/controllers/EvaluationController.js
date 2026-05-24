// backend/src/controllers/EvaluationController.js
const Evaluation = require('../models/Evaluation');
const Batch = require('../models/Batch');
const Technology = require('../models/Technology');
const User = require('../models/User');
const Participant = require('../models/Participant');

console.log('✅ EvaluationController loaded');
console.log('   Evaluation model:', typeof Evaluation);
console.log('   Batch model     :', typeof Batch);
console.log('   Technology model:', typeof Technology);
console.log('   User model      :', typeof User);
console.log('   Participant model:', typeof Participant);

const assignEvaluation = async (req, res) => {
  console.log('\n🚀 assignEvaluation() called');
  try {
    const { batchId, participantIds, evaluatorId, round, technology } = req.body;
    console.log('📦 Body received:', { batchId, participantIds, evaluatorId, round, technology });

    if (!batchId || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0 || !evaluatorId || !round || !technology) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, participant IDs (array), evaluator ID, round, and technology are required'
      });
    }

    // --- STEP 1 ---
    console.log('🔍 STEP 1: Batch.findOne({ batchId })...');
    let batch;
    try {
      batch = await Batch.findOne({ batchId });
      console.log('✅ STEP 1 done. batch:', batch ? batch.batchId : 'NOT FOUND');
    } catch (e) {
      console.error('💥 STEP 1 FAILED:', e.message, e.stack);
      return res.status(500).json({ success: false, message: 'STEP1: ' + e.message });
    }
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // --- STEP 2 ---
    console.log('🔍 STEP 2: Technology.findOne({ technologyId })...');
    let tech;
    try {
      tech = await Technology.findOne({ technologyId: technology });
      console.log('✅ STEP 2 done. tech:', tech ? tech.technologyId : 'NOT FOUND');
    } catch (e) {
      console.error('💥 STEP 2 FAILED:', e.message, e.stack);
      return res.status(500).json({ success: false, message: 'STEP2: ' + e.message });
    }
    if (!tech) return res.status(404).json({ success: false, message: 'Technology not found' });

    if (round < 1 || round > tech.rounds) {
      return res.status(400).json({ success: false, message: `Invalid round. Technology ${tech.name} has ${tech.rounds} round(s)` });
    }

    // --- STEP 3 ---
    console.log('🔍 STEP 3: User.findById(evaluatorId)...');
    let evaluator;
    try {
      evaluator = await User.findById(evaluatorId);
      console.log('✅ STEP 3 done. evaluator:', evaluator ? evaluator._id : 'NOT FOUND');
    } catch (e) {
      console.error('💥 STEP 3 FAILED:', e.message, e.stack);
      return res.status(500).json({ success: false, message: 'STEP3: ' + e.message });
    }
    if (!evaluator) return res.status(404).json({ success: false, message: 'Evaluator not found' });

    console.log('📋 batch.participants:', batch.participants);

    const results = { created: [], skipped: [], errors: [] };

    for (const participantId of participantIds) {
      console.log(`\n--- Processing participantId: ${participantId} ---`);
      try {

        // --- STEP A ---
        console.log('  STEP A: Participant.findById...');
        let participant;
        try {
          participant = await Participant.findById(participantId);
          console.log('  ✅ STEP A done:', participant ? participant.name : 'NOT FOUND');
        } catch (e) {
          console.error('  💥 STEP A FAILED:', e.message, e.stack);
          results.errors.push({ participantId, message: 'STEP_A: ' + e.message });
          continue;
        }
        if (!participant) {
          results.errors.push({ participantId, message: 'Participant not found' });
          continue;
        }

        // --- STEP B ---
        console.log('  STEP B: Checking batch membership...');
        console.log('  batch.participants type:', typeof batch.participants, Array.isArray(batch.participants));
        let isInBatch;
        try {
          isInBatch = batch.participants.some(p => {
            console.log(`    comparing p=${p} (type=${typeof p}) with participantId=${participantId}`);
            return p.equals ? p.equals(participantId) : p.toString() === participantId.toString();
          });
          console.log('  ✅ STEP B done. isInBatch:', isInBatch);
        } catch (e) {
          console.error('  💥 STEP B FAILED:', e.message, e.stack);
          results.errors.push({ participantId, message: 'STEP_B: ' + e.message });
          continue;
        }
        if (!isInBatch) {
          results.errors.push({ participantId, message: 'Participant is not in this batch' });
          continue;
        }

        // --- STEP C ---
        console.log('  STEP C: Check existing evaluation...');
        let existingEvaluation;
        try {
          existingEvaluation = await Evaluation.findOne({ batch: batchId, participant: participantId, round, technology });
          console.log('  ✅ STEP C done. existing:', existingEvaluation ? existingEvaluation._id : 'none');
        } catch (e) {
          console.error('  💥 STEP C FAILED:', e.message, e.stack);
          results.errors.push({ participantId, message: 'STEP_C: ' + e.message });
          continue;
        }
        if (existingEvaluation) {
          results.skipped.push({ participantId, participantName: participant.name, message: 'Evaluation already assigned' });
          continue;
        }

        // --- STEP D ---
        console.log('  STEP D: Evaluation.create...');
        let evaluation;
        try {
          evaluation = await Evaluation.create({
            batch: batchId,
            participant: participantId,
            evaluator: evaluatorId,
            technology,
            round,
            assignedBy: req.user._id
          });
          console.log('  ✅ STEP D done. evaluation._id:', evaluation._id);
        } catch (e) {
          console.error('  💥 STEP D FAILED:', e.message, e.stack);
          results.errors.push({ participantId, message: 'STEP_D: ' + e.message });
          continue;
        }

        // --- STEP E ---
        console.log('  STEP E: Populate...');
        let populated;
        try {
          populated = await Evaluation.findById(evaluation._id)
            .populate('participant', 'name email')
            .populate('evaluator', 'name email');
          console.log('  ✅ STEP E done');
        } catch (e) {
          console.error('  💥 STEP E FAILED:', e.message, e.stack);
          // Don't fail — just push unpopulated
          populated = evaluation;
        }

        results.created.push(populated);

      } catch (error) {
        console.error(`  💥 OUTER CATCH for ${participantId}:`, error.message);
        console.error('  💥 STACK:', error.stack);
        results.errors.push({ participantId, message: error.message });
      }
    }

    console.log('\n📊 Final results:', JSON.stringify({ created: results.created.length, skipped: results.skipped.length, errors: results.errors }));

    if (results.created.length === 0 && results.errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Failed to create any evaluations', results });
    }

    res.status(201).json({
      success: true,
      message: `Successfully assigned ${results.created.length} evaluation(s)`,
      results
    });

  } catch (error) {
    console.error('💥 TOP-LEVEL CATCH:', error.message);
    console.error('💥 STACK:', error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyEvaluations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { evaluator: req.user._id };
    if (status) filter.status = status;
    const evaluations = await Evaluation.find(filter)
      .populate('participant', 'name email')
      .populate('evaluator', 'name email')
      .sort({ assignedDate: -1 });
    const evaluationsWithDetails = await Promise.all(evaluations.map(async (evaluation) => {
      const batch = await Batch.findOne({ batchId: evaluation.batch });
      const tech = await Technology.findOne({ technologyId: evaluation.technology });
      return { ...evaluation.toObject(), batchDetails: batch ? { batchId: batch.batchId, name: batch.name, startDate: batch.startDate, endDate: batch.endDate } : null, technologyDetails: tech ? { technologyId: tech.technologyId, name: tech.name, rounds: tech.rounds, evaluationCriteria: tech.evaluationCriteria.filter(c => c.roundNumber === evaluation.round) } : null };
    }));
    res.status(200).json({ success: true, count: evaluationsWithDetails.length, data: evaluationsWithDetails });
  } catch (error) {
    console.error('❌ getMyEvaluations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { scores, feedback, totalScore } = req.body;
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    if (evaluation.evaluator.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (evaluation.status === 'completed') return res.status(400).json({ success: false, message: 'Already submitted' });
    if (!scores || !Array.isArray(scores) || scores.length === 0) return res.status(400).json({ success: false, message: 'Scores are required' });
    evaluation.scores = scores;
    evaluation.feedback = feedback || '';
    evaluation.totalScore = totalScore || scores.reduce((sum, s) => sum + (s.score || 0), 0);
    evaluation.status = 'completed';
    evaluation.completedDate = new Date();
    await evaluation.save();
    res.status(200).json({ success: true, message: 'Evaluation submitted successfully', data: evaluation });
  } catch (error) {
    console.error('❌ submitEvaluation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id).populate('participant', 'name email').populate('evaluator', 'name email');
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    const isAdmin = req.user.role === 'admin';
    const isAssignedEvaluator = evaluation.evaluator._id.toString() === req.user._id.toString();
    const isParticipant = evaluation.participant._id.toString() === req.user._id.toString();
    if (!isAdmin && !isAssignedEvaluator && !isParticipant) return res.status(403).json({ success: false, message: 'Not authorized' });
    const batch = await Batch.findOne({ batchId: evaluation.batch });
    const tech = await Technology.findOne({ technologyId: evaluation.technology });
    res.status(200).json({ success: true, data: { ...evaluation.toObject(), batchDetails: batch ? { batchId: batch.batchId, name: batch.name } : null, technologyDetails: tech ? { technologyId: tech.technologyId, name: tech.name, evaluationCriteria: tech.evaluationCriteria.filter(c => c.roundNumber === evaluation.round) } : null } });
  } catch (error) {
    console.error('❌ getEvaluationById error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllEvaluations = async (req, res) => {
  try {
    const { batch, technology, status, round } = req.query;
    const filter = {};
    if (batch) filter.batch = batch;
    if (technology) filter.technology = technology;
    if (status) filter.status = status;
    if (round) filter.round = parseInt(round);
    const evaluations = await Evaluation.find(filter).populate('participant', 'name email').populate('evaluator', 'name email').sort({ assignedDate: -1 });
    res.status(200).json({ success: true, count: evaluations.length, data: evaluations });
  } catch (error) {
    console.error('❌ getAllEvaluations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBatchEvaluations = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { round, status } = req.query;
    const filter = { batch: batchId };
    if (round) filter.round = parseInt(round);
    if (status) filter.status = status;
    const evaluations = await Evaluation.find(filter).populate('participant', 'name email').populate('evaluator', 'name email').sort({ round: 1, participant: 1 });
    const batch = await Batch.findOne({ batchId });
    const tech = batch ? await Technology.findOne({ technologyId: batch.technology }) : null;
    res.status(200).json({ success: true, count: evaluations.length, batchDetails: batch ? { batchId: batch.batchId, name: batch.name, technology: batch.technology } : null, technologyDetails: tech ? { technologyId: tech.technologyId, name: tech.name, rounds: tech.rounds } : null, data: evaluations });
  } catch (error) {
    console.error('❌ getBatchEvaluations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getParticipantEvaluations = async (req, res) => {
  try {
    const { participantId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = participantId === req.user._id.toString();
    if (!isAdmin && !isOwnProfile) return res.status(403).json({ success: false, message: 'Not authorized' });
    const evaluations = await Evaluation.find({ participant: participantId }).populate('evaluator', 'name email').sort({ round: 1, assignedDate: -1 });
    const evaluationsWithDetails = await Promise.all(evaluations.map(async (evaluation) => {
      const batch = await Batch.findOne({ batchId: evaluation.batch });
      const tech = await Technology.findOne({ technologyId: evaluation.technology });
      return { ...evaluation.toObject(), batchDetails: batch ? { batchId: batch.batchId, name: batch.name } : null, technologyDetails: tech ? { technologyId: tech.technologyId, name: tech.name } : null };
    }));
    res.status(200).json({ success: true, count: evaluationsWithDetails.length, data: evaluationsWithDetails });
  } catch (error) {
    console.error('❌ getParticipantEvaluations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) return res.status(404).json({ success: false, message: 'Evaluation not found' });
    if (evaluation.status === 'completed') return res.status(400).json({ success: false, message: 'Cannot delete completed evaluation' });
    await evaluation.deleteOne();
    res.status(200).json({ success: true, message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('❌ deleteEvaluation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { assignEvaluation, getMyEvaluations, submitEvaluation, getEvaluationById, getAllEvaluations, getBatchEvaluations, getParticipantEvaluations, deleteEvaluation };