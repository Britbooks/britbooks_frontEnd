import 'dotenv/config';
import axios from 'axios';

const { UPTIMEROBOT_API_KEY, MONITOR_URL, ALERT_EMAIL } = process.env;

if (!UPTIMEROBOT_API_KEY || !MONITOR_URL || !ALERT_EMAIL) {
  console.error('Missing required env vars: UPTIMEROBOT_API_KEY, MONITOR_URL, ALERT_EMAIL');
  process.exit(1);
}

// Resolve alert contact ID from email
const contactsRes = await axios.post(
  'https://api.uptimerobot.com/v2/getAlertContacts',
  new URLSearchParams({ api_key: UPTIMEROBOT_API_KEY, format: 'json' }),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);

if (contactsRes.data.stat !== 'ok') {
  console.error('Failed to fetch alert contacts:', contactsRes.data.error);
  process.exit(1);
}

const contact = contactsRes.data.alert_contacts.find(
  (c) => c.value.toLowerCase() === ALERT_EMAIL.trim().toLowerCase()
);

if (!contact) {
  console.error(`No alert contact found for ${ALERT_EMAIL}. Add it in UptimeRobot > My Settings > Alert Contacts first.`);
  process.exit(1);
}

// Format: contactID_threshold_recurrence
const alertContactParam = `${contact.id}_0_0`;

const res = await axios.post(
  'https://api.uptimerobot.com/v2/newMonitor',
  new URLSearchParams({
    api_key: UPTIMEROBOT_API_KEY,
    format: 'json',
    type: '1',           // HTTP monitor
    url: MONITOR_URL,
    friendly_name: 'BritBook API',
    interval: '300',     // 5 minutes
    alert_contacts: alertContactParam,
  }),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);

if (res.data.stat === 'ok') {
  console.log('Monitor created. ID:', res.data.monitor.id);
} else {
  console.error('Failed to create monitor:', res.data.error);
  process.exit(1);
}
