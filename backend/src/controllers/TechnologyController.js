// backend/src/controllers/technologyController.js
const Technology = require('../models/Technology');
const Batch = require('../models/Batch');

// Helper to generate technology ID
const generateTechnologyId = async () => {
  try {
    const lastTech = await Technology.findOne().sort({ technologyId: -1 });
    
    let nextNum = 1;
    if (lastTech && lastTech.technologyId) {
      const match = lastTech.technologyId.match(/TECH(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    return `TECH${String(nextNum).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating technologyId:', error);
    return 'TECH001';
  }
};

// @desc    Create a new technology
// @route   POST /api/technologies
// @access  Admin
const createTechnology = async (req, res) => {
  try {
    const { name, description, category, rounds, evaluationCriteria } = req.body;
    
    // Validate required fields
    if (!name || !rounds) {
      return res.status(400).json({
        success: false,
        message: 'Name and number of rounds are required'
      });
    }
    
    // Check if technology already exists
    const existing = await Technology.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Technology with this name already exists'
      });
    }
    
    // Generate technology ID
    const technologyId = await generateTechnologyId();
    
    // Create technology
    const technology = await Technology.create({
      technologyId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      category: category || 'Other',
      rounds: parseInt(rounds),
      evaluationCriteria: evaluationCriteria || [],
      createdBy: req.user._id
    });
    
    console.log('✅ Technology created:', technology.technologyId);
    
    res.status(201).json({
      success: true,
      message: 'Technology created successfully',
      data: technology
    });
  } catch (error) {
    console.error('❌ Create technology error:', error);
    
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

// @desc    Get all technologies
// @route   GET /api/technologies
// @access  Public
const getAllTechnologies = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const technologies = await Technology.find(filter).sort({ name: 1 });
    
    // Get batch count for each technology
    const techsWithStats = await Promise.all(
      technologies.map(async (tech) => {
        const batchCount = await Batch.countDocuments({
          technology: tech.technologyId
        });
        
        return {
          ...tech.toObject(),
          batchCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: techsWithStats.length,
      data: techsWithStats
    });
  } catch (error) {
    console.error('❌ Get all technologies error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get technology by ID
// @route   GET /api/technologies/:id
// @access  Public
const getTechnologyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const technology = await Technology.findOne({ technologyId: id });
    
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Get batches using this technology
    const batches = await Batch.find({
      technology: technology.technologyId
    }).select('batchId name startDate endDate status');
    
    res.status(200).json({
      success: true,
      data: {
        ...technology.toObject(),
        batches
      }
    });
  } catch (error) {
    console.error('❌ Get technology by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update technology
// @route   PUT /api/technologies/:id
// @access  Admin
const updateTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, rounds, evaluationCriteria, isActive } = req.body;
    
    const technology = await Technology.findOne({ technologyId: id });
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Check if name is being changed and already exists
    if (name && name !== technology.name) {
      const existing = await Technology.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Technology with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) technology.name = name.trim();
    if (description !== undefined) technology.description = description ? description.trim() : '';
    if (category) technology.category = category;
    if (rounds !== undefined) technology.rounds = parseInt(rounds);
    if (evaluationCriteria !== undefined) technology.evaluationCriteria = evaluationCriteria;
    if (isActive !== undefined) technology.isActive = isActive;
    
    await technology.save();
    
    console.log('✅ Technology updated:', technology.technologyId);
    
    res.status(200).json({
      success: true,
      message: 'Technology updated successfully',
      data: technology
    });
  } catch (error) {
    console.error('❌ Update technology error:', error);
    
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

// @desc    Delete technology
// @route   DELETE /api/technologies/:id
// @access  Admin
const deleteTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    
    const technology = await Technology.findOne({ technologyId: id });
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    // Check if there are batches using this technology
    const batchCount = await Batch.countDocuments({
      technology: technology.technologyId
    });
    
    if (batchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete technology with ${batchCount} batch(es). Please deactivate instead.`
      });
    }
    
    await technology.deleteOne();
    
    console.log('✅ Technology deleted:', technology.technologyId);
    
    res.status(200).json({
      success: true,
      message: 'Technology deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete technology error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add or update evaluation criteria for a technology
// @route   PUT /api/technologies/:id/criteria
// @access  Admin
const updateEvaluationCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { evaluationCriteria } = req.body;
    
    if (!evaluationCriteria || !Array.isArray(evaluationCriteria)) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation criteria must be an array'
      });
    }
    
    const technology = await Technology.findOne({ technologyId: id });
    if (!technology) {
      return res.status(404).json({
        success: false,
        message: 'Technology not found'
      });
    }
    
    technology.evaluationCriteria = evaluationCriteria;
    await technology.save();
    
    console.log('✅ Evaluation criteria updated:', technology.technologyId);
    
    res.status(200).json({
      success: true,
      message: 'Evaluation criteria updated successfully',
      data: technology
    });
  } catch (error) {
    console.error('❌ Update criteria error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createTechnology,
  getAllTechnologies,
  getTechnologyById,
  updateTechnology,
  deleteTechnology,
  updateEvaluationCriteria
};