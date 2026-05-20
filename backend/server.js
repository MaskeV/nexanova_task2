const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/database.js');
const authRoutes = require('./src/routes/authRoute.js');
const batchRoutes = require('./src/routes/batchRoutes.js');
const evaluationRoutes = require('./src/routes/evaluationRoutes.js');
const reportRoutes = require('./src/routes/reportRoutes.js');
const technologyRoutes = require('./src/routes/technologyRoutes.js');
const participantRoutes = require('./src/routes/participantRoutes.js');

dotenv.config();
const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/batches', batchRoutes);
app.use('/evaluations', evaluationRoutes);
app.use('/reports', reportRoutes);
app.use('/technologies', technologyRoutes);
app.use('/participants', participantRoutes);


app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

