import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp, RegisteredUser } from '../../context/AppContext';
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
    if (result.success) { reset(); onClose(); showAlert('Selamat!', 'Registrasi berhasil! Anda mendapat bonus 50.000 Trubus Coin.'); }
    else setError(result.error || 'Registrasi gagal');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            <Text style={styles.logoText}>Halo Toko Trubus</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
              <View style={styles.demoContainer}>
                <Text style={styles.hintText}>Demo (Klik untuk isi):</Text>
                <TouchableOpacity onPress={() => { setPhone('081234567890'); setPassword('123456'); }}>
                  <Text style={styles.demoLink}>Konsumen: 081234567890 / 123456</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => { setPhone('081298765432'); setPassword('123456'); }}>
                  <Text style={styles.demoLink}>Ahli: 081298765432 / 123456</Text>
                </TouchableOpacity> */}
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

// ─── Expert Dashboard ─────────────────────────────────────────
function ExpertDashboard() {
  const router = useRouter();
  const { user, orders, logout, updateStatus } = useApp();
  const { showAlert } = useAlert();

  const myConsultations = orders.filter(o => o.type === 'consultation');
  const pending = myConsultations.filter(o => o.status === 'pending_payment');
  const scheduled = myConsultations.filter(o => o.status === 'paid');
  const completed = myConsultations.filter(o => o.status === 'completed' || o.status === 'delivered');
  const totalEarnings = myConsultations.filter(o => o.status === 'paid' || o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0);
  const thisMonthEarnings = myConsultations.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && (o.status === 'paid' || o.status === 'completed');
  }).reduce((s, o) => s + o.totalAmount, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
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

        {/* Status Toggle */}
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

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>Pendapatan</Text>
        <View style={styles.earningsRow}>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Bulan Ini</Text>
            <Text style={styles.earningsAmount}>Rp {thisMonthEarnings.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Total</Text>
            <Text style={styles.earningsAmount}>Rp {totalEarnings.toLocaleString('id-ID')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.coinRow} onPress={() => router.push('/top-up')}>
          <Ionicons name="wallet" size={18} color={COLORS.coinColor} />
          <Text style={styles.coinText}>Saldo: Rp {user.trubusCoins.toLocaleString('id-ID')}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="hourglass" size={24} color="#FF9800" />
          <Text style={styles.statNum}>{pending.length}</Text>
          <Text style={styles.statLabel}>Menunggu</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="calendar" size={24} color="#2196F3" />
          <Text style={styles.statNum}>{scheduled.length}</Text>
          <Text style={styles.statLabel}>Terjadwal</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-done" size={24} color="#4CAF50" />
          <Text style={styles.statNum}>{completed.length}</Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
          <Ionicons name="people" size={24} color="#E91E63" />
          <Text style={styles.statNum}>{myConsultations.length}</Text>
          <Text style={styles.statLabel}>Total Klien</Text>
        </View>
      </View>

      {/* Incoming Requests */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Permintaan Konsultasi</Text>
          <TouchableOpacity onPress={() => router.push('/consultations')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        {pending.length === 0 && scheduled.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textLight} />
            <Text style={styles.emptySectionText}>Belum ada permintaan konsultasi</Text>
          </View>
        ) : (
          [...pending, ...scheduled].slice(0, 5).map((item) => (
            <TouchableOpacity key={item.id} style={styles.requestItem} onPress={() => router.push(`/chat/${item.id}`)}>
              <View style={styles.requestIcon}>
                <Image
                  source={{ uri: item.clientAvatar || 'https://ui-avatars.com/api/?name=User' }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.clientName || 'Klien'}</Text>
                <Text style={styles.requestDate}>
                  {item.consultationDate ? new Date(item.consultationDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} {item.consultationTime ? `| ${item.consultationTime} WIB` : ''}
                </Text>
              </View>
              <View style={[styles.requestStatus, { backgroundColor: item.status === 'paid' ? '#E3F2FD' : '#FFF3E0' }]}>
                <Text style={[styles.requestStatusText, { color: item.status === 'paid' ? '#2196F3' : '#FF9800' }]}>
                  {item.status === 'paid' ? 'Terjadwal' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Schedule Management */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
        {scheduled.filter(s => {
          if (!s.consultationDate) return false;
          const today = new Date().toISOString().split('T')[0];
          return s.consultationDate === today;
        }).length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textLight} />
            <Text style={styles.emptySectionText}>Tidak ada jadwal hari ini</Text>
          </View>
        ) : (
          scheduled.filter(s => s.consultationDate === new Date().toISOString().split('T')[0]).map(item => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeText}>{item.consultationTime}</Text>
              </View>
              <View style={styles.scheduleLine} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleClient}>{item.clientName || 'Klien'}</Text>
                <Text style={styles.scheduleFee}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {[
          { icon: 'receipt-outline', label: 'Riwayat Konsultasi', route: '/consultations', color: '#2196F3' },
          { icon: 'notifications-outline', label: 'Notifikasi', route: '/notifications', color: '#9C27B0' },
          { icon: 'settings-outline', label: 'Pengaturan Profil', route: '', color: '#607D8B' },
          { icon: 'help-circle-outline', label: 'Pusat Bantuan', route: '/customer-service', color: '#00BCD4' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={() => item.route ? router.push(item.route as any) : showAlert('Info', 'Fitur segera hadir!')}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => showAlert('Keluar', 'Yakin ingin keluar?', [{ text: 'Batal', style: 'cancel' }, { text: 'Keluar', style: 'destructive', onPress: logout }])}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.accent} />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
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
        { id: 'settings', icon: 'settings-outline', label: 'Pengaturan', route: '', color: '#607D8B' },
      ]
    },
    {
      section: 'Lainnya', items: [
        { id: 'help', icon: 'help-circle-outline', label: 'Pusat Bantuan', route: '/customer-service', color: '#00BCD4' },
        { id: 'about', icon: 'information-circle-outline', label: 'Tentang Aplikasi', route: '', color: '#4CAF50' },
        { id: 'rate', icon: 'star-outline', label: 'Beri Rating', route: '', color: '#FFC107' },
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

      {/* Trubus Coins */}
      <View style={styles.coinCard}>
        <View style={styles.coinCardHeader}>
          <View style={styles.coinCardLeft}>
            <View style={styles.coinIconWrap}><Ionicons name="wallet" size={28} color={COLORS.coinColor} /></View>
            <View><Text style={styles.coinLabel}>Saldo Trubus Coin</Text><Text style={styles.coinAmount}>Rp {user.trubusCoins.toLocaleString('id-ID')}</Text></View>
          </View>
        </View>
        <View style={styles.coinActions}>
          {[{ icon: 'add-circle', label: 'Top Up', bg: '#E8F5E9', color: COLORS.primary },
          { icon: 'swap-horizontal', label: 'Transfer', bg: '#FFF3E0', color: COLORS.accentOrange },
          { icon: 'time', label: 'Riwayat', bg: '#E3F2FD', color: COLORS.info }].map((a, i) => (
            <TouchableOpacity key={i} style={styles.coinAction} onPress={() => router.push('/top-up')}>
              <View style={[styles.coinActionIcon, { backgroundColor: a.bg }]}><Ionicons name={a.icon as any} size={20} color={a.color} /></View>
              <Text style={styles.coinActionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
      <Text style={styles.version}>Halo Toko Trubus v1.0.0</Text>
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
        <Text style={styles.guestTitle}>Halo Toko Trubus</Text>
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
            { icon: 'wallet', text: 'Kelola saldo Trubus Coin' },
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
    return <ExpertDashboard />;
  }

  return <ConsumerProfile />;
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Auth Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, padding: SPACING.xl, maxHeight: '90%' },
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
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
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
  guestLoginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, width: '100%', marginTop: 24, gap: 8 },
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
  coinCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginTop: 10, padding: SPACING.lg, ...SHADOWS.medium },
  coinCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coinCardLeft: { flexDirection: 'row', alignItems: 'center' },
  coinIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  coinLabel: { fontSize: 12, color: COLORS.textSecondary },
  coinAmount: { fontSize: 22, fontWeight: '700', color: COLORS.coinColor },
  coinActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.divider },
  coinAction: { alignItems: 'center' },
  coinActionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  coinActionText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  orderStatusCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, padding: SPACING.lg, ...SHADOWS.small },
  orderStatusTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  orderStatusRow: { flexDirection: 'row', justifyContent: 'space-around' },
  orderStatusItem: { alignItems: 'center' },
  orderStatusIcon: { position: 'relative', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.accent, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  statusBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  orderStatusLabel: { fontSize: 11, color: COLORS.textSecondary },
  menuSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  menuSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.small },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  menuBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.lg, marginTop: SPACING.xl, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingVertical: SPACING.md, ...SHADOWS.small, borderWidth: 1, borderColor: '#FFCDD2' },
  logoutText: { fontSize: 14, fontWeight: '600', color: COLORS.accent, marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: SPACING.lg },
  // Expert Dashboard
  expertHeader: { backgroundColor: '#1B5E20', paddingTop: 48, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  expertBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedBadge: {},
  expertSpec: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  expertRoleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4, gap: 3 },
  expertRoleText: { fontSize: 10, color: COLORS.white, fontWeight: '600' },
  statusToggleContainer: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12 },
  statusToggleLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginBottom: 8, fontWeight: '600' },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent' },
  statusBtnText: { fontSize: 11, color: 'white', fontWeight: '600' },
  earningsCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginTop: -20, padding: SPACING.lg, ...SHADOWS.medium },
  earningsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  earningsRow: { flexDirection: 'row' },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsLabel: { fontSize: 12, color: COLORS.textSecondary },
  earningsAmount: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  earningsDivider: { width: 1, backgroundColor: COLORS.divider },
  coinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider },
  coinText: { fontSize: 14, fontWeight: '600', color: COLORS.coinColor },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, gap: 10 },
  statCard: { width: '47%', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', ...SHADOWS.small },
  statNum: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginHorizontal: SPACING.lg, marginTop: SPACING.lg, padding: SPACING.lg, ...SHADOWS.small },
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
