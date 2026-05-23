import React, { useRef, useState } from 'react';
import {
  Linking, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ── Palette ───────────────────────────────────────────────────────
const NAVY   = '#0A1628';
const BLUE   = '#2563EB';
const GOLD   = '#C9A84C';

// ── Content data ──────────────────────────────────────────────────
const TOC = [
  { id: 'intro',     label: 'Intro' },
  { id: 'who',       label: 'Who We Are' },
  { id: 'data',      label: 'Data' },
  { id: 'purposes',  label: 'Purposes' },
  { id: 'lawful',    label: 'Lawful Basis' },
  { id: 'sharing',   label: 'Sharing' },
  { id: 'rights',    label: 'Your Rights' },
  { id: 'security',  label: 'Security' },
  { id: 'children',  label: "Children's" },
  { id: 'retention', label: 'Retention' },
  { id: 'cookies',   label: 'Cookies' },
  { id: 'vat',       label: 'VAT' },
  { id: 'changes',   label: 'Changes' },
  { id: 'complaints',label: 'Contact' },
];

const HIGHLIGHTS = [
  { icon: 'ban-outline'            as const, color: '#EF4444', bg: '#FEF2F2', title: 'Zero data selling',   sub: 'We never sell your data to advertisers.' },
  { icon: 'shield-checkmark-outline' as const, color: BLUE,   bg: '#EFF6FF', title: 'UK GDPR compliant',   sub: 'Full compliance with data protection law.' },
  { icon: 'person-circle-outline'  as const, color: '#059669', bg: '#ECFDF5', title: "You're in control",   sub: 'Access, edit or delete your data anytime.' },
];

const DATA_GROUPS = [
  { label: 'Identity',  icon: 'person-outline'         as const, color: BLUE,     items: ['Name', 'Username', 'Date of birth'] },
  { label: 'Contact',   icon: 'mail-outline'            as const, color: '#8B5CF6', items: ['Email', 'Delivery address', 'Phone'] },
  { label: 'Financial', icon: 'card-outline'            as const, color: '#F97316', items: ['Card last 4 digits', 'Transaction IDs'] },
  { label: 'Technical', icon: 'phone-portrait-outline'  as const, color: '#EC4899', items: ['IP address', 'Device type', 'OS'] },
  { label: 'Profile',   icon: 'heart-outline'           as const, color: '#EF4444', items: ['Order history', 'Wishlist', 'Reviews'] },
  { label: 'Usage',     icon: 'eye-outline'             as const, color: '#14B8A6', items: ['Pages viewed', 'Search terms'] },
];

const LAWFUL_BASIS = [
  { label: 'Contract',          art: '6(1)(b)', desc: 'Fulfil orders, delivery, payments & returns.' },
  { label: 'Consent',           art: '6(1)(a)', desc: 'Optional marketing & personalised recommendations.' },
  { label: 'Legal Obligation',  art: '6(1)(c)', desc: 'HMRC VAT records, Consumer Rights Act compliance.' },
  { label: 'Legit. Interests',  art: '6(1)(f)', desc: 'Fraud prevention, security, basic analytics.' },
];

const RIGHTS_LIST = [
  { num: '01', title: 'Access',        desc: 'Request a copy of your data.' },
  { num: '02', title: 'Rectification', desc: 'Correct inaccurate details.' },
  { num: '03', title: 'Erasure',       desc: 'Right to be forgotten.' },
  { num: '04', title: 'Restriction',   desc: 'Limit how we process your data.' },
  { num: '05', title: 'Objection',     desc: 'Object to marketing use.' },
  { num: '06', title: 'Portability',   desc: 'Get your data in a portable format.' },
];

// ── Small helpers ─────────────────────────────────────────────────
function Tag({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[g.tag, { backgroundColor: bg }]}>
      <Text style={[g.tagText, { color }]}>{text}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={g.bullet}>
      <View style={g.bulletDot} />
      <Text style={g.bulletText}>{text}</Text>
    </View>
  );
}

