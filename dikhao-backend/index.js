require('dotenv').config();
const express = require('express');
const cors = require('cors');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use('/api/waitlist', waitlistRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dikhao backend running on port ${PORT}`));
