import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { ENDPOINTS } from '../../constants/Api';
import { Address } from '../../types';

const STRIPE_PK = 'pk_test_51QZDScCasyzk0xgmJXe3EX4R8ivBkOslgUZlZAEbeouc38YH3yhSMRmrUkesbJYoKOuYCBCK4ehONp9X2njSbKmc00BJ8lN865';

const STRIPE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <script src="https://js.stripe.com/v3/"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:transparent;padding:0 0 4px;}
    #wrap{
      padding:13px 14px;
      border:1.5px solid #E5E3DC;
      border-radius:10px;
      background:#fff;
      transition:border-color .2s;
    }
    #wrap.focused{border-color:#C9A84C;}
    #err{color:#EF4444;font-size:12px;margin-top:7px;min-height:16px;font-family:-apple-system,sans-serif;}
  </style>
</head>
<body>
  <div id="wrap"><div id="card"></div></div>
  <p id="err"></p>
  <script>
    var stripe = Stripe('${STRIPE_PK}');
    var card = stripe.elements().create('card',{
      style:{
        base:{fontSize:'15px',fontFamily:'-apple-system,sans-serif',color:'#0A1628','::placeholder':{color:'#9CA3AF'},iconColor:'#C9A84C'},
        invalid:{color:'#EF4444',iconColor:'#EF4444'}
      }
    });
    card.mount('#card');
    var complete=false;
    card.on('change',function(e){
      complete=e.complete;
      document.getElementById('err').textContent=e.error?e.error.message:'';
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready',complete:e.complete}));
    });
    card.on('focus',function(){document.getElementById('wrap').classList.add('focused');});
    card.on('blur',function(){document.getElementById('wrap').classList.remove('focused');});
    function handleMsg(data){
      if(data==='tokenize'){
        stripe.createToken(card).then(function(r){
          if(r.error){
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:r.error.message}));
          }else{
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'token',token:r.token.id,last4:r.token.card?r.token.card.last4:'',brand:r.token.card?r.token.card.brand:''}));
          }
        });
      }
    }
    document.addEventListener('message',function(e){handleMsg(e.data);});
    window.addEventListener('message',function(e){handleMsg(e.data);});
  </script>
