require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes      = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const tryonRoutes     = require('./routes/tryon');
const billingRoutes   = require('./routes/billing');
const planRoutes      = require('./routes/plan');
const internalRoutes  = require('./routes/internal');
const viewRoutes      = require('./routes/view');

const app = express();

app.use(cors({ origin: (origin, cb) => cb(null, true) }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth',      authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/tryon',     tryonRoutes);
app.use('/api/billing',   billingRoutes);
app.use('/api/plan',      planRoutes);
app.use('/api/internal',  internalRoutes);
app.use('/view',          viewRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dikhao store backend running on port ${PORT}`));
