# Gym Exercise Ranking Backend

A backend application for ranking gym exercises built with Node.js, Express, and MySQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a MySQL database:
```bash
mysql -u root -p < database.sql
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the database credentials in `.env`

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/exercises` - Get all exercises
- `GET /api/exercises/:id` - Get exercise by ID
- `POST /api/exercises` - Create new exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

## Example Exercise Object

```json
{
  "name": "Bench Press",
  "description": "Classic chest exercise",
  "muscle_group": "Chest",
  "rank": 5
}
``` 