function SectionCard({
  id, num, icon, title, accent = BLUE, children, yRefs,
}: {
  id: string; num: string; icon: keyof typeof Ionicons.glyphMap;
  title: string; accent?: string; children: React.ReactNode;
  yRefs: React.MutableRefObject<Record<string, number>>;
}) {
  return (
    <View
      style={[g.card, { borderTopColor: accent }]}
      onLayout={e => { yRefs.current[id] = e.nativeEvent.layout.y; }}
    >
      <View style={g.cardHead}>
        <View style={[g.cardNumBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[g.cardNum, { color: accent }]}>{num}</Text>
        </View>
        <View style={[g.cardIconCircle, { backgroundColor: accent + '14' }]}>
          <Ionicons name={icon} size={16} color={accent} />
        </View>
        <Text style={g.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────
export default function PrivacyPolicyScreen() {
  const scrollRef  = useRef<ScrollView>(null);
  const tocRef     = useRef<ScrollView>(null);
  const yRefs      = useRef<Record<string, number>>({});
  const [active, setActive] = useState('intro');

  function jumpTo(id: string) {
    setActive(id);
    const y = yRefs.current[id];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: y - 8, animated: true });
  }

  return (
    <SafeAreaView style={g.safe} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={g.topbar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={g.backBtn}>
          <Ionicons name="arrow-back" size={20} color={NAVY} />
        </TouchableOpacity>
        <Text style={g.topbarTitle}>Privacy Policy</Text>
        <View style={g.verBadge}>
          <Text style={g.verText}>v2.1</Text>
        </View>
      </View>

      {/* ── TOC pills ── */}
      <ScrollView
        ref={tocRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={g.toc}
        contentContainerStyle={g.tocInner}
      >
        {TOC.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => jumpTo(t.id)}
            style={[g.tocPill, active === t.id && g.tocPillOn]}
            activeOpacity={0.75}
          >
            <Text style={[g.tocPillText, active === t.id && g.tocPillTextOn]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={g.scroll}
      >
        {/* ── Hero ── */}
        <View style={g.hero}>
          <View style={g.heroGlow} />
          <View style={g.heroShieldWrap}>
            <View style={g.heroShieldOuter}>
              <Ionicons name="shield-checkmark" size={38} color={GOLD} />
            </View>
          </View>
          <Text style={g.heroH1}>Privacy{'\n'}<Text style={g.heroBlue}>is a Right.</Text></Text>
          <Text style={g.heroSub}>
            We collect only what's needed to deliver your books — and never sell your data.
          </Text>
          <View style={g.heroBadgeRow}>
            <Tag text="UK GDPR" color={BLUE} bg="#EFF6FF" />
            <Tag text="Consumer Rights Act" color="#059669" bg="#ECFDF5" />
            <Tag text="Last updated Feb 2026" color="#6B7280" bg="#F3F4F6" />
          </View>
        </View>

        {/* ── 3 highlight cards ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={g.hlScroll}
          contentContainerStyle={g.hlInner}
        >
          {HIGHLIGHTS.map(h => (
            <View key={h.title} style={g.hlCard}>
              <View style={[g.hlIconWrap, { backgroundColor: h.bg }]}>
                <Ionicons name={h.icon} size={22} color={h.color} />
              </View>
              <Text style={g.hlTitle}>{h.title}</Text>
              <Text style={g.hlSub}>{h.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── 1. Introduction ── */}
        <SectionCard id="intro" num="01" icon="information-circle-outline" title="Introduction" yRefs={yRefs}>
          <Text style={g.body}>
            BritBooks Online Ltd ("we", "us") is committed to protecting your privacy under the UK GDPR, Data Protection Act 2018, and PECR. This policy explains how we collect, use, share, and protect your personal data when you use the BritBooks app or purchase books.
          </Text>
          <View style={g.commitGrid}>
            {['Transparent & minimal data use','Strong encryption & security','No data selling to advertisers','Full UK GDPR rights support','Consumer Rights Act compliance','Zero-rated VAT on books'].map(c => (
              <View key={c} style={g.commitRow}>
                <View style={g.greenCheck}><Ionicons name="checkmark" size={10} color="#059669" /></View>
                <Text style={g.commitText}>{c}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* ── 2. Who We Are ── */}
        <SectionCard id="who" num="02" icon="business-outline" title="Who We Are" yRefs={yRefs}>
          <View style={g.infoBox}>
            <Text style={g.infoName}>BritBooks Online Ltd</Text>
            <Text style={g.infoLine}>Company No. 12345678</Text>
            <Text style={g.infoLine}>456 Literary Lane, London EC2A 4AA, UK</Text>
            <Text style={g.infoLine}>VAT: GB 123 4567 89</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:privacy@britbooks.co.uk')}>
              <Text style={g.infoEmail}>privacy@britbooks.co.uk</Text>
            </TouchableOpacity>
            <Text style={g.infoNote}>ICO reference: ZA123456</Text>
          </View>
        </SectionCard>

        {/* ── 3. Data We Collect ── */}
        <SectionCard id="data" num="03" icon="server-outline" title="Data We Collect" yRefs={yRefs}>
          <View style={g.dataGrid}>
            {DATA_GROUPS.map(d => (
              <View key={d.label} style={[g.dataCard, { borderColor: d.color + '30' }]}>
                <View style={[g.dataIconWrap, { backgroundColor: d.color + '14' }]}>
                  <Ionicons name={d.icon} size={18} color={d.color} />
                </View>
                <Text style={g.dataLabel}>{d.label}</Text>
                {d.items.map(i => <Bullet key={i} text={i} />)}
              </View>
            ))}
          </View>
        </SectionCard>

        {/* ── 4. Purposes ── */}
        <SectionCard id="purposes" num="04" icon="eye-outline" title="Why We Process Your Data" yRefs={yRefs}>
          {[
            'Process and deliver your book orders',
            'Manage your account, wishlist & recommendations',
            'Handle payments securely with zero-rated VAT',
            'Process returns & refunds (Consumer Rights Act 2015)',
            'Send essential order updates by email',
            'Send marketing emails — only with your consent',
            'Improve accessibility & recommend age-appropriate books',
            'Comply with HMRC tax & VAT obligations',
          ].map((p, i) => (
            <View key={i} style={g.purposeRow}>
              <View style={[g.purposeNum, { backgroundColor: BLUE + '12' }]}>
                <Text style={[g.purposeNumText, { color: BLUE }]}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={g.purposeText}>{p}</Text>
            </View>
          ))}
        </SectionCard>

        {/* ── 5. Lawful Basis ── */}
        <View
          style={g.darkCard}
          onLayout={e => { yRefs.current['lawful'] = e.nativeEvent.layout.y; }}
        >
          <View style={g.darkGlow} />
          <View style={g.cardHead}>
            <View style={[g.cardNumBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={[g.cardNum, { color: '#93C5FD' }]}>05</Text>
            </View>
            <View style={[g.cardIconCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="scale-outline" size={16} color="#93C5FD" />
            </View>
            <Text style={[g.cardTitle, { color: '#fff' }]}>Lawful Basis</Text>
          </View>
          {LAWFUL_BASIS.map(b => (
            <View key={b.label} style={g.lawfulRow}>
              <View style={g.lawfulLeft}>
                <Text style={g.lawfulLabel}>{b.label}</Text>
                <Text style={g.lawfulDesc}>{b.desc}</Text>
              </View>
              <View style={g.artBadge}>
                <Text style={g.artText}>{b.art}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 6. Sharing ── */}
        <SectionCard id="sharing" num="06" icon="globe-outline" title="Who We Share Data With" yRefs={yRefs}>
          {[
            { icon: 'card-outline' as const,      color: '#8B5CF6', label: 'Stripe',      desc: 'PCI-compliant payment processing' },
            { icon: 'cube-outline' as const,      color: '#3B82F6', label: 'Royal Mail / DPD', desc: 'Name & address for delivery only' },
            { icon: 'mail-outline' as const,      color: '#F97316', label: 'Mailchimp',    desc: 'Consented newsletters only' },
            { icon: 'bar-chart-outline' as const, color: '#14B8A6', label: 'Google',       desc: 'Anonymised analytics' },
            { icon: 'business-outline' as const,  color: '#EF4444', label: 'HMRC',         desc: 'VAT audits & legal obligations' },
          ].map(r => (
            <View key={r.label} style={g.shareRow}>
              <View style={[g.shareIcon, { backgroundColor: r.color + '14' }]}>
                <Ionicons name={r.icon} size={16} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={g.shareLabel}>{r.label}</Text>
                <Text style={g.shareDesc}>{r.desc}</Text>
              </View>
            </View>
          ))}
          <View style={g.neverSellBanner}>
            <Ionicons name="ban-outline" size={16} color="#EF4444" />
            <Text style={g.neverSellText}>We never sell personal data for marketing purposes.</Text>
          </View>
        </SectionCard>

        {/* ── 7. Your Rights ── */}
        <SectionCard id="rights" num="07" icon="shield-checkmark-outline" title="Your UK GDPR Rights" accent="#059669" yRefs={yRefs}>
          <View style={g.rightsGrid}>
            {RIGHTS_LIST.map(r => (
              <View key={r.num} style={g.rightCard}>
                <Text style={g.rightNum}>{r.num}</Text>
                <Text style={g.rightTitle}>{r.title}</Text>
                <Text style={g.rightDesc}>{r.desc}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={g.emailRightsBtn}
            onPress={() => Linking.openURL('mailto:privacy@britbooks.co.uk')}
          >
            <Ionicons name="mail-outline" size={15} color={NAVY} />
            <Text style={g.emailRightsBtnText}>Email us to exercise your rights</Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── 8. Security ── */}
        <SectionCard id="security" num="08" icon="shield-outline" title="How We Protect Your Data" yRefs={yRefs}>
          {[
            { icon: 'lock-closed-outline' as const, text: 'TLS encryption for all traffic in transit' },
            { icon: 'card-outline' as const,         text: 'PCI-DSS compliant payments via Stripe' },
            { icon: 'eye-off-outline' as const,      text: 'Access controls & regular security audits' },
            { icon: 'alert-circle-outline' as const, text: 'Breach reporting to ICO within 72 hours' },
          ].map(s => (
            <View key={s.text} style={g.secRow}>
              <Ionicons name={s.icon} size={16} color={BLUE} />
              <Text style={g.secText}>{s.text}</Text>
            </View>
          ))}
        </SectionCard>

        {/* ── 9. Children's Privacy ── */}
        <SectionCard id="children" num="09" icon="happy-outline" title="Children's Privacy" accent="#F97316" yRefs={yRefs}>
          <Text style={g.body}>
            In compliance with the UK GDPR and the Age Appropriate Design Code (Children's Code):
          </Text>
          <Bullet text="Services not directed at under-13s without parental consent" />
          <Bullet text="Under-18s: high-privacy settings, no marketing profiling" />
          <Bullet text="Data from under-13s deleted immediately if discovered" />
          <Bullet text="Parents can request review or deletion of their child's data" />
        </SectionCard>

        {/* ── 10. Retention ── */}
        <SectionCard id="retention" num="10" icon="time-outline" title="How Long We Keep Data" yRefs={yRefs}>
          {[
            { period: '6 years',  label: 'Orders & account data', sub: 'HMRC VAT & statute of limitations' },
            { period: '2 years',  label: 'Marketing consents',    sub: 'Until withdrawn or inactive' },
            { period: '26 mo.',   label: 'Analytics (anonymised)',sub: 'Google Analytics default' },
            { period: '2 years',  label: 'Support queries',       sub: 'After resolution' },
            { period: 'Instant',  label: 'Age verification data', sub: 'Deleted after successful check' },
          ].map(r => (
            <View key={r.label} style={g.retentionRow}>
              <View style={g.retentionPeriod}>
                <Text style={g.retentionPeriodText}>{r.period}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={g.retentionLabel}>{r.label}</Text>
                <Text style={g.retentionSub}>{r.sub}</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        {/* ── 11. Cookies ── */}
        <SectionCard id="cookies" num="11" icon="lock-closed-outline" title="Cookies & Tracking" yRefs={yRefs}>
          <Text style={g.body}>
            We use essential cookies for app function and analytics cookies with your consent, complying with PECR. We never profile children using cookies without consent.
          </Text>
        </SectionCard>

        {/* ── 12. VAT ── */}
        <SectionCard id="vat" num="12" icon="card-outline" title="VAT & Tax Compliance" accent={GOLD} yRefs={yRefs}>
          <View style={g.vatBanner}>
            <View style={g.vatIcon}><Ionicons name="pricetag-outline" size={18} color={GOLD} /></View>
            <Text style={g.vatBannerText}>Physical books & qualifying e-books are <Text style={g.vatBold}>zero-rated</Text> for UK VAT under HMRC Notice 701/10.</Text>
          </View>
          <Bullet text="Zero VAT on books & e-books (from 1 May 2020)" />
          <Bullet text="Standard VAT on non-qualifying items" />
          <Bullet text="Transaction records kept 6 years for HMRC" />
        </SectionCard>

        {/* ── 13. Changes ── */}
        <SectionCard id="changes" num="13" icon="document-text-outline" title="Changes to This Policy" yRefs={yRefs}>
          <Text style={g.body}>
            We may update this policy to reflect changes in practices or UK regulations. Changes are posted here with the updated date. For significant changes, we notify you by email or in-app notice. Continued use constitutes acceptance.
          </Text>
        </SectionCard>

        {/* ── 14. Complaints ── */}
        <View
          style={g.complaintsCard}
          onLayout={e => { yRefs.current['complaints'] = e.nativeEvent.layout.y; }}
        >
          <View style={g.complaintsIconWrap}>
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text style={g.complaintsTitle}>Have a concern?</Text>
          <Text style={g.complaintsSub}>
            If you're unsatisfied with our response, you have the right to complain to the UK's data protection regulator (ICO).
          </Text>
          <TouchableOpacity
            style={g.icoBtn}
            onPress={() => Linking.openURL('https://ico.org.uk/make-a-complaint')}
          >
            <Ionicons name="open-outline" size={15} color="#fff" />
            <Text style={g.icoBtnText}>Make ICO Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={g.emailBtn}
            onPress={() => Linking.openURL('mailto:privacy@britbooks.co.uk')}
          >
            <Ionicons name="mail-outline" size={15} color={NAVY} />
            <Text style={g.emailBtnText}>privacy@britbooks.co.uk</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const g = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F5F9' },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: NAVY },
  verBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  verText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  // TOC
  toc: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tocInner: { paddingHorizontal: 12, paddingVertical: 10, gap: 6, flexDirection: 'row' },
  tocPill: {
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
  },
  tocPillOn: { backgroundColor: NAVY, borderColor: NAVY },
  tocPillText: { fontSize: 11.5, fontWeight: '600', color: '#64748B' },
  tocPillTextOn: { color: '#fff' },

  scroll: { paddingBottom: 40 },

  // Hero
  hero: {
    backgroundColor: NAVY, padding: 24, paddingTop: 32, paddingBottom: 28,
    gap: 14, overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -80, right: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(37,99,235,0.25)',
  },
  heroShieldWrap: { alignSelf: 'flex-start' },
  heroShieldOuter: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  heroH1: { fontSize: 40, fontWeight: '900', color: '#fff', lineHeight: 46, letterSpacing: -1 },
  heroBlue: { color: '#60A5FA' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 21 },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 11, fontWeight: '700' },

  // Highlights
  hlScroll: { marginTop: 8 },
  hlInner: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, flexDirection: 'row' },
  hlCard: {
    width: 160, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8,
    shadowColor: '#0A1628', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  hlIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hlTitle: { fontSize: 13, fontWeight: '800', color: NAVY },
  hlSub: { fontSize: 11.5, color: '#64748B', lineHeight: 17 },

  // Section card
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 18, padding: 18, gap: 12,
    borderTopWidth: 3, borderTopColor: BLUE,
    shadowColor: '#0A1628', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardNumBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  cardNum: { fontSize: 10, fontWeight: '800' },
  cardIconCircle: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: NAVY, flex: 1 },

  body: { fontSize: 14, color: '#475569', lineHeight: 22 },

  // Bullet
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1', marginTop: 8 },
  bulletText: { fontSize: 13, color: '#475569', lineHeight: 20, flex: 1 },

  // Commitments
  commitGrid: { gap: 8 },
  commitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greenCheck: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  commitText: { fontSize: 13, fontWeight: '600', color: NAVY, flex: 1 },

  // Info box
  infoBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 4,
    borderLeftWidth: 3, borderLeftColor: BLUE,
  },
  infoName: { fontSize: 14, fontWeight: '800', color: NAVY, marginBottom: 2 },
  infoLine: { fontSize: 13, color: '#475569' },
  infoEmail: { fontSize: 13, fontWeight: '700', color: BLUE, marginTop: 4 },
  infoNote: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },

  // Data grid
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dataCard: {
    width: '47%', backgroundColor: '#FAFAFA', borderRadius: 14,
    padding: 12, gap: 6, borderWidth: 1,
  },
  dataIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  dataLabel: { fontSize: 13, fontWeight: '800', color: NAVY, marginBottom: 2 },

  // Purposes
  purposeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  purposeNum: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  purposeNumText: { fontSize: 11, fontWeight: '800' },
  purposeText: { fontSize: 13, color: '#475569', lineHeight: 20, flex: 1 },

  // Dark / lawful basis card
  darkCard: {
    backgroundColor: NAVY, marginHorizontal: 12, marginTop: 10,
    borderRadius: 18, padding: 18, gap: 12, overflow: 'hidden',
  },
  darkGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(37,99,235,0.2)',
  },
  lawfulRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  lawfulLeft: { flex: 1, gap: 3 },
  lawfulLabel: { fontSize: 12, fontWeight: '800', color: '#93C5FD', textTransform: 'uppercase', letterSpacing: 0.4 },
  lawfulDesc: { fontSize: 12.5, color: '#CBD5E1', lineHeight: 18 },
  artBadge: { backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  artText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },

  // Sharing
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shareIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 13, fontWeight: '700', color: NAVY },
  shareDesc: { fontSize: 12, color: '#64748B' },
  neverSellBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  neverSellText: { fontSize: 12.5, color: '#B91C1C', fontWeight: '600', flex: 1 },

  // Rights
  rightsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rightCard: {
    width: '47%', backgroundColor: '#F8FAFC', borderRadius: 14,
    padding: 13, gap: 3, borderWidth: 1, borderColor: '#E2E8F0',
  },
  rightNum: { fontSize: 20, fontWeight: '900', color: '#BBF7D0', lineHeight: 24 },
  rightTitle: { fontSize: 13, fontWeight: '800', color: NAVY },
  rightDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  emailRightsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F1F5F9', borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  emailRightsBtnText: { fontSize: 13, fontWeight: '700', color: NAVY },

  // Security
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secText: { fontSize: 13.5, color: '#334155' },

  // Retention
  retentionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retentionPeriod: {
    backgroundColor: NAVY, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 10, minWidth: 56, alignItems: 'center',
  },
  retentionPeriodText: { fontSize: 11, fontWeight: '800', color: GOLD },
  retentionLabel: { fontSize: 13, fontWeight: '700', color: NAVY },
  retentionSub: { fontSize: 11.5, color: '#64748B' },

  // VAT
  vatBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  vatIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  vatBannerText: { fontSize: 13, color: '#92400E', lineHeight: 19, flex: 1 },
  vatBold: { fontWeight: '800' },

  // Complaints
  complaintsCard: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10,
    borderRadius: 18, padding: 24, alignItems: 'center', gap: 12,
    borderTopWidth: 3, borderTopColor: '#EF4444',
    shadowColor: '#0A1628', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  complaintsIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  complaintsTitle: { fontSize: 20, fontWeight: '900', color: NAVY, textAlign: 'center' },
  complaintsSub: { fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  icoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: NAVY, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 24, width: '100%', justifyContent: 'center',
  },
  icoBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  emailBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingVertical: 12, paddingHorizontal: 24, width: '100%', justifyContent: 'center',
  },
  emailBtnText: { fontSize: 13.5, fontWeight: '700', color: NAVY },
});
