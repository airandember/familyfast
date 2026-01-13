import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';

import { authRouter } from './braids/auth/routes.js';
import { familyRouter } from './braids/family/routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { configurePassport } from './braids/auth/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Configure Passport strategies
configurePassport();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/families', familyRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 FamilyFast API running on port ${PORT}`);
});

export default app;
