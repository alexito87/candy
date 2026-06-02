import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { currentUser } from './middleware/currentUser.js';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());
app.use(morgan('dev'));
app.use(currentUser);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);
app.use(errorHandler);
