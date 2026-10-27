import express, { Request, Response } from 'express';
import { db } from '../server/db';

export const weatherRouter = express.Router();

/**
 * GET /api/weather
 * Provides harvest weather context and agricultural advisory based on city/location
 */
weatherRouter.get('/', (req: Request, res: Response): void => {
  try {
    const city = (req.query.city as string) || 'Nashik';
    const weather = db.getHarvestWeather(city);
    res.json({ weather });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch weather data' });
  }
});
