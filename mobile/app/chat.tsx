import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS, ActivityIndicator, Alert, Animated, FlatList, Image,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radius, Spacing, Typography } from '../constants/Colors';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CHAT = '/chat';
const LOGO  = require('../assets/logobritr.png');

type ChatView = 'inbox' | 'new' | 'chat';
interface Thread  { _id: string; subject: string; createdAt: string; }
interface Message {
  _id: string; senderId: string; message: string; createdAt: string;
  status?: string; imageUri?: string;
}

/* ─── Date/time helpers ───────────────────────── */
function fmtTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtInbox(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/* ─── Category detector ───────────────────────── */
interface Cat {
  label: string; icon: keyof typeof Ionicons.glyphMap;
  color: string; bg: string; border: string; dot: string;
  actions?: { label: string; route: string }[];
}
function detectCategory(msg: string): Cat {
  const t = msg.toLowerCase();
  if (t.includes('order') || t.includes('track') || t.includes('purchase'))
    return { label: 'Order Support',       icon: 'cube-outline',              color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', actions: [{ label: 'View My Orders', route: '/orders/' }] };
  if (t.includes('return') || t.includes('refund') || t.includes('exchange'))
    return { label: 'Returns & Refunds',   icon: 'refresh-outline',           color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316', actions: [{ label: 'Return Policy',   route: '/support'  }] };
  if (t.includes('deliver') || t.includes('ship') || t.includes('dispatch'))
    return { label: 'Shipping & Delivery', icon: 'car-outline',               color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981', actions: [{ label: 'Shipping Info',   route: '/support'  }] };
  if (t.includes('payment') || t.includes('pay') || t.includes('card') || t.includes('billing'))
    return { label: 'Payment & Billing',   icon: 'card-outline',              color: '#7E22CE', bg: '#FAF5FF', border: '#DDD6FE', dot: '#8B5CF6', actions: [{ label: 'My Invoices',     route: '/support'  }] };
  if (t.includes('account') || t.includes('password') || t.includes('login'))
    return { label: 'Account & Security',  icon: 'person-circle-outline',     color: '#334155', bg: '#F8FAFC', border: '#CBD5E1', dot: '#64748B', actions: [{ label: 'Account Settings', route: '/(tabs)/account' }] };
  if (t.includes('book') || t.includes('isbn') || t.includes('author'))
    return { label: 'Books & Products',    icon: 'book-outline',              color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', actions: [{ label: 'Explore Books',   route: '/(tabs)/explore' }] };
  if (t.includes('privacy') || t.includes('data') || t.includes('gdpr'))
    return { label: 'Privacy & Security',  icon: 'shield-checkmark-outline',  color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', dot: '#14B8A6' };
  return { label: 'Support', icon: 'help-buoy-outline', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' };
}

const QUICK_REPLIES: Record<string, string[]> = {
  'Order Support':       ['Track my order',    'Order not arrived',       'Cancel order'],
  'Returns & Refunds':   ['Start a return',    'Refund status',           'Exchange item'],
  'Shipping & Delivery': ['Shipping times',    'Track package',           'International delivery'],
  'Payment & Billing':   ['Payment failed',    'Request invoice',         'Update billing'],
  'Account & Security':  ['Reset password',    'Update email',            'Account locked'],
  'Books & Products':    ['Find a book',       'Book condition',          'ISBN lookup'],
  'Support':             ['Talk to an agent',  'View my orders',          'Return policy'],
};

/* ─── Bold text renderer ──────────────────────── */
function BoldText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        i % 2 === 1 ? <Text key={i} style={{ fontWeight: '800', color: '#111827' }}>{p}</Text> : p
      )}
    </Text>
  );
}

/* ─── Status badge ────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = '#FFFBEB', color = '#92400E', border = '#FDE68A', icon: keyof typeof Ionicons.glyphMap = 'time-outline';
  if (s.includes('success') || s.includes('paid') || s.includes('delivered'))
    { bg = '#ECFDF5'; color = '#065F46'; border = '#A7F3D0'; icon = 'checkmark-circle'; }
  else if (s.includes('dispatch') || s.includes('out for'))
    { bg = '#EFF6FF'; color = '#1D4ED8'; border = '#BFDBFE'; icon = 'car-outline'; }
  else if (s.includes('cancel') || s.includes('failed'))
    { bg = '#FEF2F2'; color = '#B91C1C'; border = '#FECACA'; icon = 'close-circle'; }
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[styles.statusBadgeText, { color }]}>{status}</Text>
    </View>
  );
}

/* ─── Pulsing online dot ──────────────────────── */
function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,   duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[styles.onlineDot, { transform: [{ scale }] }]} />;
}

/* ─── Typing indicator ────────────────────────── */
function TypingIndicator() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    function bounce(dot: Animated.Value, delay: number) {
      return Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -5, duration: 260, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0,  duration: 260, useNativeDriver: true }),
        Animated.delay(480),
      ]));
    }
    const a1 = bounce(d1, 0); const a2 = bounce(d2, 160); const a3 = bounce(d3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);
  return (
    <View style={[styles.msgRow, styles.msgRowThem]}>
      <View style={styles.botAvatarWrap}>
        <Image source={LOGO} style={styles.botAvatarImg} />
      </View>
      <View style={styles.typingBubble}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}

