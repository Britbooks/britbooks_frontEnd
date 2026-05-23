/**
 * Record of Processing Activities (ROPA) Logger
 * UK GDPR Article 30 — maintained by the controller
 *
 * Documents every data processing activity with:
 * - Purpose, legal basis, data categories
 * - Data subjects, recipients
 * - Retention periods
 * - Cross-border transfer safeguards
 * - Technical/organisational security measures
 */

import mongoose from 'mongoose';

// ─── ROPA Schema ──────────────────────────────────────────────────────────────

const ropaSchema = new mongoose.Schema({
  activityId: { type: String, unique: true },
  name: { type: String, required: true },
  description: String,
  controller: {
    name: String,
    address: String,
    contactEmail: String,
    dpoEmail: String,
    icoRegistrationNumber: String,
  },
  purposes: [String],
  legalBasis: {
    type: String,
    enum: ['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS'],
  },
  legitimateInterestAssessment: String,    // Required when legalBasis is LEGITIMATE_INTERESTS
  dataCategories: [String],
  specialCategories: [String],             // Art. 9 special categories (health, biometric, etc.)
  dataSubjects: [String],                  // e.g. ['customers', 'staff', 'website_visitors']
  recipients: [{
    name: String,
    category: String,
    country: String,
    safeguards: String,                    // e.g. 'SCCs', 'Adequacy Decision'
    isThirdCountry: Boolean,
  }],
  processors: [{
    name: String,
    country: String,
    dataProcessingAgreement: Boolean,
    services: String,
  }],
  retentionPeriod: String,
  retentionReason: String,
  securityMeasures: [String],
  automatedDecisionMaking: Boolean,
  profilingInvolved: Boolean,
  dpiaRequired: Boolean,
  dpiaCompletedAt: Date,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'UNDER_REVIEW'], default: 'ACTIVE' },
  lastReviewedAt: Date,
  nextReviewAt: Date,
}, { timestamps: true });

const ROPAActivity = mongoose.model('ROPAActivity', ropaSchema);

// ─── Built-in Processing Activities ──────────────────────────────────────────

