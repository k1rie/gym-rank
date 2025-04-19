const express = require('express');
const router = express.Router();
const routineController = require('../controllers/routineController');

// Rutas públicas - solo rutinas aprobadas
router.get('/', routineController.getAllRoutines);
router.get('/search', routineController.searchRoutinesByName);
router.get('/difficulty/:difficulty', routineController.getRoutinesByDifficulty);
router.get('/:id', routineController.getRoutineById);
router.post('/', routineController.createRoutine);
router.post('/reaction', routineController.addReactionToRoutine);

// Rutas de administración
router.get('/admin/all', routineController.getAllRoutinesAdmin);
router.get('/admin/:id', routineController.getRoutineByIdAdmin);
router.put('/:id', routineController.updateRoutine);
router.put('/:id/approve', routineController.approveRoutine);
router.put('/:routineId/exercise-order', routineController.updateExerciseOrder);
router.delete('/:id', routineController.deleteRoutine);

module.exports = router;
