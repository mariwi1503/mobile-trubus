import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp, Address } from '../context/AppContext';

export default function AddressesScreen() {
  const router = useRouter();
  const { addresses, addAddress, removeAddress, setDefaultAddress } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: '', recipient: '', phone: '', address: '', city: '', province: '', postalCode: '',
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
    setForm({ label: '', recipient: '', phone: '', address: '', city: '', province: '', postalCode: '' });
    setShowForm(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}>
        {addresses.map((addr) => (
          <View key={addr.id} style={[styles.addressCard, addr.isDefault && styles.addressCardDefault]}>
            <View style={styles.addressHeader}>
              <View style={styles.labelRow}>
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Utama</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(addr.id, addr.label)}>
                <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.recipientName}>{addr.recipient}</Text>
            <Text style={styles.recipientPhone}>{addr.phone}</Text>
            <Text style={styles.addressText}>{addr.address}</Text>
            <Text style={styles.cityText}>{addr.city}, {addr.province} {addr.postalCode}</Text>
            {!addr.isDefault && (
              <TouchableOpacity style={styles.setDefaultBtn} onPress={() => setDefaultAddress(addr.id)}>
                <Text style={styles.setDefaultText}>Jadikan Alamat Utama</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {addresses.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Belum ada alamat</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>Tambah Alamat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Alamat Baru</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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
                    value={(form as any)[field.key]}
                    onChangeText={(text) => setForm({ ...form, [field.key]: text })}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textLight}
                    multiline={field.multiline}
                    keyboardType={(field as any).keyboardType}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan Alamat</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  addressCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    borderWidth: 1, borderColor: COLORS.border,
  },
  addressCardDefault: { borderColor: COLORS.primary },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  defaultBadge: { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.xs, paddingHorizontal: 6, paddingVertical: 2 },
  defaultText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  recipientName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  recipientPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  addressText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 18 },
  cityText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  setDefaultBtn: { marginTop: 10, alignSelf: 'flex-start' },
  setDefaultText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 16,
  },
  addBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xl, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  formGroup: { marginBottom: SPACING.md },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  formInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  formInputMulti: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xl,
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