const BUILT_IN_ACTIVITIES = [
  {
    activityId: 'ROPA-001',
    name: 'User Account Management',
    description: 'Processing of personal data to create and manage user accounts',
    purposes: ['Account creation', 'Authentication', 'Profile management'],
    legalBasis: 'CONTRACT',
    dataCategories: ['name', 'email', 'phone_number', 'profile_data'],
    dataSubjects: ['registered_users'],
    retentionPeriod: '7 years after account closure',
    retentionReason: 'UK legal retention requirements',
    securityMeasures: ['AES-256 encryption', 'JWT authentication', 'bcrypt password hashing', 'TLS in transit'],
    automatedDecisionMaking: false,
    profilingInvolved: false,
    dpiaRequired: false,
  },
  {
    activityId: 'ROPA-002',
    name: 'Payment Processing',
    description: 'Processing payment data for marketplace transactions',
    purposes: ['Transaction processing', 'Fraud prevention', 'Financial reporting'],
    legalBasis: 'CONTRACT',
    dataCategories: ['payment_method', 'transaction_amount', 'billing_address'],
    dataSubjects: ['buyers', 'sellers'],
    recipients: [{ name: 'Stripe Inc.', category: 'Payment Processor', country: 'US', safeguards: 'SCCs + Adequacy Decision', isThirdCountry: true }],
    retentionPeriod: '7 years (HMRC requirement)',
    retentionReason: 'Financial regulations / Tax law',
    securityMeasures: ['PCI DSS compliance via Stripe', 'No card data stored locally', 'TLS 1.3'],
    automatedDecisionMaking: false,
    profilingInvolved: false,
    dpiaRequired: false,
  },
  {
    activityId: 'ROPA-003',
    name: 'Analytics & Monitoring',
    description: 'System and application performance monitoring with pseudonymised user data',
    purposes: ['System performance', 'Security monitoring', 'Service improvement'],
    legalBasis: 'LEGITIMATE_INTERESTS',
    legitimateInterestAssessment: 'Necessary for system security and performance; data minimised by pseudonymisation',
    dataCategories: ['pseudonymised_user_id', 'ip_address', 'device_data', 'usage_data'],
    dataSubjects: ['registered_users', 'anonymous_visitors'],
    retentionPeriod: 'Raw data: 30 days; Aggregated: 1 year; Audit logs: 7 years',
    retentionReason: 'UK NIS Regulations 2018 / ICO guidelines',
    securityMeasures: ['Pseudonymisation', 'AES-256 audit log encryption', 'Role-based access'],
    automatedDecisionMaking: false,
    profilingInvolved: false,
    dpiaRequired: false,
  },
  {
    activityId: 'ROPA-004',
    name: 'Marketing Communications',
    description: 'Sending promotional emails and notifications to consenting users',
    purposes: ['Marketing', 'Product updates', 'Promotional offers'],
    legalBasis: 'CONSENT',
    dataCategories: ['email', 'name', 'purchase_history'],
    dataSubjects: ['consenting_users'],
    recipients: [{ name: 'Resend Inc.', category: 'Email Service Provider', country: 'US', safeguards: 'SCCs', isThirdCountry: true }],
    retentionPeriod: 'Until consent withdrawn + 3 years',
    retentionReason: 'Proof of consent / limitation period',
    securityMeasures: ['Consent records kept', 'Opt-out mechanism on every email', 'TLS in transit'],
    automatedDecisionMaking: false,
    profilingInvolved: true,
    dpiaRequired: false,
  },
  {
    activityId: 'ROPA-005',
    name: 'Customer Support',
    description: 'Processing support tickets and chat messages',
    purposes: ['Customer support', 'Complaint resolution'],
    legalBasis: 'CONTRACT',
    dataCategories: ['name', 'email', 'order_data', 'message_content'],
    dataSubjects: ['customers'],
    retentionPeriod: '3 years after ticket closure',
    retentionReason: 'Statute of limitations for disputes',
    securityMeasures: ['Access controls', 'Staff training', 'Audit logging'],
    automatedDecisionMaking: false,
    profilingInvolved: false,
    dpiaRequired: false,
  },
];

// ─── Initialise ROPA ──────────────────────────────────────────────────────────

export async function initROPA() {
  const controllerInfo = {
    name: 'BritBooks Ltd',
    address: 'United Kingdom',
    contactEmail: process.env.ALERT_EMAIL || 'dpo@britbooks.co.uk',
    dpoEmail: process.env.DPO_EMAIL || 'dpo@britbooks.co.uk',
    icoRegistrationNumber: process.env.ICO_REGISTRATION_NUMBER || 'ZxxxxxxX',
  };

  for (const activity of BUILT_IN_ACTIVITIES) {
    await ROPAActivity.findOneAndUpdate(
      { activityId: activity.activityId },
      { $setOnInsert: { ...activity, controller: controllerInfo, lastReviewedAt: new Date() } },
      { upsert: true }
    );
  }

  console.log('[ROPA] Record of Processing Activities initialised');
}

// ─── ROPA Operations ──────────────────────────────────────────────────────────

export async function addROPAActivity(activity) {
  const activityId = activity.activityId || `ROPA-${Date.now()}`;
  return ROPAActivity.create({ ...activity, activityId });
}

export async function getAllROPAActivities() {
  return ROPAActivity.find({ status: 'ACTIVE' }).lean();
}

export async function getROPAActivity(activityId) {
  return ROPAActivity.findOne({ activityId }).lean();
}

export async function updateROPAActivity(activityId, updates) {
  return ROPAActivity.findOneAndUpdate(
    { activityId },
    { $set: { ...updates, lastReviewedAt: new Date() } },
    { new: true }
  );
}

export async function logProcessingEvent({ activityId, description, dataSubjectCount, legalBasis }) {
  const activity = await ROPAActivity.findOne({ activityId });
  if (!activity) {
    console.warn(`[ROPA] Activity ${activityId} not found`);
    return;
  }
  console.log(`[ROPA] Processing event: ${activityId} — ${description} (${dataSubjectCount || 'N/A'} subjects, basis: ${legalBasis})`);
}

export { ROPAActivity };
