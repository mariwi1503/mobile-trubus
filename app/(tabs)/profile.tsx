import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { DEMO_ACCOUNTS, useApp, RegisteredUser } from '../../context/AppContext';
import { useAlert } from '../../context/AlertContext';

// ─── Auth Modal ───────────────────────────────────────────────
function AuthModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'consumer' | 'expert'>('consumer');
  const [specialization, setSpecialization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { showAlert } = useAlert();

  const reset = () => { setEmail(''); setPassword(''); setConfirmPassword(''); setName(''); setPhone(''); setRole('consumer'); setSpecialization(''); setError(''); };

  const handleLogin = () => {
    setError('');
    if (!phone || !password) { setError('Nomor Telepon dan password wajib diisi'); return; }
    const result = login(phone, password);
    if (result.success) { reset(); onClose(); }
    else setError(result.error || 'Login gagal');
  };

  const handleDemoLogin = (phoneNumber: string, passwordValue: string) => {
    setError('');
    const result = login(phoneNumber, passwordValue);
    if (result.success) { reset(); onClose(); }
    else setError(result.error || 'Login demo gagal');
  };

  const handleRegister = () => {
    setError('');
    if (!name || !password || !confirmPassword || !phone) { setError('Nama, Telepon, dan Password wajib diisi'); return; }
    if (password !== confirmPassword) { setError('Konfirmasi password tidak cocok'); return; }
    if (role === 'expert' && !specialization) { setError('Spesialisasi wajib diisi untuk ahli'); return; }
    const data: RegisteredUser = {
      name, email, password, phone, role, avatar: '',
      trubusCoins: 0,
      ...(role === 'expert' ? { specialization, experience: 1, fee: 50000 } : {}),
    };
    const result = register(data);
    if (result.success) { reset(); onClose(); showAlert('Selamat!', 'Registrasi berhasil!'); }
    else setError(result.error || 'Registrasi gagal');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{mode === 'login' ? 'Masuk' : 'Daftar'}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoRow}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoSmall} resizeMode="contain" />
            <Text style={styles.logoText}>Halo Trubus</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.authScrollContent}>
            {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color={COLORS.accent} /><Text style={styles.errorText}>{error}</Text></View> : null}

            {mode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama lengkap" placeholderTextColor={COLORS.textLight} />

                {/* Role Selection REMOVED */}

                <Text style={styles.inputLabel}>No. Telepon</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />

                <Text style={styles.inputLabel}>Email (Opsional)</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@contoh.com" placeholderTextColor={COLORS.textLight} keyboardType="email-address" autoCapitalize="none" />
              </>
            )}

            {mode === 'login' && (
              <>
                <Text style={styles.inputLabel}>No. Telepon</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />
              </>
            )}



            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="Minimal 6 karakter" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {mode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Ulangi password Anda" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} />
                </View>
              </>
            )}

            {mode === 'login' && (
              <View style={styles.demoSection}>
                <Text style={styles.demoSectionTitle}>Login demo</Text>
                <View style={styles.demoGrid}>
                  {DEMO_ACCOUNTS.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.demoCard,
                        account.role === 'expert' && styles.demoCardExpert,
                      ]}
                      onPress={() => handleDemoLogin(account.phone, account.password)}
                      activeOpacity={0.9}
                    >
                      <Ionicons
                        name={account.role === 'expert' ? 'school-outline' : 'person-outline'}
                        size={16}
                        color={account.role === 'expert' ? '#1B5E20' : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.demoCardTitle,
                          account.role === 'expert' && styles.demoCardTitleExpert,
                        ]}
                      >
                        {account.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={mode === 'login' ? handleLogin : handleRegister}>
              <Text style={styles.submitBtnText}>{mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchMode} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              <Text style={styles.switchText}>
                {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <Text style={styles.switchLink}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Text>
              </Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Expert Profile ───────────────────────────────────────────
function ExpertProfile() {
  const router = useRouter();
  const { user, logout, updateStatus } = useApp();
  const { showAlert } = useAlert();
  const expertMenuItems = [
    { icon: 'receipt-outline', label: 'Riwayat Konsultasi', route: '/(tabs)/consultation-history', color: '#2196F3' },
    { icon: 'notifications-outline', label: 'Notifikasi', route: '/notifications', color: '#9C27B0' },
    { icon: 'document-text-outline', label: 'FAQ', route: '/faq', color: '#4CAF50' },
    { icon: 'reader-outline', label: 'Syarat & Ketentuan', route: '/terms?readonly=1', color: '#7C3AED' },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', route: '/about', color: '#43A047' },
    { icon: 'help-circle-outline', label: 'Pusat Bantuan', route: '/customer-service', color: '#00BCD4' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.expertHeader}>
        <View style={styles.profileRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.expertBadgeRow}>
              <Text style={styles.name}>{user.name}</Text>
              <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={16} color="#FFD700" /></View>
            </View>
            <Text style={styles.expertSpec}>{user.specialization || 'Ahli Pertanian'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
              <View style={styles.expertRoleBadge}>
                <Ionicons name="school" size={10} color={COLORS.white} />
                <Text style={styles.expertRoleText}>Ahli Pertanian</Text>
              </View>
              <View style={[styles.expertRoleBadge, { backgroundColor: user.status === 'online' ? '#4CAF50' : user.status === 'busy' ? '#FF9800' : '#9E9E9E' }]}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white', marginRight: 4 }} />
                <Text style={styles.expertRoleText}>
                  {user.status === 'online' ? 'Tersedia' : user.status === 'busy' ? 'Sibuk' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusToggleContainer}>
          <Text style={styles.statusToggleLabel}>Set Status:</Text>
          <View style={styles.statusButtons}>
            {[
              { id: 'online', label: 'Tersedia', color: '#4CAF50' },
              { id: 'busy', label: 'Sibuk', color: '#FF9800' },
              { id: 'offline', label: 'Offline', color: '#9E9E9E' }
            ].map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.statusBtn,
                  user.status === s.id && { backgroundColor: s.color, borderColor: s.color }
                ]}
                onPress={() => updateStatus(s.id as any)}
              >
                <Text style={[styles.statusBtnText, user.status === s.id && { color: 'white' }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Pengaturan Akun</Text>
        <View style={styles.menuCard}>
          {expertMenuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index < expertMenuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => item.route ? router.push(item.route as any) : showAlert('Info', 'Fitur segera hadir!')}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => showAlert('Keluar', 'Yakin ingin keluar?', [{ text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: logout }])}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.accent} />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
      <Text style={styles.version}>Halo Trubus v1.0.0</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ─── Consumer Profile ─────────────────────────────────────────
function ConsumerProfile() {
  const router = useRouter();
  const { user, orders, getUnreadCount, logout } = useApp();
  const { showAlert } = useAlert();
  const pendingOrders = orders.filter(o => o.type === 'product' && o.status === 'pending_payment').length;
  const paidOrders = orders.filter(o => o.type === 'product' && (o.status === 'paid' || o.status === 'processing')).length;
  const shippedOrders = orders.filter(o => o.type === 'product' && o.status === 'shipped').length;

  const MENU_ITEMS = [
    {
      section: 'Pesanan & Konsultasi', items: [
        { id: 'orders', icon: 'receipt-outline', label: 'Pesanan Saya', route: '/orders', color: COLORS.primary },
        { id: 'consultations', icon: 'chatbubbles-outline', label: 'Riwayat Konsultasi', route: '/consultations', color: '#2196F3' },
        { id: 'wishlist', icon: 'heart-outline', label: 'Wishlist', route: '/(tabs)/catalog', color: '#E91E63' },
      ]
    },
    {
      section: 'Akun', items: [
        { id: 'addresses', icon: 'location-outline', label: 'Alamat Pengiriman', route: '/addresses', color: '#FF9800' },
        { id: 'notifications', icon: 'notifications-outline', label: 'Notifikasi', route: '/notifications', color: '#9C27B0' },
      ]
    },
    {
      section: 'Lainnya', items: [
        { id: 'faq', icon: 'document-text-outline', label: 'FAQ', route: '/faq', color: '#4CAF50' },
        { id: 'terms', icon: 'reader-outline', label: 'Syarat & Ketentuan', route: '/terms?readonly=1', color: '#7C3AED' },
        { id: 'help', icon: 'help-circle-outline', label: 'Pusat Bantuan', route: '/customer-service', color: '#00BCD4' },
        { id: 'about', icon: 'information-circle-outline', label: 'Tentang Aplikasi', route: '/about', color: '#4CAF50' },
        { id: 'rate', icon: 'star-outline', label: 'Beri Rating', route: '/rate-app', color: '#FFC107' },
      ]
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.roleBadge}><Ionicons name="person" size={10} color={COLORS.primary} /><Text style={styles.roleText}>Konsumen</Text></View>
          </View>
          <TouchableOpacity style={styles.editBtn}><Ionicons name="create-outline" size={18} color={COLORS.white} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.loyaltyContainer}>
        <LinearGradient
          colors={['#ffffff', '#fef9c3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loyaltyInner}
        >
          <TouchableOpacity activeOpacity={0.7} style={styles.loyaltyCoin} onPress={() => router.push('/coin-history')}>
            <View style={styles.loyaltyCoinIcon}>
              <Ionicons name="gift" size={16} color="#d97706" />
            </View>
            <View style={styles.loyaltyCoinContext}>
              <Text style={styles.loyaltyCoinValue}>{user.trubusCoins ? user.trubusCoins.toLocaleString('id-ID') : 0}</Text>
              <Text style={styles.loyaltyCoinLabel}>Trubus Coin</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.loyaltyDivider} />

          <TouchableOpacity activeOpacity={0.7} style={styles.loyaltyMember} onPress={() => router.push('/membership')}>
            <View style={styles.loyaltyMemberIconWrap}>
              <Ionicons name="ribbon" size={16} color="#d97706" />
            </View>
            <View style={styles.loyaltyMemberContext}>
              <Text style={styles.loyaltyMemberText}>Gold</Text>
              <Text style={styles.loyaltyMemberLabel}>Membership</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>


      {/* Order Status */}
      <View style={styles.orderStatusCard}>
        <Text style={styles.orderStatusTitle}>Status Pesanan</Text>
        <View style={styles.orderStatusRow}>
          {[{ icon: 'hourglass', label: 'Belum Bayar', count: pendingOrders, bg: '#FFF3E0', color: '#FF9800' },
          { icon: 'cube', label: 'Diproses', count: paidOrders, bg: '#E3F2FD', color: '#2196F3' },
          { icon: 'car', label: 'Dikirim', count: shippedOrders, bg: '#E8F5E9', color: '#4CAF50' },
          { icon: 'star', label: 'Beri Nilai', count: 0, bg: '#FCE4EC', color: '#E91E63' }].map((s, i) => (
            <TouchableOpacity key={i} style={styles.orderStatusItem} onPress={() => router.push('/orders')}>
              <View style={[styles.orderStatusIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={20} color={s.color} />
                {s.count > 0 && <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{s.count}</Text></View>}
              </View>
              <Text style={styles.orderStatusLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Menu */}
      {MENU_ITEMS.map((section) => (
        <View key={section.section} style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>{section.section}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]}
                onPress={() => item.route ? router.push(item.route as any) : showAlert('Info', 'Fitur segera hadir!')}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}><Ionicons name={item.icon as any} size={20} color={item.color} /></View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {item.id === 'notifications' && getUnreadCount() > 0 && <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{getUnreadCount()}</Text></View>}
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => showAlert('Keluar', 'Yakin ingin keluar?', [{ text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: logout }])}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.accent} /><Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
      <Text style={styles.version}>Halo Trubus v1.0.0</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ─── Guest Profile (Not Logged In) ───────────────────────────
function GuestProfile({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.guestContainer}>
      <View style={styles.guestHeader}>
        <Image source={require('../../assets/images/logo.png')} style={styles.guestLogo} resizeMode="contain" />
        <Text style={styles.guestTitle}>Halo Trubus</Text>
        <Text style={styles.guestSubtitle}>Solusi Tepat, Tanaman Sehat</Text>
      </View>
      <View style={styles.guestContent}>
        <View style={styles.guestIconCircle}>
          <Ionicons name="person-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.guestHeading}>Masuk untuk Pengalaman Lengkap</Text>
        <Text style={styles.guestDesc}>Konsultasi dengan ahli, belanja produk pertanian, dan dapatkan tips berkebun terbaik.</Text>
        <View style={styles.guestFeatures}>
          {[
            { icon: 'chatbubbles', text: 'Konsultasi ahli pertanian' },
            { icon: 'cart', text: 'Belanja bibit, pupuk & alat tani' },
            { icon: 'receipt', text: 'Lacak pesanan & konsultasi' },
          ].map((f, i) => (
            <View key={i} style={styles.guestFeatureRow}>
              <Ionicons name={f.icon as any} size={18} color={COLORS.primary} />
              <Text style={styles.guestFeatureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.guestLoginBtn} onPress={onLogin}>
          <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
          <Text style={styles.guestLoginText}>Masuk / Daftar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────
export default function ProfileScreen() {
  const { isLoggedIn, user } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  if (!isLoggedIn) {
    return (
      <>
        <GuestProfile onLogin={() => setShowAuth(true)} />
        <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  if (user.role === 'expert') {
    return <ExpertProfile />;
  }

  return <ConsumerProfile />;
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Auth Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl, maxHeight: '90%' },
  authScrollContent: { paddingBottom: SPACING.lg },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoSmall: { width: 36, height: 36, marginRight: 8 },
  logoText: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: RADIUS.sm, padding: 10, marginBottom: 12, gap: 6 },
  errorText: { fontSize: 13, color: COLORS.accent, flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text },
  eyeBtn: { padding: 10 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.white },
  roleBtnActive: { backgroundColor: COLORS.primary },
  roleBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  roleBtnTextActive: { color: COLORS.white },
  hintText: { fontSize: 11, color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  demoContainer: { marginTop: 12, alignItems: 'center', backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8 },
  demoLink: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  demoSection: { marginTop: 16, gap: 8 },
  demoSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  demoGrid: { flexDirection: 'row', gap: 10 },
  demoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F4FBF6',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  demoCardExpert: {
    backgroundColor: '#F2F7F3',
    borderColor: '#A5D6A7',
  },
  demoCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  demoCardTitleExpert: { color: '#1B5E20' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  switchMode: { alignItems: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: COLORS.textSecondary },
  switchLink: { color: COLORS.primary, fontWeight: '700' },
  // Guest
  guestContainer: { flex: 1, backgroundColor: COLORS.background },
  guestHeader: { backgroundColor: COLORS.primary, paddingTop: 48, paddingBottom: 32, alignItems: 'center', borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  guestLogo: { width: 100, height: 100 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginTop: 8 },
  guestSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  guestContent: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 24 },
  guestIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  guestHeading: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginTop: 16 },
  guestDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  guestFeatures: { width: '100%', marginTop: 20 },
  guestFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  guestFeatureText: { fontSize: 14, color: COLORS.text },
  guestLoginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, width: '100%', marginTop: 24, gap: 8 },
  guestLoginText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  // Consumer Profile
  header: { backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  roleText: { fontSize: 10, color: COLORS.white, fontWeight: '600', marginLeft: 3 },
  editBtn: { padding: 8 },
  loyaltyContainer: { marginHorizontal: SPACING.lg, marginTop: SPACING.lg, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.small, borderWidth: 1, borderColor: '#fef08a', overflow: 'hidden' },
  loyaltyInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  loyaltyCoin: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  loyaltyCoinIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  loyaltyCoinContext: { flex: 1, justifyContent: 'center' },
  loyaltyCoinValue: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  loyaltyCoinLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '400' },
  loyaltyDivider: { width: 1, height: 36, backgroundColor: '#fde68a', marginHorizontal: 16 },
  loyaltyMember: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 },
  loyaltyMemberIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  loyaltyMemberContext: { flex: 1, justifyContent: 'center' },
  loyaltyMemberText: { fontSize: 16, color: '#d97706', fontWeight: '500', marginBottom: 2 },
  loyaltyMemberLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '400' },
  orderStatusCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, padding: SPACING.lg, ...SHADOWS.small },
  orderStatusTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  orderStatusRow: { flexDirection: 'row', justifyContent: 'space-around' },
  orderStatusItem: { alignItems: 'center' },
  orderStatusIcon: { position: 'relative', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  statusBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  orderStatusLabel: { fontSize: 11, color: COLORS.textSecondary },
  menuSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  menuSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, ...SHADOWS.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  menuBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.xl, backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingVertical: SPACING.md, ...SHADOWS.small, borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.accent, marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: SPACING.lg },
  // Expert Profile
  expertHeader: { backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  expertBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedBadge: {},
  expertSpec: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  expertRoleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4, gap: 3 },
  expertRoleText: { fontSize: 10, color: COLORS.white, fontWeight: '600' },
  statusToggleContainer: { marginTop: 16, backgroundColor: COLORS.white, padding: 12, borderRadius: 12, ...SHADOWS.small },
  statusToggleLabel: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 8, fontWeight: '600' },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  statusBtnText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, padding: SPACING.lg, ...SHADOWS.small },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptySection: { alignItems: 'center', paddingVertical: 20 },
  emptySectionText: { fontSize: 13, color: COLORS.textLight, marginTop: 8 },
  requestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  requestIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  requestDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  requestStatus: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  requestStatusText: { fontSize: 11, fontWeight: '600' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  scheduleTime: { width: 50 },
  scheduleTimeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  scheduleLine: { width: 2, height: 30, backgroundColor: COLORS.primary, borderRadius: 1, marginHorizontal: 10 },
  scheduleInfo: { flex: 1 },
  scheduleClient: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  scheduleFee: { fontSize: 12, color: COLORS.textSecondary },
});
