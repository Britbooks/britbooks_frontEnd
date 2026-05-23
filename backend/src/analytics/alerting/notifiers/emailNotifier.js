/**
 * Email Alert Notifier
 * Uses nodemailer (already configured in project) to send structured alert emails.
 */

import nodemailer from 'nodemailer';

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const SEVERITY_COLORS = {
  INFO: '#2196F3',
  WARNING: '#FF9800',
  CRITICAL: '#F44336',
};

const SEVERITY_EMOJIS = {
  INFO: 'ℹ️',
  WARNING: '⚠️',
  CRITICAL: '🚨',
};

export async function sendAlertEmail(alert) {
  const {
    severity, type, title, message, metric,
    affectedSystem, timestamp, remediation, dashboardLink, alertId,
  } = alert;

  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.WARNING;
  const emoji = SEVERITY_EMOJIS[severity] || '⚠️';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .card { background: white; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .header { border-left: 4px solid ${color}; padding-left: 16px; margin-bottom: 20px; }
      .badge { display: inline-block; background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
      .metric-box { background: #f8f8f8; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }
      .metric-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 14px; }
      .remediation { background: #fff3e0; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }
      .footer { color: #999; font-size: 11px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px; }
      a.btn { display: inline-block; background: #1976D2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin-top: 16px; }
    </style></head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">${severity}</span>
          <h2 style="margin: 8px 0; color: #333;">${emoji} ${title}</h2>
          <p style="margin: 0; color: #666;">${message}</p>
        </div>

        <div class="metric-box">
          <div class="metric-row"><strong>Type:</strong> <span>${type}</span></div>
          <div class="metric-row"><strong>Affected System:</strong> <span>${affectedSystem}</span></div>
          <div class="metric-row"><strong>Timestamp:</strong> <span>${timestamp}</span></div>
          ${metric?.name ? `<div class="metric-row"><strong>Metric:</strong> <span>${metric.name}: ${metric.currentValue}${metric.unit} (threshold: ${metric.threshold}${metric.unit})</span></div>` : ''}
          <div class="metric-row"><strong>Alert ID:</strong> <span>${alertId}</span></div>
          <div class="metric-row"><strong>Environment:</strong> <span>${process.env.NODE_ENV || 'production'}</span></div>
        </div>

        ${remediation ? `
        <div class="remediation">
          <strong>Suggested Remediation:</strong>
          <p style="margin: 6px 0 0; font-size: 14px;">${remediation}</p>
        </div>` : ''}

        ${dashboardLink ? `<a class="btn" href="${dashboardLink}">View Analytics Dashboard</a>` : ''}

        <div class="footer">
          <p>This is an automated alert from the BritBooks API monitoring system.</p>
          <p>ICO Registration: ${process.env.ICO_REGISTRATION_NUMBER || 'ZxxxxxxX'} | Environment: ${process.env.NODE_ENV || 'production'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `${emoji} [${severity}] BritBooks Alert: ${title}`;

  const transport = getTransport();
  await transport.sendMail({
    from: process.env.FROM_EMAIL || `"BritBooks Monitoring" <${process.env.SMTP_USER}>`,
    to: process.env.ALERT_EMAIL,
    subject,
    html,
    text: `${severity} ALERT\n\n${title}\n${message}\n\nType: ${type}\nSystem: ${affectedSystem}\nTime: ${timestamp}\nRemediation: ${remediation}\nAlert ID: ${alertId}`,
  });
}
