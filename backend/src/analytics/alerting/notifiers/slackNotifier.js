/**
 * Slack Alert Notifier
 * Sends structured Block Kit messages to a configured Slack webhook.
 */

import axios from 'axios';

const SEVERITY_ICONS = {
  INFO: ':information_source:',
  WARNING: ':warning:',
  CRITICAL: ':rotating_light:',
};

const SEVERITY_COLORS = {
  INFO: '#2196F3',
  WARNING: '#FF9800',
  CRITICAL: '#F44336',
};

export async function sendAlertSlack(alert) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[SlackNotifier] SLACK_WEBHOOK_URL not set — skipping Slack alert');
    return;
  }

  const {
    severity, type, title, message, metric,
    affectedSystem, timestamp, remediation, dashboardLink, alertId,
  } = alert;

  const icon = SEVERITY_ICONS[severity] || ':warning:';
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.WARNING;

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${icon} ${severity} Alert — ${title}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${message}*` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Type:*\n${type}` },
        { type: 'mrkdwn', text: `*Severity:*\n${severity}` },
        { type: 'mrkdwn', text: `*System:*\n${affectedSystem}` },
        { type: 'mrkdwn', text: `*Time:*\n${new Date(timestamp).toISOString().slice(0, 19)}Z` },
      ],
    },
  ];

  if (metric?.name) {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Current Value:*\n${metric.currentValue}${metric.unit}` },
        { type: 'mrkdwn', text: `*Threshold:*\n${metric.threshold}${metric.unit}` },
      ],
    });
  }

  if (remediation) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Remediation:*\n${remediation}` },
    });
  }

  if (dashboardLink) {
    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: 'View Dashboard' },
        url: dashboardLink,
        style: 'primary',
      }],
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `Alert ID: \`${alertId}\` | Environment: \`${process.env.NODE_ENV || 'production'}\`` },
    ],
  });

  const payload = {
    attachments: [{
      color,
      blocks,
    }],
  };

  await axios.post(webhookUrl, payload, { timeout: 5000 });
  console.log(`[SlackNotifier] Alert sent to Slack: ${title}`);
}
