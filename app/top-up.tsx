import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
    { id: 'bca', name: 'BCA Virtual Account', icon: 'card' },
    { id: 'mandiri', name: 'Mandiri Virtual Account', icon: 'card' },
    { id: 'gopay', name: 'GoPay', icon: 'wallet' },
    { id: 'ovo', name: 'OVO', icon: 'wallet' },
];

const PRESET_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

export default function TopUpScreen() {
    const router = useRouter();
    const { user, topUp, transfer, transactions } = useApp();
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState<'topup' | 'transfer'>('topup');

    // Top Up State
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');

    // Transfer State
    const [recipient, setRecipient] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const handleTopUp = () => {
        const val = parseInt(amount.replace(/\D/g, ''));
        if (!val || val < 10000) {
            showAlert('Error', 'Minimal top up Rp 10.000');
            return;
        }
        if (!selectedMethod) {
            showAlert('Error', 'Pilih metode pembayaran');
            return;
        }

        showAlert('Konfirmasi', `Top up Rp ${val.toLocaleString('id-ID')} via ${selectedMethod}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Bayar', onPress: () => {
                    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || 'Unknown';
                    topUp(val, method);
                    showAlert('Berhasil', 'Top up berhasil!');
                    setAmount('');
                    setSelectedMethod('');
                }
            }
        ]);
    };

    const handleTransfer = () => {
        const val = parseInt(transferAmount.replace(/\D/g, ''));
        if (!val || val < 1000) {
            showAlert('Error', 'Minimal transfer Rp 1.000');
            return;
        }
        if (!recipient) {
            showAlert('Error', 'Masukkan email atau nomor HP penerima');
            return;
        }
        if (val > user.trubusCoins) {
            showAlert('Error', 'Saldo tidak mencukupi');
            return;
        }

        showAlert('Konfirmasi', `Transfer Rp ${val.toLocaleString('id-ID')} ke ${recipient}?`, [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Kirim', onPress: () => {
                    const result = transfer(recipient, val);
                    if (result.success) {
                        showAlert('Berhasil', result.message);
                        setTransferAmount('');
                        setRecipient('');
                    } else {
                        showAlert('Gagal', result.message);
                    }
                }
            }
        ]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trubus Pay</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Saldo Anda</Text>
                <Text style={styles.balanceValue}>Rp {user.trubusCoins.toLocaleString('id-ID')}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'topup' && styles.activeTab]}
                    onPress={() => setActiveTab('topup')}
                >
                    <Text style={[styles.tabText, activeTab === 'topup' && styles.activeTabText]}>Top Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'transfer' && styles.activeTab]}
                    onPress={() => setActiveTab('transfer')}
                >
                    <Text style={[styles.tabText, activeTab === 'transfer' && styles.activeTabText]}>Transfer</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'topup' ? (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Nominal Top Up</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencyPrefix}>Rp</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={(text) => {
                                    const numeric = text.replace(/\D/g, '');
                                    setAmount(numeric ? parseInt(numeric).toLocaleString('id-ID') : '');
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>

                        <View style={styles.presetContainer}>
                            {PRESET_AMOUNTS.map((val) => (
                                <TouchableOpacity
                                    key={val}
                                    style={[styles.presetBtn, amount === val.toLocaleString('id-ID') && styles.presetBtnActive]}
                                    onPress={() => setAmount(val.toLocaleString('id-ID'))}
                                >
                                    <Text style={[styles.presetText, amount === val.toLocaleString('id-ID') && styles.presetTextActive]}>
                                        {val.toLocaleString('id-ID')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Metode Pembayaran</Text>
                        {PAYMENT_METHODS.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[styles.methodCard, selectedMethod === method.id && styles.methodCardActive]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <Ionicons name={method.icon as any} size={24} color={selectedMethod === method.id ? COLORS.primary : COLORS.textSecondary} />
                                <Text style={[styles.methodName, selectedMethod === method.id && styles.methodNameActive]}>{method.name}</Text>
                                {selectedMethod === method.id && (
                                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={styles.actionBtn} onPress={handleTopUp}>
                            <Text style={styles.actionBtnText}>Bayar Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Penerima</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email atau Nomor HP"
                            value={recipient}
                            onChangeText={setRecipient}
                            autoCapitalize="none"
                        />

                        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Nominal Transfer</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencyPrefix}>Rp</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={transferAmount}
                                onChangeText={(text) => {
                                    const numeric = text.replace(/\D/g, '');
                                    setTransferAmount(numeric ? parseInt(numeric).toLocaleString('id-ID') : '');
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleTransfer}>
                            <Text style={styles.actionBtnText}>Kirim Uang</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* History */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
                    {transactions.slice(0, 5).map((tx) => (
                        <View key={tx.id} style={styles.txCard}>
                            <View style={[styles.txIcon, {
                                backgroundColor: tx.type === 'topup' || tx.type === 'transfer_in' ? '#E8F5E9' : '#FFEBEE'
                            }]}>
                                <Ionicons
                                    name={tx.type === 'topup' ? 'add' : tx.type === 'transfer_in' ? 'arrow-down' : 'arrow-up'}
                                    size={20}
                                    color={tx.type === 'topup' || tx.type === 'transfer_in' ? COLORS.primary : COLORS.accent}
                                />
                            </View>
                            <View style={styles.txInfo}>
                                <Text style={styles.txDesc}>{tx.description}</Text>
                                <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                            </View>
                            <Text style={[styles.txAmount, {
                                color: tx.type === 'topup' || tx.type === 'transfer_in' ? COLORS.primary : COLORS.accent
                            }]}>
                                {tx.type === 'topup' || tx.type === 'transfer_in' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </Text>
                        </View>
                    ))}
                    {transactions.length === 0 && (
                        <Text style={styles.emptyText}>Belum ada transaksi</Text>
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white,
        borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    balanceCard: {
        margin: SPACING.lg, padding: SPACING.lg, borderRadius: RADIUS.lg,
        backgroundColor: COLORS.primary, alignItems: 'center', ...SHADOWS.medium,
    },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
    balanceValue: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
    tabs: {
        flexDirection: 'row', paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.white,
    },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: COLORS.primary },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
    activeTabText: { color: COLORS.primary },
    content: { flex: 1 },
    formSection: { padding: SPACING.lg, backgroundColor: COLORS.white, marginBottom: SPACING.md },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border,
        paddingVertical: 8,
    },
    currencyPrefix: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginRight: 8 },
    amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: COLORS.text },
    presetContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    presetBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
    },
    presetBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
    presetText: { fontSize: 14, color: COLORS.text },
    presetTextActive: { color: COLORS.primary, fontWeight: '600' },
    methodCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: RADIUS.md,
        borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
    },
    methodCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
    methodName: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.text, fontWeight: '500' },
    methodNameActive: { color: COLORS.primary, fontWeight: '600' },
    actionBtn: {
        backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16,
        alignItems: 'center', marginTop: 24, ...SHADOWS.small,
    },
    actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    input: {
        borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
        paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: COLORS.text,
    },
    historySection: { padding: SPACING.lg, backgroundColor: COLORS.white, flex: 1 },
    txCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    txDate: { fontSize: 12, color: COLORS.textSecondary },
    txAmount: { fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 },
});
