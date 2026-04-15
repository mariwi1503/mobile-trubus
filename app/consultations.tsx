import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { EXPERTS } from '../data/experts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Menunggu Pembayaran', color: '#FF9800', bg: '#FFF3E0' },
    pending_payment: { label: 'Menunggu Pembayaran', color: '#FF9800', bg: '#FFF3E0' },
    paid: { label: 'Terjadwal', color: '#2196F3', bg: '#E3F2FD' },
    completed: { label: 'Selesai', color: '#4CAF50', bg: '#E8F5E9' },
    cancelled: { label: 'Dibatalkan', color: '#F44336', bg: '#FFEBEE' },
};

const EXPERT_FILTERS = [
    { id: 'all', label: 'Semua' },
    { id: 'pending', label: 'Menunggu' },
    { id: 'paid', label: 'Terjadwal' },
    { id: 'completed', label: 'Selesai' },
];

const EXPERT_HISTORY_FILTERS = [
    { id: 'all', label: 'Semua' },
    { id: 'completed', label: 'Selesai' },
    { id: 'cancelled', label: 'Closed' },
];

export default function ConsultationsScreen({
    isTab = false,
    mode = 'all',
    title,
}: {
    isTab?: boolean;
    mode?: 'all' | 'active' | 'history';
    title?: string;
}) {
    const router = useRouter();
    const { orders, user } = useApp();
    const insets = useSafeAreaInsets();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const isExpertUser = user.role === 'expert';

    const consultations = orders.filter(o => o.type === 'consultation');
    const expertConsultations = useMemo(() => {
        if (!isExpertUser) return consultations;
        if (mode === 'active') {
            return consultations.filter((item) => ['draft', 'pending_payment', 'paid'].includes(item.status));
        }
        if (mode === 'history') {
            return consultations.filter((item) => ['completed', 'cancelled', 'delivered'].includes(item.status));
        }
        return consultations;
    }, [consultations, isExpertUser, mode]);

    const filteredConsultations = useMemo(() => {
        if (!isExpertUser || selectedFilter === 'all') return expertConsultations;
        if (mode === 'active' && selectedFilter === 'pending') {
            return expertConsultations.filter((item) => item.status === 'pending_payment' || item.status === 'draft');
        }
        return expertConsultations.filter((item) => item.status === selectedFilter);
    }, [expertConsultations, isExpertUser, mode, selectedFilter]);

    const headerTitle = title || (
        isExpertUser
            ? mode === 'history'
                ? 'Riwayat Konsultasi'
                : 'Konsultasi'
            : 'Riwayat Konsultasi'
    );

    const activeFilters = mode === 'history' ? EXPERT_HISTORY_FILTERS : EXPERT_FILTERS;

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                {!isTab && (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{headerTitle}</Text>
                <View style={{ width: 22 }} />
            </View>

            {(isExpertUser ? expertConsultations : consultations).length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>
                        {isExpertUser
                            ? mode === 'history'
                                ? 'Belum Ada Riwayat Konsultasi'
                                : 'Belum Ada Konsultasi Aktif'
                            : 'Belum Ada Konsultasi'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {isExpertUser
                            ? mode === 'history'
                                ? 'Riwayat konsultasi selesai atau closed akan muncul di sini.'
                                : 'Konsultasi yang aktif atau akan datang akan muncul di sini.'
                            : 'Mulai konsultasi dengan ahli pertanian sekarang!'}
                    </Text>
                    {!isExpertUser && (
                        <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/experts')}>
                            <Text style={styles.startBtnText}>Cari Ahli</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredConsultations}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 20 }}
                    ListHeaderComponent={isExpertUser ? (
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Filter Chat</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.filterRow}
                            >
                                {activeFilters.map((filter) => (
                                    <TouchableOpacity
                                        key={filter.id}
                                        style={[
                                            styles.filterChip,
                                            selectedFilter === filter.id && styles.filterChipActive,
                                        ]}
                                        onPress={() => setSelectedFilter(filter.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                selectedFilter === filter.id && styles.filterChipTextActive,
                                            ]}
                                        >
                                            {filter.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    ) : null}
                    ListEmptyComponent={isExpertUser ? (
                        <View style={styles.emptyFiltered}>
                            <Ionicons name="funnel-outline" size={28} color={COLORS.textLight} />
                            <Text style={styles.emptyFilteredTitle}>Tidak ada chat pada filter ini</Text>
                            <Text style={styles.emptyFilteredText}>Coba pilih filter lain untuk melihat konsultasi.</Text>
                        </View>
                    ) : null}
                    renderItem={({ item }) => {
                        const status = STATUS_MAP[item.status] || STATUS_MAP.pending_payment;
                        const expert = EXPERTS.find(e => e.id === item.expertId);
                        const date = item.consultationDate ? new Date(item.consultationDate) : new Date(item.createdAt);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

                        return (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                    if (isExpertUser) {
                                        // Expert always goes to chat
                                        router.push(`/chat/${item.id}`);
                                    } else {
                                        // Consumer logic
                                        if (item.status === 'paid' || item.status === 'completed') {
                                            router.push(`/chat/${item.id}`);
                                        } else if (item.status === 'pending_payment' || item.status === 'draft') {
                                            router.push({ pathname: '/payment', params: { orderId: item.id } });
                                        }
                                    }
                                }}
                            >
                                <View style={styles.card}>
                                    <View style={styles.cardTop}>
                                        <View style={styles.expertRow}>
                                            <Image
                                                source={{ uri: isExpertUser ? (item.clientAvatar || 'https://ui-avatars.com/api/?name=User') : expert?.image }}
                                                style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border }}
                                            />
                                            <View style={styles.expertInfo}>
                                                <Text style={styles.expertName}>{isExpertUser ? (item.clientName || 'Klien') : (item.expertName || 'Ahli')}</Text>
                                                <Text style={styles.expertSpec}>{isExpertUser ? 'Klien Konsultasi' : (expert?.specialization || 'Konsultasi Pertanian')}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.scheduleRow}>
                                        <View style={styles.scheduleItem}>
                                            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                                            <Text style={styles.scheduleText}>
                                                {date.getDate()} {months[date.getMonth()]} {date.getFullYear()}
                                            </Text>
                                        </View>
                                        {item.consultationTime && (
                                            <View style={styles.scheduleItem}>
                                                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                                                <Text style={styles.scheduleText}>{item.consultationTime} WIB</Text>
                                            </View>
                                        )}
                                    </View>

                                    {!isExpertUser && (
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.feeAmount}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
                                            {item.status === 'pending_payment' || item.status === 'draft' ? (
                                                <TouchableOpacity
                                                    style={styles.payBtn}
                                                    onPress={() => router.push({ pathname: '/payment', params: { orderId: item.id } })}
                                                >
                                                    <Text style={styles.payBtnText}>Bayar</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.chatBtn}
                                                    onPress={() => router.push(`/chat/${item.id}`)}
                                                >
                                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
                                                    <Text style={styles.chatBtnText}>Chat</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
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
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
    emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
    startBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
        paddingHorizontal: 24, paddingVertical: 12, marginTop: 20,
    },
    startBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    filterSection: { paddingTop: SPACING.md },
    filterTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
    filterRow: { paddingBottom: 4, gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    filterChipTextActive: {
        color: COLORS.white,
    },
    emptyFiltered: {
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        paddingVertical: 28,
        paddingHorizontal: 20,
        marginTop: SPACING.md,
        ...SHADOWS.small,
    },
    emptyFilteredTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 10 },
    emptyFilteredText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
    card: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.md,
        padding: SPACING.lg, marginTop: SPACING.md, ...SHADOWS.small,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    expertRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    expertIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    },
    expertInfo: { marginLeft: SPACING.md, flex: 1 },
    expertName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    expertSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '600' },
    scheduleRow: {
        flexDirection: 'row', gap: 16, marginTop: SPACING.md,
        paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider,
    },
    scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scheduleText: { fontSize: 12, color: COLORS.textSecondary },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider,
    },
    feeAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
    payBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    payBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    chatBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.sm,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    chatBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
