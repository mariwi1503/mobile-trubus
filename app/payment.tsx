import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  {
    section: 'Transfer Bank',
    icon: 'business-outline',
    methods: [
      { id: 'bca', name: 'Bank BCA', account: '123-456-7890', holder: 'PT Trubus Indonesia' },
      { id: 'bni', name: 'Bank BNI', account: '098-765-4321', holder: 'PT Trubus Indonesia' },
      { id: 'mandiri', name: 'Bank Mandiri', account: '111-222-3333', holder: 'PT Trubus Indonesia' },
      { id: 'bri', name: 'Bank BRI', account: '444-555-6666', holder: 'PT Trubus Indonesia' },
    ],
  },
  {
    section: 'QRIS',
    icon: 'qr-code-outline',
    methods: [
      { id: 'qris', name: 'Scan QRIS', account: '', holder: '' },
    ],
  },
  {
    section: 'E-Wallet',
    icon: 'phone-portrait-outline',
    methods: [
      { id: 'gopay', name: 'GoPay', account: '081234567890', holder: '' },
      { id: 'ovo', name: 'OVO', account: '081234567890', holder: '' },
      { id: 'dana', name: 'DANA', account: '081234567890', holder: '' },
      { id: 'shopeepay', name: 'ShopeePay', account: '081234567890', holder: '' },
    ],
  },
  {
    section: 'Trubus Coin',
    icon: 'wallet-outline',
    methods: [
      { id: 'trubus_coin', name: 'Potong dari Trubus Coin', account: '', holder: '' },
    ],
  },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { orders, updateOrderPayment, user, setUser } = useApp();
  const { showAlert } = useAlert();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const insets = useSafeAreaInsets();

  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pembayaran</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.empty}><Text>Pesanan tidak ditemukan</Text></View>
      </View>
    );
  }

  const selectedPayment = PAYMENT_METHODS.flatMap(s => s.methods).find(m => m.id === selectedMethod);

  const handlePay = () => {
    if (!selectedMethod) {
      showAlert('Peringatan', 'Pilih metode pembayaran');
      return;
    }

    if (selectedMethod === 'trubus_coin') {
      if (user.trubusCoins < order.totalAmount) {
        showAlert('Saldo Tidak Cukup', 'Saldo Trubus Coin Anda tidak mencukupi. Silakan top up atau pilih metode lain.');
        return;
      }
      showAlert(
        'Konfirmasi',
        `Potong Rp ${order.totalAmount.toLocaleString('id-ID')} dari Trubus Coin Anda?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Bayar',
            onPress: () => {
              setUser({ ...user, trubusCoins: user.trubusCoins - order.totalAmount });
              updateOrderPayment(orderId as string, 'Trubus Coin');
              showAlert('Pembayaran Berhasil', 'Pembayaran dengan Trubus Coin berhasil!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') },
              ]);
            },
          },
        ]
      );
      return;
    }

    setShowDetail(true);
  };

  const handleConfirmPayment = () => {
    updateOrderPayment(orderId as string, selectedPayment?.name || selectedMethod);
    showAlert('Pembayaran Dikonfirmasi', 'Pembayaran Anda sedang diverifikasi. Kami akan mengirim notifikasi setelah pembayaran dikonfirmasi.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  if (showDetail && selectedPayment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDetail(false)}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Pembayaran</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Total Pembayaran</Text>
            <Text style={styles.amountValue}>Rp {order.totalAmount.toLocaleString('id-ID')}</Text>
          </View>

          {/* Payment Info */}
          {selectedMethod === 'qris' ? (
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Scan QRIS</Text>
              <View style={styles.qrisPlaceholder}>
                <Ionicons name="qr-code" size={120} color={COLORS.text} />
                <Text style={styles.qrisText}>Scan kode QR di atas menggunakan aplikasi e-wallet atau mobile banking Anda</Text>
              </View>
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.accentOrange} />
                <Text style={styles.timerText}>Berlaku 15 menit</Text>
              </View>
            </View>
          ) : (
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>Transfer ke {selectedPayment.name}</Text>
              <View style={styles.accountCard}>
                <Text style={styles.accountLabel}>Nomor Rekening / Akun</Text>
                <View style={styles.accountRow}>
                  <Text style={styles.accountNumber}>{selectedPayment.account}</Text>
                  <TouchableOpacity style={styles.copyBtn}>
                    <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.copyText}>Salin</Text>
                  </TouchableOpacity>
                </View>
                {selectedPayment.holder && (
                  <>
                    <Text style={[styles.accountLabel, { marginTop: 12 }]}>Atas Nama</Text>
                    <Text style={styles.accountHolder}>{selectedPayment.holder}</Text>
                  </>
                )}
              </View>

              <View style={styles.stepsCard}>
                <Text style={styles.stepsTitle}>Cara Pembayaran:</Text>
                <View style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                  <Text style={styles.stepText}>Buka aplikasi mobile banking atau ATM</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                  <Text style={styles.stepText}>Pilih menu Transfer</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                  <Text style={styles.stepText}>Masukkan nomor rekening tujuan</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
                  <Text style={styles.stepText}>Masukkan jumlah transfer sesuai total</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>5</Text></View>
                  <Text style={styles.stepText}>Konfirmasi dan selesaikan transfer</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPayment}>
            <Text style={styles.confirmBtnText}>Saya Sudah Bayar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Pembayaran</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ID Pesanan: {order.id}</Text>
          <Text style={styles.summaryAmount}>Rp {order.totalAmount.toLocaleString('id-ID')}</Text>
        </View>

        {/* Payment Methods */}
        {PAYMENT_METHODS.map((section) => (
          <View key={section.section} style={styles.methodSection}>
            <View style={styles.methodSectionHeader}>
              <Ionicons name={section.icon as any} size={18} color={COLORS.primary} />
              <Text style={styles.methodSectionTitle}>{section.section}</Text>
            </View>
            <View style={styles.methodCard}>
              {section.methods.map((method, index) => (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodItem, index < section.methods.length - 1 && styles.methodItemBorder]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodRadio}>
                    {selectedMethod === method.id && <View style={styles.methodRadioInner} />}
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                  {method.id === 'trubus_coin' && (
                    <Text style={styles.coinBalance}>Saldo: Rp {user.trubusCoins.toLocaleString('id-ID')}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>Rp {order.totalAmount.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, !selectedMethod && styles.payBtnDisabled]}
          onPress={handlePay}
        >
          <Text style={styles.payBtnText}>Bayar Sekarang</Text>
        </TouchableOpacity>
      </View>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    backgroundColor: COLORS.primaryBg, marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryAmount: { fontSize: 24, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  methodSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  methodSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  methodSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  methodCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.small },
  methodItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
  },
  methodItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  methodRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  methodRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  methodName: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  coinBalance: { fontSize: 11, color: COLORS.coinColor, fontWeight: '600', marginRight: 8 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 24,
  },
  bottomInfo: { flex: 1 },
  bottomLabel: { fontSize: 12, color: COLORS.textSecondary },
  bottomPrice: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  payBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  payBtnDisabled: { backgroundColor: COLORS.textLight },
  payBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  // Detail view
  amountCard: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg,
  },
  amountLabel: { fontSize: 13, color: COLORS.textSecondary },
  amountValue: { fontSize: 28, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  detailCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, ...SHADOWS.small,
  },
  detailTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  qrisPlaceholder: { alignItems: 'center', paddingVertical: SPACING.xl },
  qrisText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  timerText: { fontSize: 13, color: COLORS.accentOrange, fontWeight: '600' },
  accountCard: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  accountLabel: { fontSize: 12, color: COLORS.textSecondary },
  accountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  accountNumber: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  accountHolder: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  stepsCard: { marginTop: SPACING.md },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  stepNumText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  stepText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xl,
  },
  confirmBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
