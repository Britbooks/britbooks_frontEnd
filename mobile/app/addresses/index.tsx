import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { ENDPOINTS } from '../../constants/Api';
import { Address } from '../../types';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

interface AddressForm {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMPTY_FORM: AddressForm = {
  fullName: '', phoneNumber: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'GB',
};

export default function AddressesScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  async function loadAddresses() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.users.addresses(user.userId));
      setAddresses(res.data.addresses ?? res.data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function update(key: keyof AddressForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(addr: Address) {
    setForm({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? '',
      city: addr.city,
      state: addr.state ?? '',
      postalCode: addr.postalCode,
      country: addr.country,
    });
    setEditId(addr._id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.fullName || !form.addressLine1 || !form.city || !form.postalCode) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (editId) {
        await apiClient.put(`${ENDPOINTS.users.addresses(user.userId)}/${editId}`, form);
      } else {
        await apiClient.post(ENDPOINTS.users.addresses(user.userId), form);
      }
      setShowModal(false);
      loadAddresses();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not save address.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiClient.delete(`${ENDPOINTS.users.addresses(user.userId)}/${id}`);
          loadAddresses();
        },
      },
    ]);
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    await apiClient.patch(`${ENDPOINTS.users.addresses(user.userId)}/${id}/default`).catch(() => {});
    loadAddresses();
  }

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {addresses.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="No addresses saved"
          subtitle="Add a delivery address to speed up your checkout."
          actionLabel="Add Address"
          onAction={openAdd}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: addr }) => (
            <View style={styles.addrCard}>
              <View style={styles.addrHeader}>
                <Ionicons name="location" size={18} color={Colors.accent} />
                <Text style={styles.addrName}>{addr.fullName}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>
                )}
              </View>
              <Text style={styles.addrLine}>{addr.addressLine1}</Text>
              {addr.addressLine2 ? <Text style={styles.addrLine}>{addr.addressLine2}</Text> : null}
              <Text style={styles.addrLine}>{addr.city}, {addr.postalCode}</Text>
              <Text style={styles.addrLine}>{addr.country}</Text>
              <Text style={[styles.addrLine, { color: Colors.textMuted }]}>{addr.phoneNumber}</Text>
              <View style={styles.addrActions}>
                {!addr.isDefault && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(addr._id)}>
                    <Text style={styles.actionBtnText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(addr)}>
                  <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(addr._id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  <Text style={[styles.actionBtnText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
              <Text style={styles.addBtnText}>Add New Address</Text>
            </TouchableOpacity>
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Address' : 'New Address'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
              {[
                { key: 'fullName', label: 'Full Name *', placeholder: 'John Smith', keyboard: 'default' as const },
                { key: 'phoneNumber', label: 'Phone Number *', placeholder: '+44 7700 900000', keyboard: 'phone-pad' as const },
                { key: 'addressLine1', label: 'Address Line 1 *', placeholder: '10 Downing Street', keyboard: 'default' as const },
                { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Flat 2B (optional)', keyboard: 'default' as const },
                { key: 'city', label: 'City *', placeholder: 'London', keyboard: 'default' as const },
                { key: 'state', label: 'County / State', placeholder: 'England', keyboard: 'default' as const },
                { key: 'postalCode', label: 'Postcode *', placeholder: 'SW1A 2AA', keyboard: 'default' as const },
                { key: 'country', label: 'Country *', placeholder: 'GB', keyboard: 'default' as const },
              ].map(({ key, label, placeholder, keyboard }) => (
                <View key={key} style={styles.formField}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form[key as keyof AddressForm]}
                    onChangeText={(v) => update(key as keyof AddressForm, v)}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={keyboard}
                    autoCapitalize={key === 'postalCode' || key === 'country' ? 'characters' : 'words'}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.saveBtnText}>{editId ? 'Save Changes' : 'Add Address'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  list: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  addrCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  addrHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  addrName: { ...Typography.headline, color: Colors.text, flex: 1 },
  defaultBadge: { backgroundColor: `${Colors.accent}20`, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { fontSize: 11, fontWeight: '700', color: Colors.accent },
  addrLine: { ...Typography.callout, color: Colors.textSecondary, lineHeight: 20 },
  addrActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  deleteBtn: { borderColor: `${Colors.error}40` },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.accent}10`,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}40`,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  addBtnText: { ...Typography.callout, color: Colors.accent, fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: { ...Typography.title3, color: Colors.text },
  formScroll: { padding: Spacing.base, gap: Spacing.md },
  formField: { gap: Spacing.xs },
  formLabel: { ...Typography.captionBold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  formInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { ...Typography.headline, color: Colors.primary },
});