/* ─── Message entry animation ─────────────────── */
function AnimatedMsg({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        { scale:      anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      ],
    }}>
      {children}
    </Animated.View>
  );
}

/* ─── Date separator ──────────────────────────── */
function DateSep({ label }: { label: string }) {
  return (
    <View style={styles.dateSepWrap}>
      <View style={styles.dateSepPill}><Text style={styles.dateSepText}>{label}</Text></View>
    </View>
  );
}

/* ─── Bot bubble ──────────────────────────────── */
function BotBubble({ message, time, isLast, onQuickReply }: {
  message: string; time: string; isLast: boolean; onQuickReply: (t: string) => void;
}) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const cat = detectCategory(message);
  const lines = message.split('\n').filter((l) => l.trim());
  const quickReplies = QUICK_REPLIES[cat.label] ?? [];
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.botCard, { borderColor: cat.border }]}>
        <View style={[styles.botCardHead, { backgroundColor: cat.bg, borderBottomColor: cat.border }]}>
          <View style={[styles.botCatIconWrap, { backgroundColor: `${cat.color}18` }]}>
            <Ionicons name={cat.icon} size={13} color={cat.color} />
          </View>
          <Text style={[styles.botCatLabel, { color: cat.color }]}>{cat.label}</Text>
          <View style={styles.botAlex}>
            <Ionicons name="sparkles" size={11} color="#F59E0B" />
            <Text style={styles.botAlexText}>Alex</Text>
          </View>
        </View>
        <View style={styles.botCardBody}>
          {lines.map((line, i) => {
            const num = line.match(/^(\d+)[.)]\s+(.+)/);
            const bul = line.match(/^[•\-*]\s+(.+)/);
            const hasStatus = /\b(delivered|dispatched|cancelled|failed|paid|out for delivery)\b/i.test(line);
            if (num) return (
              <View key={i} style={styles.botLine}>
                <View style={[styles.numBadge, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.numBadgeText, { color: cat.color }]}>{num[1]}</Text>
                </View>
                <BoldText text={num[2]} style={styles.botLineText} />
              </View>
            );
            if (bul) return (
              <View key={i} style={styles.botLine}>
                <View style={[styles.bulletDot, { backgroundColor: cat.dot }]} />
                <BoldText text={bul[1]} style={styles.botLineText} />
              </View>
            );
            if (hasStatus) {
              const sm = line.match(/\b(delivered|dispatched|cancelled|failed|paid|out for delivery)\b/i);
              if (sm) return (
                <View key={i} style={styles.botStatusLine}>
                  <BoldText text={line.replace(sm[0], '')} style={styles.botLineText} />
                  <StatusBadge status={sm[0]} />
                </View>
              );
            }
            return <BoldText key={i} text={line} style={styles.botLineText} />;
          })}
        </View>
        {cat.actions && cat.actions.length > 0 && (
          <View style={[styles.botActions, { backgroundColor: cat.bg, borderTopColor: cat.border }]}>
            {cat.actions.map((a, i) => (
              <TouchableOpacity key={i} style={styles.botActionBtn} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
                <Ionicons name="open-outline" size={12} color={cat.color} />
                <Text style={[styles.botActionText, { color: cat.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.botCardFoot}>
          <View style={styles.botFootLeft}>
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <Text style={styles.botFootSource}>BritBooks AI</Text>
          </View>
          <View style={styles.botFootRight}>
            <Text style={styles.msgTime}>{time}</Text>
            <TouchableOpacity onPress={() => setLiked(liked === true ? null : true)} hitSlop={8}>
              <Ionicons name={liked === true ? 'thumbs-up' : 'thumbs-up-outline'} size={13} color={liked === true ? '#10B981' : Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLiked(liked === false ? null : false)} hitSlop={8}>
              <Ionicons name={liked === false ? 'thumbs-down' : 'thumbs-down-outline'} size={13} color={liked === false ? Colors.error : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {isLast && quickReplies.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickRowContent}>
          {quickReplies.map((r) => (
            <TouchableOpacity key={r} style={styles.quickChip} onPress={() => onQuickReply(r)} activeOpacity={0.75}>
              <Text style={styles.quickChipText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════ */
export default function ChatScreen() {
  const { user } = useAuth();
  const userId = user?.userId;

  const [view,       setView]       = useState<ChatView>('inbox');
  const [threads,    setThreads]    = useState<Thread[]>([]);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [chatId,     setChatId]     = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [isTyping,   setIsTyping]   = useState(false);
  const [input,      setInput]      = useState('');
  const [form,       setForm]       = useState({ subject: '', description: '' });
  const [search,     setSearch]     = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; name: string } | null>(null);

  const listRef = useRef<FlatList>(null);

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`${CHAT}/user/${userId}`);
      const d = res.data?.data || res.data?.threads || res.data || [];
      setThreads(Array.isArray(d) ? d : []);
    } catch { setThreads([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  async function openThread(id: string) {
    setLoading(true); setChatId(id); setView('chat');
    try {
      const res = await apiClient.get(`${CHAT}/${id}/messages`);
      setMessages(res.data?.messages || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function createTicket() {
    if (!form.subject.trim() || !form.description.trim() || !userId) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`${CHAT}/create`, { userId, ...form });
      setChatId(res.data._id);
      setMessages(res.data.messages || []);
      setView('chat');
      loadThreads();
    } catch {}
    finally { setLoading(false); }
  }

  async function send(overrideMsg?: string) {
    const msg = (overrideMsg ?? input).trim();
    if ((!msg && !attachment) || !chatId) return;
    setInput(''); setAttachment(null);
    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [...prev, {
      _id: tempId, senderId: userId!, message: msg,
      createdAt: new Date().toISOString(), status: 'sending',
      imageUri: attachment?.uri,
    }]);
    setIsTyping(true); setSending(true);
    try {
      const res = await apiClient.post(`${CHAT}/send`, { chatId, senderId: userId, message: msg || '[Image]' });
      setIsTyping(false);
      setMessages(res.data.messages || []);
    } catch {
      setIsTyping(false);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(msg);
    } finally { setSending(false); }
  }

  /* ─── Attachment picker ───────────────────────── */
  async function pickAttachment() {
    const pick = async (source: 'library' | 'camera') => {
      const { status } = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access in your device settings.'); return;
      }
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({ uri: asset.uri, name: asset.fileName ?? 'photo.jpg' });
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Photo Library'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) pick('camera'); else if (i === 2) pick('library'); }
      );
    } else {
      Alert.alert('Attach', 'Choose a source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera',        onPress: () => pick('camera') },
        { text: 'Photo Library', onPress: () => pick('library') },
      ]);
    }
  }

  function goBack() {
    if (view === 'chat' || view === 'new') { setView('inbox'); setChatId(null); setMessages([]); setAttachment(null); }
    else router.back();
  }

  const filtered    = threads.filter((t) => !search || t.subject?.toLowerCase().includes(search.toLowerCase()));
  const lastBotIdx  = messages.reduce((acc, m, i) => m.senderId !== userId ? i : acc, -1);
  const canSend     = (input.trim().length > 0 || !!attachment) && !sending;

  /* ════════════════════════════════════════════════
     INBOX
  ════════════════════════════════════════════════ */
  if (view === 'inbox') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={styles.headerLogoWrap}>
            <Image source={LOGO} style={styles.headerLogoImg} resizeMode="contain" />
          </View>
          <View>
            <Text style={styles.headerName}>BritBooks Support</Text>
            <View style={styles.onlineRow}><PulsingDot /><Text style={styles.onlineText}>Online · replies in minutes</Text></View>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { setView('new'); setForm({ subject: '', description: '' }); }} hitSlop={8}>
          <Ionicons name="create-outline" size={21} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.55)" />
        <TextInput
          style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Search conversations…" placeholderTextColor="rgba(255,255,255,0.38)"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Thread list */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyLogoWrap}>
            <Image source={LOGO} style={styles.emptyLogoImg} resizeMode="contain" />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Start a chat and our team will reply promptly.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => { setView('new'); setForm({ subject: '', description: '' }); }} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
            <Text style={styles.startBtnText}>Start a conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t._id}
          style={styles.threadList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.threadRow} onPress={() => openThread(item._id)} activeOpacity={0.7}>
              <View style={styles.threadLogoWrap}>
                <Image source={LOGO} style={styles.threadLogoImg} resizeMode="contain" />
              </View>
              <View style={styles.threadInfo}>
                <Text style={styles.threadSubject} numberOfLines={1}>{item.subject || 'New conversation'}</Text>
                <Text style={styles.threadMeta}>Tap to view messages</Text>
              </View>
              <View style={styles.threadRight}>
                <Text style={styles.threadDate}>{fmtInbox(item.createdAt)}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* New chat FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setView('new'); setForm({ subject: '', description: '' }); }}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  /* ════════════════════════════════════════════════
     NEW TICKET
  ════════════════════════════════════════════════ */
  if (view === 'new') return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <View style={styles.headerLogoWrap}>
            <Image source={LOGO} style={styles.headerLogoImg} resizeMode="contain" />
          </View>
          <Text style={styles.headerName}>New conversation</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.newScroll} contentContainerStyle={styles.newContent} keyboardShouldPersistTaps="handled">
          <View style={styles.newCard}>
            <View style={styles.newCardTop}>
              <View style={styles.newCardLogoWrap}>
                <Image source={LOGO} style={styles.newCardLogoImg} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.newCardTitle}>BritBooks Support</Text>
                <Text style={styles.newCardSub}>Describe your issue and we'll get back to you shortly.</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.fieldInput} value={form.subject}
                onChangeText={(v) => setForm({ ...form, subject: v })}
                placeholder="e.g. Order Issue, Account Help"
                placeholderTextColor={Colors.textMuted} autoCapitalize="sentences"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Details</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldArea]} value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="Describe your issue in as much detail as possible…"
                placeholderTextColor={Colors.textMuted}
                multiline numberOfLines={6} textAlignVertical="top"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, (!form.subject || !form.description) && styles.submitBtnOff]}
            onPress={createTicket} disabled={loading || !form.subject || !form.description} activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="send" size={16} color="#fff" /><Text style={styles.submitBtnText}>Send Message</Text></>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  /* ════════════════════════════════════════════════
     CHAT VIEW
  ════════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerMid} activeOpacity={0.8}>
          <View style={styles.headerLogoWrapSm}>
            <Image source={LOGO} style={styles.headerLogoImgSm} resizeMode="contain" />
            <View style={styles.headerOnlinePip} />
          </View>
          <View>
            <Text style={styles.headerName}>BritBooks Support</Text>
            <View style={styles.onlineRow}><PulsingDot /><Text style={styles.onlineText}>Online now</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => { setView('new'); setChatId(null); setMessages([]); setForm({ subject: '', description: '' }); }}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={21} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          style={styles.msgList}
          contentContainerStyle={styles.msgContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
              : (
                <View style={styles.encryptBadge}>
                  <Ionicons name="lock-closed-outline" size={12} color="#555" />
                  <Text style={styles.encryptText}>Messages are end-to-end encrypted</Text>
                </View>
              )
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          renderItem={({ item, index }) => {
            const isMe = item.senderId === userId;
            const isSending = item.status === 'sending';
            const hasReplyAfter = messages.slice(index + 1).some((m) => m.senderId !== userId);

            /* Date separator before first message or when date changes */
            const prevMsg = messages[index - 1];
            const showDate = !prevMsg || fmtDate(item.createdAt) !== fmtDate(prevMsg.createdAt);

            return (
              <AnimatedMsg>
                {showDate && <DateSep label={fmtDate(item.createdAt)} />}
                <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                  {!isMe && (
                    <View style={styles.botAvatarWrap}>
                      <Image source={LOGO} style={styles.botAvatarImg} />
                    </View>
                  )}
                  {isMe ? (
                    <View style={styles.myBubble}>
                      {item.imageUri && (
                        <Image source={{ uri: item.imageUri }} style={styles.msgImage} resizeMode="cover" />
                      )}
                      {item.message.length > 0 && (
                        <Text style={styles.myBubbleText}>{item.message}</Text>
                      )}
                      <View style={styles.myMeta}>
                        <Text style={styles.msgTime}>{fmtTime(item.createdAt)}</Text>
                        <Text style={[styles.tick, hasReplyAfter && !isSending && styles.tickRead]}>
                          {isSending ? '○' : '✓✓'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <BotBubble
                      message={item.message}
                      time={fmtTime(item.createdAt)}
                      isLast={index === lastBotIdx}
                      onQuickReply={(text) => send(text)}
                    />
                  )}
                </View>
              </AnimatedMsg>
            );
          }}
        />

        {/* Attachment preview strip */}
        {attachment && (
          <View style={styles.attachPreview}>
            <Image source={{ uri: attachment.uri }} style={styles.attachThumb} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.attachName} numberOfLines={1}>{attachment.name}</Text>
              <Text style={styles.attachReady}>Ready to send</Text>
            </View>
            <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={8} style={styles.attachRemove}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar — Telegram style */}
        <View style={styles.inputBar}>
          {/* Attach button */}
          <TouchableOpacity style={styles.inputIconBtn} onPress={pickAttachment} activeOpacity={0.7} hitSlop={4}>
            <Ionicons name="attach" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Text input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message…"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Send / mic */}
          <TouchableOpacity
            style={[styles.sendCircle, !canSend && styles.sendCircleOff]}
            onPress={() => send()}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={canSend ? 'send' : 'mic-outline'} size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════ */