</body>
</html>
`;

const STEPS = ['Delivery', 'Payment', 'Review'];

interface Campaign {
  campaignId: string;
  title: string;
  discountAmount: number;
  finalTotal: number;
  isFreeShipping: boolean;
}

export default function CheckoutScreen() {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState(1);

  const [addresses, setAddresses]               = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress]   = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [promoCode, setPromoCode]     = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [campaign, setCampaign]       = useState<Campaign | null>(null);
  const [promoError, setPromoError]   = useState('');

  const [cardReady, setCardReady]     = useState(false);
  const [cardLast4, setCardLast4]     = useState('');
  const [cardBrand, setCardBrand]     = useState('');
  const [placing, setPlacing]         = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId]         = useState('');

  const webViewRef    = useRef<WebView>(null);
  const tokenPromise  = useRef<{ resolve:(t:string)=>void; reject:(e:Error)=>void } | null>(null);
  const scrollRef     = useRef<ScrollView>(null);

  const SHIPPING = campaign?.isFreeShipping ? 0 : items.length > 0 ? (cartTotal >= 25 ? 0 : 3.99) : 0;
  const discount = campaign?.discountAmount ?? 0;
  const total    = Math.max(cartTotal - discount, 0) + SHIPPING;

  const addr = addresses.find((a) => a._id === selectedAddress);

  useEffect(() => {
    if (!user) return;
    apiClient.get(ENDPOINTS.users.addresses(user.userId))
      .then((res) => {
        const addrs: Address[] = res.data.addresses ?? res.data ?? [];
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault);
        setSelectedAddress(def?._id ?? addrs[0]?._id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [user]);

  function scrollTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function goToStep(n: number) {
    setStep(n);
    scrollTop();
  }

  function handleNextFromDelivery() {
    if (!selectedAddress) {
      Alert.alert('No address', 'Please select a delivery address.');
      return;
    }
    goToStep(2);
  }

  function handleNextFromPayment() {
    if (!cardReady) {
      Alert.alert('Incomplete card', 'Please fill in your card details.');
      return;
    }
    goToStep(3);
  }

  function getStripeToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      tokenPromise.current = { resolve, reject };
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message',{data:'tokenize'}));true;`
      );
    });
  }

  function handleWebViewMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        setCardReady(!!msg.complete);
      } else if (msg.type === 'token' && tokenPromise.current) {
        if (msg.last4) setCardLast4(msg.last4);
        if (msg.brand) setCardBrand(msg.brand);
        tokenPromise.current.resolve(msg.token);
        tokenPromise.current = null;
      } else if (msg.type === 'error' && tokenPromise.current) {
        tokenPromise.current.reject(new Error(msg.message));
        tokenPromise.current = null;
      }
    } catch {}
  }

  async function applyPromo() {
    if (!promoCode.trim() || !user) return;
    setPromoLoading(true);
    setPromoError('');
    setCampaign(null);
    try {
      const res = await apiClient.post(ENDPOINTS.campaigns.validate, {
        code:      promoCode.trim().toUpperCase(),
        userId:    user.userId,
        cartTotal,
      });
      setCampaign(res.data);
    } catch (e: any) {
      setPromoError(e.response?.data?.message ?? 'Invalid or expired code.');
    } finally {
      setPromoLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!addr || !user) return;
    setPlacing(true);
    try {
      let stripeToken: string;
      try {
        stripeToken = await getStripeToken();
      } catch (e: any) {
        Alert.alert('Card error', e.message ?? 'Could not validate card.');
        return;
      }

      const payRes = await apiClient.post(ENDPOINTS.payments.create, {
        userId:  user.userId,
        email:   user.email,
        orderId: `ORDER_${Date.now()}`,
        shippingAddress: {
          name:        addr.fullName,
          line1:       [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
          city:        addr.city,
          phoneNumber: addr.phoneNumber,
          postalCode:  addr.postalCode,
          country:     addr.country || 'GB',
        },
        items: items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
        subtotal:       cartTotal,
        shippingFee:    SHIPPING,
        discountAmount: discount,
        campaignId:     campaign?.campaignId ?? null,
        total,
        currency: 'gbp',
        token:    stripeToken,
      });

      const { type, message, items: stockItems, reference, requiresAction, clientSecret } = payRes.data;

      if (type === 'stock_error') {
        const details = (stockItems ?? []).map((i: any) => `• ${i.title} (${i.available} left)`).join('\n');
        Alert.alert('Stock issue', `${message}\n\n${details}`);
        return;
      }
      if (type === 'race_condition') {
        Alert.alert('Sold out', message ?? 'An item sold out during checkout. Please try again.');
        return;
      }
      if (!reference) {
        Alert.alert('Payment failed', message ?? 'Please try again.');
        return;
      }

      if (requiresAction && clientSecret) {
        Alert.alert(
          'Bank verification required',
          'Your bank requires additional verification. Please approve the payment in your banking app, then tap OK.',
          [{ text: 'OK', onPress: () => finalise(reference) }],
        );
        return;
      }

      await finalise(reference);
    } catch (e: any) {
      Alert.alert('Order failed', e.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  async function finalise(reference: string) {
    try {
      const res = await apiClient.post(ENDPOINTS.payments.success(reference), {
        reference, receiptUrl: null,
      });
      setOrderId(res.data.orderId ?? reference);
      clearCart();
      setOrderPlaced(true);
    } catch (e: any) {
      Alert.alert('Order failed', e.response?.data?.message ?? 'Could not confirm order.');
    }
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>You'll receive a confirmation email shortly.</Text>
          {orderId ? <Text style={styles.successOrderId}>#{orderId.slice(-8).toUpperCase()}</Text> : null}
          <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace('/orders/')}>
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/')}>
            <Text style={styles.homeBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step indicator ────────────────────────────────────────────────────────
  function StepBar() {
    return (
      <View style={styles.stepBar}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done    = n < step;
          const active  = n === step;
          return (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
                  {done
                    ? <Ionicons name="checkmark" size={13} color="#fff" />
                    : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{n}</Text>}
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, done && styles.stepLineDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  // ── Step 1: Delivery ──────────────────────────────────────────────────────
  function StepDelivery() {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {loadingAddresses ? (
          <ActivityIndicator color={Colors.accent} />
        ) : addresses.length === 0 ? (
          <TouchableOpacity style={styles.addAddrBtn} onPress={() => router.push('/addresses/')}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
            <Text style={styles.addAddrText}>Add a delivery address</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addrList}>
            {addresses.map((a) => {
              const selected = selectedAddress === a._id;
              return (
                <TouchableOpacity
                  key={a._id}
                  style={[styles.addrCard, selected && styles.addrCardSelected]}
                  onPress={() => setSelectedAddress(a._id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radio, selected && styles.radioActive]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.addrName}>{a.fullName}</Text>
                    <Text style={styles.addrLine}>{a.addressLine1}</Text>
                    {a.addressLine2 ? <Text style={styles.addrLine}>{a.addressLine2}</Text> : null}
                    <Text style={styles.addrLine}>{a.city}, {a.postalCode}</Text>
                    <Text style={styles.addrLine}>{a.country}</Text>
                    <Text style={styles.addrPhone}>{a.phoneNumber}</Text>
                  </View>
                  {a.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addAddrLink} onPress={() => router.push('/addresses/')}>
              <Ionicons name="add-circle-outline" size={15} color={Colors.accent} />
              <Text style={styles.addAddrLinkText}>Add new address</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Step 2: Payment ───────────────────────────────────────────────────────
  function StepPayment() {
    return (
      <>
        {/* Promo code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          {campaign ? (
            <View style={styles.promoApplied}>
              <Ionicons name="ticket-outline" size={18} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.promoAppliedTitle}>{campaign.title}</Text>
                <Text style={styles.promoAppliedSub}>
                  {campaign.isFreeShipping ? 'Free shipping applied' : `£${campaign.discountAmount.toFixed(2)} discount`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setCampaign(null); setPromoCode(''); }} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                value={promoCode}
                onChangeText={(t) => { setPromoCode(t.toUpperCase()); setPromoError(''); }}
                placeholder="Enter promo code"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={applyPromo}
              />
              <TouchableOpacity
                style={[styles.promoBtn, (!promoCode.trim() || promoLoading) && styles.promoBtnDisabled]}
                onPress={applyPromo}
                disabled={!promoCode.trim() || promoLoading}
              >
                {promoLoading
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Text style={styles.promoBtnText}>Apply</Text>}
              </TouchableOpacity>
            </View>
          )}
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
        </View>

        {/* Card */}
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.secureTag}>
              <Ionicons name="lock-closed" size={11} color={Colors.success} />
              <Text style={styles.secureText}>Secured by Stripe</Text>
            </View>
          </View>
          <View style={styles.stripeWrap}>
            <WebView
              ref={webViewRef}
              source={{ html: STRIPE_HTML }}
              style={styles.stripeWebView}
              scrollEnabled={false}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
              javaScriptEnabled
            />
          </View>
        </View>
      </>
    );
  }

  // ── Step 3: Review ────────────────────────────────────────────────────────
  function StepReview() {
    return (
      <>
        {/* Delivery summary */}
        <View style={styles.section}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <TouchableOpacity onPress={() => goToStep(1)} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          {addr && (
            <View style={styles.reviewCard}>
              <View style={styles.reviewCardRow}>
                <Ionicons name="location-outline" size={18} color={Colors.accent} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.addrName}>{addr.fullName}</Text>
                  <Text style={styles.addrLine}>{addr.addressLine1}</Text>
                  {addr.addressLine2 ? <Text style={styles.addrLine}>{addr.addressLine2}</Text> : null}
                  <Text style={styles.addrLine}>{addr.city}, {addr.postalCode}</Text>
                  <Text style={styles.addrLine}>{addr.country}</Text>
                  <Text style={styles.addrPhone}>{addr.phoneNumber}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Payment summary */}
        <View style={styles.section}>
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <TouchableOpacity onPress={() => goToStep(2)} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reviewCard}>
            <View style={styles.reviewCardRow}>
              <Ionicons name="card-outline" size={18} color={Colors.accent} />
              <Text style={styles.reviewPayText}>
                {cardBrand ? `${cardBrand.charAt(0).toUpperCase()}${cardBrand.slice(1)} ` : 'Card '}
                {cardLast4 ? `ending in ${cardLast4}` : '(details entered)'}
              </Text>
            </View>
            {campaign && (
              <View style={[styles.reviewCardRow, { marginTop: 8 }]}>
                <Ionicons name="ticket-outline" size={16} color={Colors.success} />
                <Text style={[styles.reviewPayText, { color: Colors.success }]}>
                  Promo: {campaign.title}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Order items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          <View style={styles.reviewCard}>
            {items.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.itemRow}>
                  <Image source={{ uri: item.img }} style={styles.itemImg} contentFit="cover" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.itemAuthor}>{item.author}</Text>
                    <Text style={styles.itemQty}>Qty {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>£{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Price breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.reviewCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>£{cartTotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.success }]}>
                  Discount{campaign?.title ? ` (${campaign.title})` : ''}
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>-£{discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, SHIPPING === 0 && { color: Colors.success }]}>
                {SHIPPING === 0 ? 'FREE' : `£${SHIPPING.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.confirmNote}>
          <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
          <Text style={styles.confirmNoteText}>
            By placing your order you agree to our Terms & Conditions. Payment is processed securely via Stripe.
          </Text>
        </View>
      </>
    );
  }

  // ── Bottom bar labels & actions ───────────────────────────────────────────
  function bottomAction() {
    if (step === 1) return { label: 'Continue to Payment', onPress: handleNextFromDelivery, disabled: !selectedAddress && !loadingAddresses };
    if (step === 2) return { label: 'Review Order', onPress: handleNextFromPayment, disabled: !cardReady };
    return { label: 'Place Order', onPress: handlePlaceOrder, disabled: placing };
  }

  const action = bottomAction();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StepBar />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && <StepDelivery />}
          {step === 2 && <StepPayment />}
          {step === 3 && <StepReview />}

          {/* Keep WebView mounted always so card data persists; hide when not on step 2 */}
          {step !== 2 && (
            <View style={{ height: 0, overflow: 'hidden' }}>
              <WebView
                ref={webViewRef}
                source={{ html: STRIPE_HTML }}
                style={{ height: 90 }}
                scrollEnabled={false}
                onMessage={handleWebViewMessage}
                originWhitelist={['*']}
                javaScriptEnabled
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomTotal}>£{total.toFixed(2)}</Text>
            <Text style={styles.bottomSub}>
              {step === 3 ? 'Confirm & pay' : `Step ${step} of ${STEPS.length}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.placeBtn, action.disabled && styles.placeBtnDisabled]}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            {placing ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                {step === 3 && <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} />}
                <Text style={styles.placeBtnText}>{action.label}</Text>
                {step < 3 && <Ionicons name="chevron-forward" size={16} color={Colors.primary} />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['2xl'] },

  // Step bar
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  stepItem:   { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border,
  },
  stepActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepDone:   { backgroundColor: Colors.success, borderColor: Colors.success },
  stepNum:        { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepNumActive:  { color: Colors.primary },
  stepLabel:      { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  stepLabelActive:{ color: Colors.accent, fontWeight: '700' },
  stepLabelDone:  { color: Colors.success, fontWeight: '600' },
  stepLine:     { flex: 1, height: 2, backgroundColor: Colors.border, marginBottom: 16, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.success },

  section:      { gap: Spacing.sm },
  sectionTitle: { ...Typography.title3, color: Colors.text },

  // Address
  addAddrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: `${Colors.accent}10`, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5,
    borderColor: `${Colors.accent}40`, borderStyle: 'dashed',
  },
  addAddrText: { ...Typography.callout, color: Colors.accent, fontWeight: '600' },
  addrList:    { gap: Spacing.sm },
  addrCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border,
  },
  addrCardSelected: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}06` },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  radioActive:  { borderColor: Colors.accent },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  addrName:     { ...Typography.callout, color: Colors.text, fontWeight: '700' },
  addrLine:     { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  addrPhone:    { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  defaultBadge: {
    backgroundColor: `${Colors.accent}20`, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  defaultText:    { fontSize: 11, fontWeight: '700', color: Colors.accent },
  addAddrLink:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: Spacing.sm, paddingHorizontal: 2 },
  addAddrLinkText:{ fontSize: 13, color: Colors.accent, fontWeight: '600' },

  // Promo
  promoRow:   { flexDirection: 'row', gap: Spacing.sm },
  promoInput: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: 14, color: Colors.text, backgroundColor: Colors.surface,
    letterSpacing: 1.5, fontWeight: '600',
  },
  promoBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, justifyContent: 'center', minWidth: 72,
  },
  promoBtnDisabled: { opacity: 0.5 },
  promoBtnText:     { color: Colors.white, fontWeight: '700', fontSize: 14 },
  promoError:       { fontSize: 12, color: Colors.error, fontWeight: '500' },
  promoApplied: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: `${Colors.success}10`, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.success}30`,
  },
  promoAppliedTitle: { ...Typography.callout, color: Colors.success, fontWeight: '700' },
  promoAppliedSub:   { ...Typography.caption, color: Colors.success },

  // Card / Stripe
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secureTag:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secureText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  stripeWrap: {
    height: 90,
    borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  stripeWebView: { height: 90, backgroundColor: 'transparent' },

  // Review
  reviewSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editLink:            { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  reviewCardRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  reviewPayText:  { ...Typography.callout, color: Colors.text, fontWeight: '600' },

  // Items
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  itemImg:    { width: 48, height: 64, borderRadius: Radius.sm, backgroundColor: Colors.skeleton },
  itemTitle:  { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  itemAuthor: { ...Typography.caption, color: Colors.textMuted },
  itemQty:    { ...Typography.caption, color: Colors.textMuted },
  itemPrice:  { fontSize: 15, fontWeight: '700', color: Colors.text },
  divider:    { height: 1, backgroundColor: Colors.borderLight },

  // Summary
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...Typography.callout, color: Colors.textSecondary },
  summaryValue: { ...Typography.callout, color: Colors.text, fontWeight: '600' },
  totalRow:     { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: 4 },
  totalLabel:   { ...Typography.headline, color: Colors.text },
  totalValue:   { fontSize: 18, fontWeight: '800', color: Colors.accent },

  confirmNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  confirmNoteText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  // Bottom bar
  bottomBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.base,
  },
  bottomTotal: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  bottomSub:   { ...Typography.caption, color: Colors.textMuted },
  placeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.accent,
    borderRadius: Radius.lg, paddingVertical: Spacing.md,
  },
  placeBtnDisabled: { opacity: 0.55 },
  placeBtnText:     { ...Typography.headline, color: Colors.primary },

  // Success
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['2xl'], gap: Spacing.md,
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle:   { ...Typography.largeTitle, color: Colors.text },
  successSub:     { ...Typography.callout, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successOrderId: { fontSize: 18, fontWeight: '800', color: Colors.accent, letterSpacing: 2, marginTop: 4 },
  trackBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing['2xl'], marginTop: Spacing.base,
  },
  trackBtnText: { ...Typography.headline, color: Colors.white },
  homeBtn:      { paddingVertical: Spacing.sm },
  homeBtnText:  { ...Typography.callout, color: Colors.accent, fontWeight: '700' },
});
