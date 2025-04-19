require('dotenv').config();
const app = require('./config/server');
const exerciseRoutes = require('./routes/exerciseRoutes');
const muscleGroupRoutes = require('./routes/muscleGroupRoutes');
const routineRoutes = require('./routes/routineRoutes');

// Use routes - register muscle group routes first
app.use(muscleGroupRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/routines', routineRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 