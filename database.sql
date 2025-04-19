CREATE DATABASE IF NOT EXISTS gym_ranking;
USE gym_ranking;

CREATE TABLE IF NOT EXISTS muscle_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS muscles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  muscle_group_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups(id)
);

CREATE TABLE IF NOT EXISTS difficulty_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  muscle_group_id INT NOT NULL,
  difficulty_level_id INT NOT NULL,
  rank INT DEFAULT 0,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups(id),
  FOREIGN KEY (difficulty_level_id) REFERENCES difficulty_levels(id)
);

-- Insert default difficulty levels
INSERT INTO difficulty_levels (name, description) VALUES
('Principiante', 'Ejercicios básicos para principiantes'),
('Intermedio', 'Ejercicios para personas con experiencia'),
('Avanzado', 'Ejercicios para personas con gran experiencia');

-- Insert default muscle groups
INSERT INTO muscle_groups (name, description) VALUES
('Pecho', 'Músculos del pecho'),
('Espalda', 'Músculos de la espalda'),
('Piernas', 'Músculos de las piernas'),
('Hombros', 'Músculos de los hombros'),
('Brazos', 'Músculos de los brazos'),
('Abdomen', 'Músculos del abdomen');

-- Insert default muscles
INSERT INTO muscles (name, description, muscle_group_id) VALUES
-- Pecho
('Pectoral Mayor', 'Músculo principal del pecho', 1),
('Pectoral Menor', 'Músculo profundo del pecho', 1),
('Serrato Anterior', 'Músculo lateral del pecho', 1),
-- Espalda
('Dorsal Ancho', 'Músculo más grande de la espalda', 2),
('Trapecio', 'Músculo superior de la espalda', 2),
('Romboides', 'Músculos entre los omóplatos', 2),
-- Piernas
('Cuádriceps', 'Músculos frontales del muslo', 3),
('Isquiotibiales', 'Músculos posteriores del muslo', 3),
('Glúteos', 'Músculos de los glúteos', 3),
-- Hombros
('Deltoides', 'Músculo principal del hombro', 4),
('Supraespinoso', 'Músculo del manguito rotador', 4),
('Infraespinoso', 'Músculo del manguito rotador', 4),
-- Brazos
('Bíceps', 'Músculo frontal del brazo', 5),
('Tríceps', 'Músculo posterior del brazo', 5),
('Antebrazo', 'Músculos del antebrazo', 5),
-- Abdomen
('Recto Abdominal', 'Músculo frontal del abdomen', 6),
('Oblicuos', 'Músculos laterales del abdomen', 6),
('Transverso', 'Músculo profundo del abdomen', 6); 