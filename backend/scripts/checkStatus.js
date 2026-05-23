import 'dotenv/config';
import axios from 'axios';

const { UPTIMEROBOT_API_KEY } = process.env;

if (!UPTIMEROBOT_API_KEY) {
  console.error('Missing required env var: UPTIMEROBOT_API_KEY');
  process.exit(1);
}

const STATUS_LABELS = { 0: 'paused', 1: 'not checked yet', 2: 'up', 8: 'seems down', 9: 'down' };

const res = await axios.post(
  'https://api.uptimerobot.com/v2/getMonitors',
  new URLSearchParams({
    api_key: UPTIMEROBOT_API_KEY,
    format: 'json',
    custom_uptime_ratios: '7',
  }),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);

if (res.data.stat !== 'ok') {
  console.error('Failed to fetch monitors:', res.data.error);
  process.exit(1);
}

for (const m of res.data.monitors) {
  const status = STATUS_LABELS[m.status] ?? `unknown (${m.status})`;
  const uptime = m.custom_uptime_ratio ?? 'N/A';
  console.log(`${m.friendly_name} | status: ${status} | uptime (7d): ${uptime}%`);
}
