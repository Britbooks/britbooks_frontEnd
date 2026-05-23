/**
 * SMS Alert Notifier
 * Uses Twilio (already in project) to send critical alerts via SMS.
 * Only fires for CRITICAL severity to avoid SMS fatigue.
 */

import twilio from 'twilio';

export async function sendAlertSMS(alert) {
  const { severity, title, message, affectedSystem, timestamp, alertId } = alert;

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.ALERT_PHONE) {
    console.warn('[SMSNotifier] Twilio not configured — skipping SMS alert');
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const body = [
    `🚨 BRITBOOKS ${severity} ALERT`,
    `${title}`,
    `${message}`,
    `System: ${affectedSystem}`,
    `Time: ${new Date(timestamp).toISOString().slice(0, 19)}Z`,
    `ID: ${alertId.slice(0, 8)}`,
  ].join('\n');

  await client.messages.create({
    body: body.slice(0, 1600),    // SMS limit
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.ALERT_PHONE,
  });

  console.log(`[SMSNotifier] Alert SMS sent for: ${title}`);
}
