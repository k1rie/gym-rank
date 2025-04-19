const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

// Exercise routes
router.get('/', exerciseController.getAllExercises);
router.get('/admin', exerciseController.getAllExercisesAdmin);
router.get('/search', exerciseController.searchExercisesByName);
router.get('/muscle-group/:muscleGroupId', exerciseController.getExercisesByMuscleGroup);
router.get('/:id/stats', exerciseController.getExerciseStats);
router.get('/:id', exerciseController.getExerciseById);
router.post('/', exerciseController.createExercise);
router.post('/reaction', exerciseController.addReaction);
router.put('/:id', exerciseController.updateExercise);
router.put('/:id/approve', exerciseController.approveExercise);
router.delete('/:id', exerciseController.deleteExercise);

module.exports = router; 