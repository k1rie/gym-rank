const pool = require('../config/database');

const muscleGroupController = {
  // Get all muscle groups
  getAllMuscleGroups: async (req, res) => {
    try {
      const [muscleGroups] = await pool.query('SELECT * FROM muscle_groups ORDER BY name');
      res.json(muscleGroups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all muscles
  getAllMuscles: async (req, res) => {
    try {
      const [muscles] = await pool.query('SELECT * FROM muscles ORDER BY name');
      res.json(muscles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = muscleGroupController; 