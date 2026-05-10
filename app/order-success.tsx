import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getOrderDisplayCode } from '../lib/order-display';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { allowPaymentAction, orderId, status, type } = useLocalSearchParams();
  const { orders } = useApp();

  const order = orders.find(o => o.id === orderId);
  const isConsultation = type === 'consultation';
  const resolvedStatus = typeof status === 'string' ? status : order?.status;
  const isAwaitingPayment = resolvedStatus === 'draft' || resolvedStatus === 'pending_payment';
  const isCoinRedemption = Boolean(order?.coinRedemptionCost);
  const shouldOfferPaymentAction = allowPaymentAction !== 'false' && isAwaitingPayment;
  const displayOrderCode = getOrderDisplayCode(order, typeof orderId === 'string' ? orderId : undefined);

  const iconName = isAwaitingPayment ? 'time' : 'checkmark';
  const iconBg = isAwaitingPayment ? '#FFF3E0' : COLORS.primaryBg;
  const iconInnerBg = isAwaitingPayment ? COLORS.accentOrange : COLORS.primary;
  const title = isAwaitingPayment
    ? isConsultation
      ? 'Konsultasi Berhasil Dibuat'
      : 'Pesanan Menunggu Pembayaran'
    : isCoinRedemption
    ? 'Penukaran Berhasil!'
    : isConsultation
    ? 'Konsultasi Berhasil!'
    : 'Pembayaran Berhasil!';
  const subtitle = isAwaitingPayment
    ? isConsultation
      ? 'Jadwal konsultasi Anda sudah kami catat. Pembayaran akan kita lanjutkan di tahap berikutnya.'
      : 'Pesananmu sudah kami catat. Segera selesaikan pembayaran agar pesanan dapat diproses.'
    : isCoinRedemption
    ? 'Hadiah dari Trubus Coin sedang kami proses. Kami akan memberi notifikasi saat pesanan siap dikirim atau diambil.'
    : isConsultation
    ? 'Jadwal konsultasi Anda telah dikonfirmasi. Tim ahli kami akan segera menghubungi Anda.'
    : 'Pesananmu sedang diproses. Kami akan memberikan notifikasi ketika pesanan dikirim.';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <View style={[styles.iconInner, { backgroundColor: iconInnerBg }]}>
            <Ionicons name={iconName} size={48} color={COLORS.white} />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>Kode Pesanan</Text>
          <Text style={styles.orderIdValue}>{displayOrderCode}</Text>
        </View>

        <View style={styles.infoCard}>
          {isAwaitingPayment ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.accentOrange} />
                <Text style={styles.infoText}>
                  {isConsultation
                    ? 'Pesanan konsultasi sudah tersimpan dan siap dilanjutkan ke tahap pembayaran.'
                    : 'Selesaikan pembayaran dalam 24 jam'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoText}>Transaksi Anda dilindungi oleh Trubus</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoText}>Notifikasi pengiriman akan dikirim ke akunmu</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoText}>Transaksi Anda dilindungi oleh Trubus</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.bottomSection}>
        {shouldOfferPaymentAction && (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => router.push({ pathname: '/payment', params: { orderId: orderId as string } })}
          >
            <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
            <Text style={styles.payBtnText}>Lanjut Bayar Sekarang</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.viewOrderBtn}
          onPress={() => {
            if (isConsultation) router.replace('/consultations');
            else router.replace('/orders');
          }}
        >
          <Text style={styles.viewOrderText}>
            {isConsultation ? 'Lihat Riwayat Konsultasi' : 'Lihat Daftar Pesanan'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeBtnText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  orderIdCard: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 24, alignItems: 'center',
  },
  orderIdLabel: { fontSize: 12, color: COLORS.textSecondary },
  orderIdValue: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, marginTop: 2 },
  infoCard: { marginTop: 24, width: '100%' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginLeft: 10, flex: 1 },
  bottomSection: { paddingHorizontal: 24, paddingBottom: 40 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 16, marginBottom: 12,
  },
  payBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 8 },
  viewOrderBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  viewOrderText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  homeBtn: { alignItems: 'center', paddingVertical: 12 },
  homeBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
});
