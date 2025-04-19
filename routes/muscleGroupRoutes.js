const express = require('express');
const router = express.Router();
const muscleGroupController = require('../controllers/muscleGroupController');

// Muscle group routes
router.get('/muscle-groups', muscleGroupController.getAllMuscleGroups);

// Muscle routes
router.get('/muscles', muscleGroupController.getAllMuscles);

module.exports = router; 