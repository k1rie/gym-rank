const pool = require('../config/database');

const exerciseController = {
  // Rutas públicas - solo ejercicios aprobados
  getAllExercises: async (req, res) => {
    try {
      const [exercises] = await pool.query(`
        SELECT 
          e.*,
          mg.name as muscle_group_name,
          JSON_ARRAYAGG(m.name) as muscles,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 0) as dislikes
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        LEFT JOIN exercise_muscle em ON e.id = em.exercise_id
        LEFT JOIN muscles m ON em.muscle_id = m.id
        WHERE e.approved = 1
        GROUP BY e.id
        ORDER BY e.name
      `);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas públicas - solo ejercicios aprobados
  getExerciseById: async (req, res) => {
    try {
      const [exercises] = await pool.query(`
        SELECT 
          e.*,
          mg.name as muscle_group_name,
          JSON_ARRAYAGG(m.name) as muscles,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 0) as dislikes
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        LEFT JOIN exercise_muscle em ON e.id = em.exercise_id
        LEFT JOIN muscles m ON em.muscle_id = m.id
        WHERE e.id = ? AND e.approved = 1
        GROUP BY e.id
      `, [req.params.id]);

      if (exercises.length === 0) {
        return res.status(404).json({ message: 'Exercise not found' });
      }

      res.json(exercises[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas públicas - solo ejercicios aprobados
  getExercisesByMuscleGroup: async (req, res) => {
    try {
      const [exercises] = await pool.query(`
        SELECT 
          e.*,
          mg.name as muscle_group_name,
          JSON_ARRAYAGG(m.name) as muscles,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 0) as dislikes
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        LEFT JOIN exercise_muscle em ON e.id = em.exercise_id
        LEFT JOIN muscles m ON em.muscle_id = m.id
        WHERE mg.id = ? AND e.approved = 1
        GROUP BY e.id
        ORDER BY e.name
      `, [req.params.muscleGroupId]);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas públicas - solo ejercicios aprobados
  searchExercisesByName: async (req, res) => {
    try {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
      }

      const [exercises] = await pool.query(`
        SELECT 
          e.*,
          mg.name as muscle_group_name,
          JSON_ARRAYAGG(m.name) as muscles,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 0) as dislikes
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        LEFT JOIN exercise_muscle em ON e.id = em.exercise_id
        LEFT JOIN muscles m ON em.muscle_id = m.id
        WHERE e.name LIKE ? AND e.approved = 1
        GROUP BY e.id
        ORDER BY e.name
      `, [`%${name}%`]);

      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas públicas - solo ejercicios aprobados
  getExerciseStats: async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(CASE WHEN is_like = 1 THEN 1 END) as likes,
          COUNT(CASE WHEN is_like = 0 THEN 1 END) as dislikes
        FROM likes_dislikes
        WHERE exercise_id = ? AND EXISTS (
          SELECT 1 FROM exercises WHERE id = ? AND approved = 1
        )
      `, [req.params.id, req.params.id]);

      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas de administración - incluyen ejercicios no aprobados
  getAllExercisesAdmin: async (req, res) => {
    try {
      const [exercises] = await pool.query(`
        SELECT 
          e.*,
          mg.name as muscle_group_name,
          JSON_ARRAYAGG(m.name) as muscles,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 1) as likes,
          (SELECT COUNT(*) FROM likes_dislikes WHERE exercise_id = e.id AND is_like = 0) as dislikes
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        LEFT JOIN exercise_muscle em ON e.id = em.exercise_id
        LEFT JOIN muscles m ON em.muscle_id = m.id
        GROUP BY e.id
        ORDER BY e.approved DESC, e.name
      `);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas de administración
  createExercise: async (req, res) => {
    try {
      const { name, description, video_link, difficulty, muscle_group_id, muscle_ids } = req.body;
      
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        const [result] = await connection.query(
          'INSERT INTO exercises (name, description, video_link, difficulty, muscle_group_id, approved) VALUES (?, ?, ?, ?, ?, FALSE)',
          [name, description, video_link, difficulty, muscle_group_id]
        );

        const exerciseId = result.insertId;

        if (muscle_ids && muscle_ids.length > 0) {
          const values = muscle_ids.map(muscleId => [exerciseId, muscleId]);
          await connection.query(
            'INSERT INTO exercise_muscle (exercise_id, muscle_id) VALUES ?',
            [values]
          );
        }

        await connection.commit();
        res.status(201).json({ 
          id: exerciseId, 
          ...req.body,
          approved: false 
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas de administración
  updateExercise: async (req, res) => {
    try {
      const { name, description, muscle_group, rank } = req.body;
      const [result] = await pool.query(
        'UPDATE exercises SET name = ?, description = ?, muscle_group = ?, rank = ? WHERE id = ?',
        [name, description, muscle_group, rank, req.params.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Exercise not found' });
      }
      res.json({ id: req.params.id, ...req.body });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas de administración
  deleteExercise: async (req, res) => {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // First delete related records
        await connection.query('DELETE FROM likes_dislikes WHERE exercise_id = ?', [req.params.id]);
        await connection.query('DELETE FROM exercise_muscle WHERE exercise_id = ?', [req.params.id]);
        
        // Then delete the exercise
        const [result] = await connection.query('DELETE FROM exercises WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'Exercise not found' });
        }

        await connection.commit();
        res.json({ message: 'Exercise deleted successfully' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas de administración
  approveExercise: async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.query(
        'UPDATE exercises SET approved = TRUE WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Exercise not found' });
      }
      
      res.json({ message: 'Exercise approved successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Rutas públicas - solo ejercicios aprobados
  addReaction: async (req, res) => {
    try {
      const { exercise_id, is_like } = req.body;
      
      // Verificar que el ejercicio existe y está aprobado
      const [exercise] = await pool.query(
        'SELECT id FROM exercises WHERE id = ? AND approved = 1',
        [exercise_id]
      );

      if (exercise.length === 0) {
        return res.status(404).json({ message: 'Exercise not found or not approved' });
      }
      
      const [result] = await pool.query(
        'INSERT INTO likes_dislikes (exercise_id, is_like) VALUES (?, ?)',
        [exercise_id, is_like]
      );

      res.status(201).json({ 
        message: is_like ? 'Like added successfully' : 'Dislike added successfully',
        id: result.insertId 
      });
    } catch (error) {
      console.error('Error in addReaction:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = exerciseController; 