import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { EXPERTS } from '../../data/experts';
import { useApp } from '../../context/AppContext';

export default function ScheduleScreen() {
  const router = useRouter();
  const { expertId } = useLocalSearchParams();
  const { addOrder } = useApp();
  const expert = EXPERTS.find(e => e.id === expertId);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  if (!expert) {
    return <View style={styles.container}><Text>Ahli tidak ditemukan</Text></View>;
  }

  const slots = expert.availableSlots;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      full: `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`,
    };
  };

  const selectedSlot = slots.find(s => s.date === selectedDate);

  const handleCreateOrder = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Peringatan', 'Silakan pilih tanggal dan waktu konsultasi');
      return;
    }

    const orderId = `CON-${Date.now().toString(36).toUpperCase()}`;
    const order = {
      id: orderId,
      type: 'consultation' as const,
      expertId: expert.id,
      expertName: expert.name,
      consultationDate: selectedDate,
      consultationTime: selectedTime,
      totalAmount: expert.fee,
      status: 'pending_payment' as const,
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    router.push({ pathname: '/order-success', params: { orderId, type: 'consultation' } });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pilih Jadwal</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Expert Summary */}
        <View style={styles.expertSummary}>
          <Ionicons name="person-circle" size={40} color={COLORS.primary} />
          <View style={styles.expertInfo}>
            <Text style={styles.expertName}>{expert.name}</Text>
            <Text style={styles.expertSpec}>{expert.specialization}</Text>
          </View>
          <Text style={styles.expertFee}>Rp {expert.fee.toLocaleString('id-ID')}</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Tanggal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {slots.map((slot) => {
              const d = formatDate(slot.date);
              const isSelected = selectedDate === slot.date;
              return (
                <TouchableOpacity
                  key={slot.date}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => { setSelectedDate(slot.date); setSelectedTime(''); }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{d.day}</Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{d.date}</Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>{d.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pilih Waktu</Text>
            <View style={styles.timeGrid}>
              {selectedSlot.times.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, isSelected && styles.timeChipActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Ionicons name="time-outline" size={14} color={isSelected ? COLORS.white : COLORS.primary} />
                    <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ringkasan Konsultasi</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ahli</Text>
              <Text style={styles.summaryValue}>{expert.name.split(',')[0]}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tanggal</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedDate).full}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Waktu</Text>
              <Text style={styles.summaryValue}>{selectedTime} WIB</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durasi</Text>
              <Text style={styles.summaryValue}>30 menit</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Biaya</Text>
              <Text style={styles.totalValue}>Rp {expert.fee.toLocaleString('id-ID')}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>Rp {expert.fee.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.orderBtn, (!selectedDate || !selectedTime) && styles.orderBtnDisabled]}
          onPress={handleCreateOrder}
        >
          <Text style={styles.orderBtnText}>Buat Pesanan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  expertSummary: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    ...SHADOWS.small,
  },
  expertInfo: { flex: 1, marginLeft: SPACING.sm },
  expertName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  expertSpec: { fontSize: 12, color: COLORS.textSecondary },
  expertFee: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  dateCard: {
    width: 70, alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: RADIUS.md, backgroundColor: COLORS.white, marginRight: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.small,
  },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateDay: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  dateDayActive: { color: 'rgba(255,255,255,0.8)' },
  dateNum: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginVertical: 2 },
  dateNumActive: { color: COLORS.white },
  dateMonth: { fontSize: 12, color: COLORS.textSecondary },
  dateMonthActive: { color: 'rgba(255,255,255,0.8)' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  timeChipActive: { backgroundColor: COLORS.primary },
  timeText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginLeft: 4 },
  timeTextActive: { color: COLORS.white },
  summaryCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.xl,
    borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.small,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.divider, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 17, fontWeight: '700', color: COLORS.primaryDark },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 24,
  },
  bottomInfo: { flex: 1 },
  bottomLabel: { fontSize: 12, color: COLORS.textSecondary },
  bottomPrice: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  orderBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  orderBtnDisabled: { backgroundColor: COLORS.textLight },
  orderBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
