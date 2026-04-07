import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp, Address } from '../context/AppContext';

type ActiveTab = 'alamat' | 'toko';

const NEARBY_STORES = [
  {
    id: 'store_1',
    name: 'Trubus Menteng',
    distance: '1.2 km',
    address: 'Jl. HOS Cokroaminoto No. 72, Menteng',
  },
  {
    id: 'store_2',
    name: 'Trubus Depok',
    distance: '4.8 km',
    address: 'Jl. Margonda Raya No. 211, Kemiri Muka',
  },
  {
    id: 'store_3',
    name: 'Trubus Bintaro',
    distance: '7.3 km',
    address: 'Jl. Boulevard Bintaro Jaya Blok RA 11',
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, addAddress, removeAddress, setDefaultAddress } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('alamat');
  const [showForm, setShowForm] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(NEARBY_STORES[0].id);
  const [form, setForm] = useState({
    label: '',
    recipient: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  const handleSave = () => {
    if (!form.label || !form.recipient || !form.phone || !form.address || !form.city) {
      Alert.alert('Peringatan', 'Mohon lengkapi semua data yang diperlukan');
      return;
    }

    const newAddress: Address = {
      id: `addr_${Date.now()}`,
      ...form,
      isDefault: addresses.length === 0,
    };

    addAddress(newAddress);
    setForm({
      label: '',
      recipient: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
    setShowForm(false);
    setActiveTab('alamat');
    Alert.alert('Berhasil', 'Alamat berhasil ditambahkan');
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Hapus Alamat', `Hapus alamat "${label}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeAddress(id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'alamat' && styles.tabButtonActive]}
          onPress={() => setActiveTab('alamat')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={activeTab === 'alamat' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'alamat' && styles.tabTextActive]}>Alamat Tujuan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'toko' && styles.tabButtonActive]}
          onPress={() => setActiveTab('toko')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activeTab === 'toko' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'toko' && styles.tabTextActive]}>Toko Terdekat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === 'alamat' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daftar alamat tujuan</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Tambah</Text>
              </TouchableOpacity>
            </View>

            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.card, addr.isDefault && styles.cardActive]}
                onPress={() => setDefaultAddress(addr.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons
                      name={addr.isDefault ? 'checkmark-circle' : 'location-outline'}
                      size={18}
                      color={addr.isDefault ? COLORS.primary : COLORS.textSecondary}
                    />
                    <View>
                      <View style={styles.addressTitleRow}>
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        {addr.isDefault && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Utama</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressMeta}>{addr.recipient} · {addr.phone}</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => handleDelete(addr.id, addr.label)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressText}>{addr.address}</Text>
                <Text style={styles.cityText}>{addr.city}, {addr.province} {addr.postalCode}</Text>

                {!addr.isDefault && (
                  <Text style={styles.setDefaultText}>Tap untuk jadikan alamat utama</Text>
                )}
              </TouchableOpacity>
            ))}

            {addresses.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="location-outline" size={42} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>Belum ada alamat</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setShowForm(true)}>
                  <Text style={styles.primaryButtonText}>Tambah Alamat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Daftar toko terdekat</Text>

            {NEARBY_STORES.map((store) => {
              const selected = selectedStoreId === store.id;

              return (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.card, selected && styles.cardActive]}
                  onPress={() => setSelectedStoreId(store.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons
                        name={selected ? 'storefront' : 'storefront-outline'}
                        size={18}
                        color={selected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <View>
                        <Text style={styles.addressLabel}>{store.name}</Text>
                        <Text style={styles.addressMeta}>{store.distance}</Text>
                      </View>
                    </View>

                    {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </View>

                  <Text style={styles.addressText}>{store.address}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tambah Alamat Baru</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.formScrollContent}
              >
                {[
                  { key: 'label', label: 'Label Alamat', placeholder: 'Contoh: Rumah, Kantor' },
                  { key: 'recipient', label: 'Nama Penerima', placeholder: 'Nama lengkap penerima' },
                  { key: 'phone', label: 'No. Telepon', placeholder: '08xxxxxxxxxx', keyboardType: 'phone-pad' },
                  { key: 'address', label: 'Alamat Lengkap', placeholder: 'Jalan, RT/RW, Kelurahan', multiline: true },
                  { key: 'city', label: 'Kota/Kabupaten', placeholder: 'Nama kota' },
                  { key: 'province', label: 'Provinsi', placeholder: 'Nama provinsi' },
                  { key: 'postalCode', label: 'Kode Pos', placeholder: 'Kode pos', keyboardType: 'number-pad' },
                ].map((field) => (
                  <View key={field.key} style={styles.formGroup}>
                    <Text style={styles.formLabel}>{field.label}</Text>
                    <TextInput
                      style={[styles.formInput, field.multiline && styles.formInputMulti]}
                      value={(form as Record<string, string>)[field.key]}
                      onChangeText={(text) => setForm({ ...form, [field.key]: text })}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textLight}
                      multiline={field.multiline}
                      keyboardType={(field as { keyboardType?: 'default' | 'phone-pad' | 'number-pad' }).keyboardType}
                    />
                  </View>
                ))}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Simpan Alamat</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardActive: {
    borderColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addressMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  setDefaultText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardWrap: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl,
    maxHeight: '85%',
  },
  formScrollContent: {
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formInputMulti: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
