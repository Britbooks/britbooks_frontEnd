import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS, Alert, Linking, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '../constants/Colors';

const SUBJECTS = [
  'Order Enquiry',
  'Shipping & Delivery',
  'Returns & Refunds',
  'Product Question',
  'Something Else',
];

const HOURS = [
  { day: 'Mon – Fri',  time: '9:00 am – 6:00 pm', open: true  },
  { day: 'Saturday',   time: '10:00 am – 4:00 pm', open: true  },
  { day: 'Sunday',     time: 'Closed',              open: false },
];

const TRUST = [
  { icon: 'flash-outline'           as const, title: 'Fast Response',   body: 'Replies within one business day — usually much faster.' },
  { icon: 'chatbubbles-outline'     as const, title: 'Human Support',   body: 'Real book lovers, not bots. We genuinely care.'         },
  { icon: 'shield-checkmark-outline'as const, title: 'Order Protected', body: 'No-questions-asked 30-day returns on all orders.'       },
];

const QUICK_LINKS = [
  { label: 'Shipping & Returns', icon: 'cube-outline'          as const },
  { label: 'Return Policy',      icon: 'refresh-outline'       as const },
  { label: 'FAQs',               icon: 'help-circle-outline'   as const },
];

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <Text style={styles.clockText}>Team online · {time} UK</Text>;
}

function SubjectPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function open() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...SUBJECTS], cancelButtonIndex: 0 },
        (i) => { if (i > 0) onChange(SUBJECTS[i - 1]); }
      );
    } else {
      Alert.alert(
        'Select Topic',
        '',
        [
          ...SUBJECTS.map((s) => ({ text: s, onPress: () => onChange(s) })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  }
  return (
    <TouchableOpacity style={styles.subjectBtn} onPress={open} activeOpacity={0.7}>
      <Text style={[styles.subjectText, !value && styles.placeholder]}>
        {value || 'Select a topic…'}
      </Text>
      <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  function update(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit() {
    if (!form.name || !form.email || !form.subject || !form.message) {
      Alert.alert('Missing fields', 'Please fill in all fields before sending.');
      return;
    }
    setSubmitted(true);
  }

  function reset() {
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitted(false);
  }

  const inputStyle = (key: string) => [
    styles.input,
    focused === key && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Dark header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerPill}>
          <Ionicons name="star" size={11} color={Colors.accent} />
          <Text style={styles.headerPillText}>UK-Based Support Team</Text>
        </View>

        <Text style={styles.headerTitle}>
          How can we <Text style={styles.headerTitleAccent}>help you?</Text>
        </Text>
        <Text style={styles.headerSub}>
          Whether it's an order or a title question, we're ready to help.
        </Text>

        <View style={styles.headerBadges}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <LiveClock />
          </View>
          <TouchableOpacity
            style={styles.emailPill}
            onPress={() => Linking.openURL('mailto:customercare@britbooks.co.uk')}
          >
            <Ionicons name="mail-outline" size={13} color={Colors.accent} />
            <Text style={styles.emailPillText}>customercare@britbooks.co.uk</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Contact form card ── */}
        <View style={styles.card}>
          <View style={styles.cardAccentBar} />
          <View style={styles.cardBody}>
            {submitted ? (
              /* Success state */
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={44} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Message received!</Text>
                <Text style={styles.successSub}>
                  Thanks for reaching out. We'll get back to you within one business day.
                </Text>
                <TouchableOpacity style={styles.sendAnotherBtn} onPress={reset}>
                  <Text style={styles.sendAnotherText}>Send another message</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Form */
              <View style={styles.formWrap}>
                <View style={styles.formHeader}>
                  <View>
                    <Text style={styles.formEyebrow}>Send an Enquiry</Text>
                    <Text style={styles.formTitle}>We usually reply within a few hours</Text>
                  </View>
                  <Ionicons name="heart" size={18} color={`${Colors.accent}60`} />
                </View>

                {/* Name + Email row */}
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Your Name</Text>
                    <TextInput
                      style={inputStyle('name')}
                      value={form.name}
                      onChangeText={(v) => update('name', v)}
                      placeholder="Jane Smith"
                      placeholderTextColor={Colors.textMuted}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={inputStyle('email')}
                      value={form.email}
                      onChangeText={(v) => update('email', v)}
                      placeholder="jane@example.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                </View>

                {/* Subject */}
                <View style={styles.field}>
                  <Text style={styles.label}>Subject</Text>
                  <SubjectPicker value={form.subject} onChange={(v) => update('subject', v)} />
                </View>

                {/* Message */}
                <View style={styles.field}>
                  <Text style={styles.label}>Message</Text>
                  <TextInput
                    style={[inputStyle('message'), styles.textArea]}
                    value={form.message}
                    onChangeText={(v) => update('message', v)}
                    placeholder="Tell us how we can help…"
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                  />
                </View>

                <View style={styles.formFooter}>
                  <Text style={styles.privacyNote}>We'll never share your details.</Text>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
                    <Text style={styles.submitBtnText}>Send Message</Text>
                    <Ionicons name="send" size={15} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Support hours card ── */}
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
              </View>
              <Text style={styles.cardSectionLabel}>Support Hours</Text>
            </View>
            <View style={styles.hoursList}>
              {HOURS.map(({ day, time, open }) => (
                <View key={day} style={styles.hourRow}>
                  <View style={styles.hourLeft}>
                    <View style={[styles.hourDot, { backgroundColor: open ? '#10B981' : Colors.border }]} />
                    <Text style={styles.hourDay}>{day}</Text>
                  </View>
                  <Text style={[styles.hourTime, !open && styles.hourTimeClosed]}>{time}</Text>
                </View>
              ))}
            </View>
            <View style={styles.timezoneRow}>
              <Ionicons name="globe-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.timezoneText}>All times GMT / BST</Text>
            </View>
          </View>
        </View>

        {/* ── Quick links card ── */}
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="book-outline" size={18} color={Colors.textMuted} />
              </View>
              <Text style={styles.cardSectionLabel}>Quick Links</Text>
            </View>
            {QUICK_LINKS.map(({ label, icon }, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.quickLink, i < QUICK_LINKS.length - 1 && styles.quickLinkBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.quickLinkLeft}>
                  <Ionicons name={icon} size={16} color={Colors.textSecondary} />
                  <Text style={styles.quickLinkText}>{label}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={Colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Trust strip ── */}
        {TRUST.map(({ icon, title, body }) => (
          <View key={title} style={[styles.card, styles.trustCard]}>
            <View style={styles.trustIconBox}>
              <Ionicons name={icon} size={20} color={Colors.accent} />
            </View>
            <View style={styles.trustContent}>
              <Text style={styles.trustTitle}>{title}</Text>
              <Text style={styles.trustBody}>{body}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  // Header
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    backgroundColor: `${Colors.accent}12`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  headerPillText: { fontSize: 11, fontWeight: '700', color: Colors.accent, letterSpacing: 0.4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, lineHeight: 32 },
  headerTitleAccent: { color: Colors.accent },
  headerSub: { ...Typography.callout, color: 'rgba(255,255,255,0.45)', lineHeight: 20 },
  headerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
  },
  clockText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
    backgroundColor: `${Colors.accent}12`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  emailPillText: { fontSize: 11, color: Colors.accent, fontWeight: '600' },

  // Scroll
  scroll: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  scrollContent: { padding: Spacing.base, gap: Spacing.md },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  cardBody: { padding: Spacing.base, gap: Spacing.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Form
  formWrap: { gap: Spacing.md },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  formEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, lineHeight: 22 },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1, gap: 5 },
  field: { gap: 5 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  subjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  subjectText: { fontSize: 14, color: Colors.text, flex: 1 },
  placeholder: { color: Colors.textMuted },
  textArea: { minHeight: 110, paddingTop: Spacing.md },
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  privacyNote: { ...Typography.caption, color: Colors.textMuted, flex: 1, lineHeight: 16 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Success
  successWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#10B98115',
    borderWidth: 2,
    borderColor: '#10B98130',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  successSub: {
    ...Typography.callout,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  sendAnotherBtn: { marginTop: Spacing.sm },
  sendAnotherText: { fontSize: 13, fontWeight: '700', color: Colors.accent },

  // Hours
  hoursList: { gap: Spacing.sm },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hourLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hourDot: { width: 7, height: 7, borderRadius: Radius.full },
  hourDay: { fontSize: 14, color: Colors.textSecondary },
  hourTime: { fontSize: 14, fontWeight: '700', color: Colors.text },
  hourTimeClosed: { color: Colors.textMuted, fontWeight: '400' },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: Spacing.xs,
  },
  timezoneText: { ...Typography.caption, color: Colors.textMuted },

  // Quick links
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  quickLinkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  quickLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  quickLinkText: { fontSize: 14, fontWeight: '500', color: Colors.text },

  // Trust cards
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  trustIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustContent: { flex: 1, gap: 4 },
  trustTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  trustBody: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
});
