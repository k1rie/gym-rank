const pool = require('../config/database');

const routineController = {
  // Get all routines - solo rutinas aprobadas
  getAllRoutines: async (req, res) => {
    try {
      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        WHERE r.approved = 1
        ORDER BY r.name
      `);
      res.json(routines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get all routines - admin (incluye no aprobadas) con sus ejercicios
  getAllRoutinesAdmin: async (req, res) => {
    try {
      // Obtener todas las rutinas
      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes, r.approved,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        ORDER BY r.approved, r.name
      `);
      
      // Para cada rutina, obtener sus ejercicios
      const routinesWithExercises = await Promise.all(routines.map(async (routine) => {
        const [exercises] = await pool.query(`
          SELECT 
            e.id, e.name, e.description, e.video_link, e.difficulty,
            re.sets, re.exercise_order,
            mg.name as muscle_group_name
          FROM routine_exercise re
          JOIN exercises e ON re.exercise_id = e.id
          LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
          WHERE re.routine_id = ?
          ORDER BY re.exercise_order
        `, [routine.id]);
        
        return {
          ...routine,
          exercises
        };
      }));
      
      res.json(routinesWithExercises);
    } catch (error) {
      console.error('Error en getAllRoutinesAdmin:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get routine by ID with exercises - solo rutinas aprobadas
  getRoutineById: async (req, res) => {
    try {
      // Get the routine details
      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        WHERE r.id = ? AND r.approved = 1
      `, [req.params.id]);

      if (routines.length === 0) {
        return res.status(404).json({ message: 'Routine not found' });
      }

      const routine = routines[0];

      // Get the exercises in this routine
      const [exercises] = await pool.query(`
        SELECT 
          e.id, e.name, e.description, e.video_link, e.difficulty,
          re.sets, re.exercise_order,
          mg.name as muscle_group_name
        FROM routine_exercise re
        JOIN exercises e ON re.exercise_id = e.id
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        WHERE re.routine_id = ?
        ORDER BY re.exercise_order
      `, [req.params.id]);

      // Combine routine with its exercises
      routine.exercises = exercises;

      res.json(routine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get routine by ID with exercises - admin (incluye no aprobadas)
  getRoutineByIdAdmin: async (req, res) => {
    try {
      // Get the routine details
      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes, r.approved,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        WHERE r.id = ?
      `, [req.params.id]);

      if (routines.length === 0) {
        return res.status(404).json({ message: 'Routine not found' });
      }

      const routine = routines[0];

      // Get the exercises in this routine
      const [exercises] = await pool.query(`
        SELECT 
          e.id, e.name, e.description, e.video_link, e.difficulty,
          re.sets, re.exercise_order,
          mg.name as muscle_group_name
        FROM routine_exercise re
        JOIN exercises e ON re.exercise_id = e.id
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        WHERE re.routine_id = ?
        ORDER BY re.exercise_order
      `, [req.params.id]);

      // Combine routine with its exercises
      routine.exercises = exercises;

      res.json(routine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new routine
  createRoutine: async (req, res) => {
    console.log('=== CREATE ROUTINE - Request received ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, difficulty, estimated_time_minutes, exercises } = req.body;

    // Validate required fields
    if (!name || !difficulty || !estimated_time_minutes) {
      console.log('Validation error: Missing required fields');
      return res.status(400).json({ error: 'Name, difficulty, and estimated time are required' });
    }

    // Validate difficulty enum
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validDifficulties.includes(difficulty)) {
      console.log(`Validation error: Invalid difficulty '${difficulty}'`);
      return res.status(400).json({ error: 'Difficulty must be Beginner, Intermediate, or Advanced' });
    }

    console.log('Validation passed, proceeding with database operations');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      console.log('Transaction started');

      // Insert the routine
      console.log('Inserting routine with data:', { name, difficulty, estimated_time_minutes });
      const [result] = await connection.query(
        'INSERT INTO routines (name, difficulty, estimated_time_minutes, approved) VALUES (?, ?, ?, ?)',
        [name, difficulty, estimated_time_minutes, false]
      );

      const routineId = result.insertId;
      console.log(`Routine created with ID: ${routineId}`);

      // Insert exercises if provided
      if (exercises && exercises.length > 0) {
        console.log(`Processing ${exercises.length} exercises for the routine`);
        
        const exerciseValues = exercises.map((exercise, index) => {
          console.log(`Exercise ${index + 1}:`, exercise);
          return [
            routineId,
            exercise.exercise_id,
            exercise.sets,
            index + 1 // exercise_order starts at 1
          ];
        });

        console.log('Inserting exercises into routine_exercise table');
        await connection.query(
          'INSERT INTO routine_exercise (routine_id, exercise_id, sets, exercise_order) VALUES ?',
          [exerciseValues]
        );
        console.log('Exercises inserted successfully');
      } else {
        console.log('No exercises provided for this routine');
      }

      await connection.commit();
      console.log('Transaction committed successfully');

      res.status(201).json({
        id: routineId,
        name,
        difficulty,
        estimated_time_minutes,
        approved: false,
        exercises: exercises || []
      });
    } catch (error) {
      console.error('ERROR in createRoutine:', error.message);
      await connection.rollback();
      console.log('Transaction rolled back due to error');
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
      console.log('Database connection released');
    }
  },

  // Update a routine
  updateRoutine: async (req, res) => {
    const { name, difficulty, estimated_time_minutes, exercises } = req.body;
    const routineId = req.params.id;

    // Validate required fields
    if (!name || !difficulty || !estimated_time_minutes) {
      return res.status(400).json({ error: 'Name, difficulty, and estimated time are required' });
    }

    // Validate difficulty enum
    const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be Beginner, Intermediate, or Advanced' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update routine details
      const [updateResult] = await connection.query(
        'UPDATE routines SET name = ?, difficulty = ?, estimated_time_minutes = ? WHERE id = ?',
        [name, difficulty, estimated_time_minutes, routineId]
      );

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Routine not found' });
      }

      // If exercises are provided, update them
      if (exercises) {
        // Remove existing exercises
        await connection.query('DELETE FROM routine_exercise WHERE routine_id = ?', [routineId]);

        // Add new exercises
        if (exercises.length > 0) {
          const exerciseValues = exercises.map((exercise, index) => [
            routineId,
            exercise.exercise_id,
            exercise.sets,
            index + 1 // exercise_order starts at 1
          ]);

          await connection.query(
            'INSERT INTO routine_exercise (routine_id, exercise_id, sets, exercise_order) VALUES ?',
            [exerciseValues]
          );
        }
      }

      await connection.commit();

      res.json({
        id: parseInt(routineId),
        name,
        difficulty,
        estimated_time_minutes,
        exercises: exercises || []
      });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  // Delete a routine
  deleteRoutine: async (req, res) => {
    const routineId = req.params.id;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete routine exercises first (cascade should handle this, but being explicit)
      await connection.query('DELETE FROM routine_exercise WHERE routine_id = ?', [routineId]);

      // Delete the routine
      const [result] = await connection.query('DELETE FROM routines WHERE id = ?', [routineId]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Routine not found' });
      }

      await connection.commit();
      res.json({ message: 'Routine deleted successfully' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  // Get routines by difficulty - solo rutinas aprobadas
  getRoutinesByDifficulty: async (req, res) => {
    try {
      const { difficulty } = req.params;

      // Validate difficulty enum
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'Difficulty must be Beginner, Intermediate, or Advanced' });
      }

      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        WHERE r.difficulty = ? AND r.approved = 1
        ORDER BY r.name
      `, [difficulty]);

      res.json(routines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Search routines by name - solo rutinas aprobadas
  searchRoutinesByName: async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
      }

      const [routines] = await pool.query(`
        SELECT 
          r.id, r.name, r.difficulty, r.estimated_time_minutes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes_routines WHERE routine_id = r.id AND is_like = 0) as dislikes
        FROM routines r
        WHERE r.name LIKE ? AND r.approved = 1
        ORDER BY r.name
      `, [`%${name}%`]);

      res.json(routines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update exercise order in a routine
  updateExerciseOrder: async (req, res) => {
    const { routineId } = req.params;
    const { exerciseOrders } = req.body;

    // Validate input
    if (!exerciseOrders || !Array.isArray(exerciseOrders)) {
      return res.status(400).json({ error: 'Exercise orders array is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if routine exists
      const [routineCheck] = await connection.query(
        'SELECT id FROM routines WHERE id = ?',
        [routineId]
      );

      if (routineCheck.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Routine not found' });
      }

      // Update each exercise order
      for (const item of exerciseOrders) {
        if (!item.exercise_id || !item.exercise_order) {
          await connection.rollback();
          return res.status(400).json({ error: 'Each item must have exercise_id and exercise_order' });
        }

        await connection.query(
          'UPDATE routine_exercise SET exercise_order = ? WHERE routine_id = ? AND exercise_id = ?',
          [item.exercise_order, routineId, item.exercise_id]
        );
      }

      await connection.commit();
      res.json({ message: 'Exercise order updated successfully' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ error: error.message });
    } finally {
      connection.release();
    }
  },

  // Approve a routine
  approveRoutine: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.query(
        'UPDATE routines SET approved = TRUE WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Routine not found' });
      }
      
      res.json({ message: 'Routine approved successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add reaction (like/dislike) to a routine
  addReactionToRoutine: async (req, res) => {
    try {
      const { routine_id, is_like } = req.body;
      
      // Verificar que la rutina existe y está aprobada
      const [routine] = await pool.query(
        'SELECT id FROM routines WHERE id = ? AND approved = 1',
        [routine_id]
      );

      if (routine.length === 0) {
        return res.status(404).json({ message: 'Routine not found or not approved' });
      }
      
      const [result] = await pool.query(
        'INSERT INTO likes_dislikes_routines (routine_id, is_like) VALUES (?, ?)',
        [routine_id, is_like]
      );

      res.status(201).json({ 
        message: is_like ? 'Like added successfully' : 'Dislike added successfully',
        id: result.insertId 
      });
    } catch (error) {
      console.error('Error in addReactionToRoutine:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = routineController;
