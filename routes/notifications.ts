import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../server/db.ts';
import { authenticateToken } from './auth.ts';

export const notificationsRouter = express.Router();

/**
 * PRODUCTION TWILIO / BREVO INTEGRATION SNIPPET:
 *
 * import twilio from 'twilio';
 * const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
 *
 * async function sendTwilioSMS(to: string, body: string) {
 *   return await twilioClient.messages.create({
 *     from: process.env.TWILIO_PHONE_NUMBER,
 *     to: to.startsWith('+') ? to : `+91${to}`,
 *     body
 *   });
 * }
 *
 * // OR BREVO (Sendinblue) Transactional SMS API:
 * import * as SibApiV3Sdk from '@sendinblue/client';
 * const transactionalSMS = new SibApiV3Sdk.TransactionalSMSApi();
 * transactionalSMS.setApiKey(SibApiV3Sdk.TransactionalSMSApiApiKeys.apiKey, process.env.BREVO_API_KEY);
 */

/**
 * GET /api/notifications
 * Returns SMS/WhatsApp notification logs
 */
notificationsRouter.get('/', (req: Request, res: Response): void => {
  res.json({ notifications: db.notifications });
});

/**
 * GET /api/notifications/inventory-history
 * Returns inventory audit history for the farmer
 */
notificationsRouter.get('/inventory-history', authenticateToken, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const history = db.inventoryHistory
    .filter(h => h.farmerId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ history });
});

/**
 * POST /api/notifications/test-sms
 * Triggers a manual test SMS dispatch via Twilio / Brevo
 */
notificationsRouter.post('/test-sms', (req: Request, res: Response): void => {
  const { phone, name, message, channel, provider } = req.body;
  const log = db.sendNotification({
    toPhone: phone || '9876543210',
    recipientName: name || 'Marketplace Member',
    channel: channel || 'SMS',
    provider: provider || 'Twilio',
    message: message || 'KisanSetu Gateway Test: Notification active and running.',
  });

  res.json({ message: 'Test message transmitted successfully', log });
});
