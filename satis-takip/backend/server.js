import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import blocksRouter from './routes/blocks.js';
import projectsRouter from './routes/projects.js';
import { errorHandler } from './middleware/errorMiddleware.js';

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/blocks', blocksRouter);
app.use('/api/projects', projectsRouter);

app.use(errorHandler);

app.listen(port, () => console.log(`Server is running on port ${port}`));
