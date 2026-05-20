// backend/src/controllers/profileController.js
const Trainer = require('../models/Trainer');
const Subject = require('../models/Subject');
const User = require('../models/User');

// Helper function to generate empId
const generateEmpId = async () => {
  try {
    const lastTrainer = await Trainer.findOne().sort({ empId: -1 });
    
    let nextNum = 1;
    if (lastTrainer && lastTrainer.empId) {
      const match = lastTrainer.empId.match(/EMP(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    return `EMP${String(nextNum).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating empId:', error);
    return 'EMP001';
  }
};

// Validation helper function
const validateProfileData = (data) => {
  const errors = {};

  // Validate Name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters long';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(data.name.trim())) {
    errors.name = 'Name can only contain letters and spaces';
  }

  // Validate Phone
  if (!data.phone || !data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^[6-9]\d{9}$/.test(data.phone.trim())) {
    errors.phone = 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9';
  }

  // Validate Subjects (REQUIRED)
  if (!data.subjects || data.subjects.length === 0) {
    errors.subjects = 'At least one subject must be assigned';
  }

  // Validate Experience (REQUIRED and must be >= 1)
  if (data.experience === undefined || data.experience === null || data.experience === '') {
    errors.experience = 'Experience is required';
  } else {
    const exp = parseInt(data.experience);
    if (isNaN(exp)) {
      errors.experience = 'Experience must be a number';
    } else if (exp < 1) {
      errors.experience = 'Experience must be at least 1 year';
    } else if (exp > 50) {
      errors.experience = 'Experience cannot exceed 50 years';
    } else if (!Number.isInteger(exp)) {
      errors.experience = 'Experience must be a whole number';
    }
  }

  return errors;
};

// @desc    Get my trainer profile
// @route   GET /profile/me
const getMyProfile = async (req, res) => {
  try {
    let trainer = await Trainer.findOne({ createdBy: req.user._id });
    
    if (!trainer && req.user.email) {
      trainer = await Trainer.findOne({ email: req.user.email });
    }

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: trainer
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Create my trainer profile
// @route   POST /profile
const createMyProfile = async (req, res) => {
  try {
    const { name, phone, subjects, experience } = req.body;
    
    const userEmail = req.user.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email not found in authentication'
      });
    }

    // Validate input data
    const validationErrors = validateProfileData(req.body);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if user already has a trainer profile
    const existingByUser = await Trainer.findOne({ createdBy: req.user._id });
    if (existingByUser) {
      return res.status(400).json({
        success: false,
        message: 'You already have a trainer profile. Use update instead.'
      });
    }

    // Check if email already exists in trainer profiles
    const existingByEmail = await Trainer.findOne({ email: userEmail });
    if (existingByEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'Trainer profile with this email already exists' 
      });
    }

    // Generate empId automatically
    const empId = await generateEmpId();

    // Create new trainer profile
    const trainer = await Trainer.create({
      empId,
      name: name.trim(),
      email: userEmail,
      phone: phone.trim(),
      subjects: subjects || [],
      experience: parseInt(experience),
      createdBy: req.user._id
    });

    // Update subjects with this trainer's empId
    if (trainer.subjects && trainer.subjects.length > 0) {
      await Subject.updateMany(
        { subjectId: { $in: trainer.subjects } },
        { $addToSet: { trainers: trainer.empId } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Trainer profile created successfully',
      data: trainer
    });
  } catch (error) {
    console.error('Create profile error:', error);

    // Handle mongoose validation errors
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

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create profile'
    });
  }
};

// @desc    Update my trainer profile
// @route   PUT /profile
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, subjects, experience } = req.body;

    // Validate input data
    const validationErrors = validateProfileData(req.body);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const trainer = await Trainer.findOne({ createdBy: req.user._id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found. Please create one first.'
      });
    }

    // Store old subjects for cleanup
    const oldSubjects = trainer.subjects || [];

    // Update trainer fields
    if (name) trainer.name = name.trim();
    if (phone !== undefined) trainer.phone = phone.trim();
    if (experience !== undefined) trainer.experience = parseInt(experience);
    if (subjects !== undefined) trainer.subjects = subjects;

    await trainer.save();

    // Update subjects
    if (subjects !== undefined) {
      const newSubjects = subjects || [];
      const empId = trainer.empId;

      // Remove trainer from old subjects
      const subjectsToRemove = oldSubjects.filter(s => !newSubjects.includes(s));
      if (subjectsToRemove.length > 0) {
        await Subject.updateMany(
          { subjectId: { $in: subjectsToRemove } },
          { $pull: { trainers: empId } }
        );
      }

      // Add trainer to new subjects
      const subjectsToAdd = newSubjects.filter(s => !oldSubjects.includes(s));
      if (subjectsToAdd.length > 0) {
        await Subject.updateMany(
          { subjectId: { $in: subjectsToAdd } },
          { $addToSet: { trainers: empId } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Trainer profile updated successfully',
      data: trainer
    });
  } catch (error) {
    console.error('Update profile error:', error);

    // Handle mongoose validation errors
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

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
};

// @desc    Delete my trainer profile
// @route   DELETE /profile
const deleteMyProfile = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ createdBy: req.user._id });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer profile not found'
      });
    }

    // Remove trainer from all subjects
    await Subject.updateMany(
      { trainers: trainer.empId },
      { $pull: { trainers: trainer.empId } }
    );

    await trainer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trainer profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  deleteMyProfile
};