const NAVY   = Colors.primary;   // #0A1628
const GOLD   = Colors.accent;    // #C9A84C
const CHAT_BG = '#DAE4EE';       // Telegram-like light blue-gray

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  /* ── Header (Telegram dark) */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    backgroundColor: NAVY, gap: Spacing.sm,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },

  /* Logo wrappers */
  headerLogoWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', overflow: 'hidden',
    borderWidth: 2, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoImg: { width: 34, height: 34 },
  headerLogoWrapSm: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', overflow: 'hidden',
    borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoImgSm: { width: 28, height: 28 },
  headerOnlinePip: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#34D399', borderWidth: 2, borderColor: NAVY,
  },

  headerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  onlineText: { fontSize: 11, color: '#6EE7B7', fontWeight: '600' },

  /* ── Search bar */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.base, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  /* ── Inbox */
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl },
  emptyLogoWrap: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#fff', borderWidth: 2, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  emptyLogoImg: { width: 68, height: 68 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: NAVY, borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.xs,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  threadList: { flex: 1, backgroundColor: Colors.background },
  threadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  threadLogoWrap: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  threadLogoImg: { width: 40, height: 40 },
  threadInfo: { flex: 1 },
  threadSubject: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  threadMeta: { fontSize: 13, color: Colors.textMuted },
  threadRight: { alignItems: 'flex-end', gap: 4 },
  threadDate: { fontSize: 12, color: Colors.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.borderLight, marginLeft: 74 },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: NAVY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
    borderWidth: 2, borderColor: GOLD,
  },

  /* ── New ticket */
  newScroll: { flex: 1, backgroundColor: Colors.background },
  newContent: { padding: Spacing.base, gap: Spacing.md },
  newCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base, gap: Spacing.base,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  newCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newCardLogoWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 2, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  newCardLogoImg: { width: 42, height: 42 },
  newCardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  newCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldInput: {
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: 14, color: Colors.text,
  },
  fieldArea: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.md },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: NAVY, borderRadius: Radius.full,
    paddingVertical: Spacing.base,
  },
  submitBtnOff: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* ── Chat messages */
  msgList: { flex: 1, backgroundColor: CHAT_BG },
  msgContent: { padding: 12, gap: 4, paddingBottom: Spacing.xl },

  /* Date separator */
  dateSepWrap: { alignItems: 'center', marginVertical: 10 },
  dateSepPill: {
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  dateSepText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  /* Encrypt badge */
  encryptBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    gap: 5, backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, marginTop: Spacing.xl,
  },
  encryptText: { fontSize: 11, color: '#444' },

  /* Message rows */
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 2 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },

  /* Bot avatar — logo */
  botAvatarWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4,
  },
  botAvatarImg: { width: 24, height: 24 },

  /* My bubble — navy */
  myBubble: {
    backgroundColor: '#1A3353',
    borderTopLeftRadius: 18, borderTopRightRadius: 4,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    paddingHorizontal: 13, paddingVertical: 8, maxWidth: '78%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  myBubbleText: { fontSize: 14, color: '#F0F4FF', lineHeight: 20 },
  myMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  tick: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  tickRead: { color: GOLD },

  /* Image in message */
  msgImage: {
    width: 220, height: 160, borderRadius: 12, marginBottom: 6,
  },

  /* Typing indicator */
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    marginBottom: 4,
  },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9CA3AF' },

  /* Bot card */
  botCard: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1,
    overflow: 'hidden', maxWidth: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  botCardHead: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1,
  },
  botCatIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  botCatLabel: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 0.1 },
  botAlex: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  botAlexText: { fontSize: 10, color: Colors.textMuted },
  botCardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 6 },
  botLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  numBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  numBadgeText: { fontSize: 10, fontWeight: '800' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  botLineText: { fontSize: 13, color: '#374151', lineHeight: 20, flex: 1 },
  botStatusLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  botActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1,
  },
  botActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  botActionText: { fontSize: 11, fontWeight: '700' },
  botCardFoot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  botFootLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  botFootSource: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  botFootRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* Quick replies */
  quickRow: { marginLeft: 36 },
  quickRowContent: { gap: 7, paddingRight: 14, paddingVertical: 2 },
  quickChip: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: NAVY,
    borderRadius: Radius.full, paddingHorizontal: 13, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  quickChipText: { fontSize: 12, fontWeight: '600', color: NAVY },

  /* ── Attachment preview */
  attachPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  attachThumb: { width: 48, height: 48, borderRadius: 8 },
  attachName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  attachReady: { fontSize: 11, color: Colors.success, marginTop: 2 },
  attachRemove: { padding: 4 },

  /* ── Input bar (Telegram style) */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    backgroundColor: '#F7F7F7',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
  },
  inputIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    flex: 1, backgroundColor: '#fff',
    borderRadius: 22, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 9, maxHeight: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  input: { fontSize: 15, color: Colors.text, padding: 0, maxHeight: 80 },
  sendCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center',
    shadowColor: NAVY, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
  },
  sendCircleOff: { opacity: 0.5 },
});
