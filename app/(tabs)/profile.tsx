import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp, RegisteredUser } from '../../context/AppContext';
import { useAlert } from '../../context/AlertContext';
import {
  MOBILE_PASSWORD_MIN_LENGTH,
  MobileConsumerGender,
  requestMobileRegistrationOtp,
  validateEmail,
  validateIndonesianMobilePhone,
  validatePassword,
  verifyMobileRegistrationOtp,
} from '../../lib/auth';

const DEV_DEFAULT_LOGIN_PHONE = '6287861888809';
const DEV_DEFAULT_LOGIN_PASSWORD = '@Password1';
const OTP_RESEND_SECONDS = 180;
const OTP_LENGTH = 6;

// ─── Auth Modal ───────────────────────────────────────────────
function AuthModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerStep, setRegisterStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(DEV_DEFAULT_LOGIN_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(DEV_DEFAULT_LOGIN_PHONE);
  const [otpDigits, setOtpDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [gender, setGender] = useState<MobileConsumerGender>('MALE');
  const [registrationToken, setRegistrationToken] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (otpResendCountdown <= 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setOtpResendCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [otpResendCountdown]);

  const reset = (nextMode: 'login' | 'register' = 'login') => {
    setMode(nextMode);
    setRegisterStep('phone');
    setEmail('');
    setPassword(nextMode === 'login' ? DEV_DEFAULT_LOGIN_PASSWORD : '');
    setConfirmPassword('');
    setName('');
    setPhone(nextMode === 'login' ? DEV_DEFAULT_LOGIN_PHONE : '');
    setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
    setGender('MALE');
    setRegistrationToken('');
    setOtpResendCountdown(0);
    setShowPassword(false);
    setError('');
  };

  const closeModal = () => {
    reset();
    onClose();
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const otpValue = otpDigits.join('');

  const authHeroContent = (() => {
    if (mode === 'login') {
      return {
        title: 'Masuk ke akun Anda',
        description: 'Lanjutkan belanja, konsultasi, dan pantau aktivitas Anda di Halo Trubus.',
      };
    }

    if (registerStep === 'phone') {
      return {
        title: 'Buat akun baru',
        description: 'Gunakan nomor WhatsApp aktif untuk memulai pengalaman yang aman dan personal.',
      };
    }

    if (registerStep === 'otp') {
      return {
        title: 'Verifikasi kode OTP',
        description: `Masukkan 6 digit kode yang telah dikirim ke ${phone || 'nomor Anda'}.`,
      };
    }

    return {
      title: 'Selesaikan profil akun Anda',
      description: 'Tambahkan identitas dasar agar akun siap dipakai di seluruh layanan Trubus.',
    };
  })();

  const focusOtpField = (index: number) => {
    otpInputRefs.current[index]?.focus();
  };

  const handleOtpDigitChange = (value: string, index: number) => {
    const sanitizedValue = value.replace(/\D/g, '');

    if (!sanitizedValue) {
      setOtpDigits((current) => {
        const next = [...current];
        next[index] = '';
        return next;
      });
      return;
    }

    if (sanitizedValue.length > 1) {
      const nextDigits = Array.from({ length: OTP_LENGTH }, (_, digitIndex) =>
        sanitizedValue[digitIndex] ?? otpDigits[digitIndex] ?? '',
      ).slice(0, OTP_LENGTH);

      setOtpDigits(nextDigits);
      focusOtpField(Math.min(sanitizedValue.length, OTP_LENGTH - 1));
      return;
    }

    setOtpDigits((current) => {
      const next = [...current];
      next[index] = sanitizedValue;
      return next;
    });

    if (index < OTP_LENGTH - 1) {
      focusOtpField(index + 1);
    }
  };

  const handleOtpKeyPress = (
    event: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (event.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      focusOtpField(index - 1);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!phone) { setError('Nomor Telepon wajib diisi'); return; }
    setIsSubmitting(true);
    const result = await login(phone, password);
    setIsSubmitting(false);
    if (result.success) { reset(); onClose(); }
    else setError(result.error || 'Login gagal');
  };

  const handleRequestOtp = async () => {
    setError('');
    const phoneError = validateIndonesianMobilePhone(phone);
    if (phoneError) { setError(phoneError); return; }

    setIsSubmitting(true);
    try {
      await requestMobileRegistrationOtp(phone);
      setRegisterStep('otp');
      setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      setRegistrationToken('');
      setOtpResendCountdown(OTP_RESEND_SECONDS);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OTP gagal dikirim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otpValue.trim().length !== OTP_LENGTH) { setError('Kode OTP harus 6 digit'); return; }

    setIsSubmitting(true);
    try {
      const result = await verifyMobileRegistrationOtp(phone, otpValue);
      setRegistrationToken(result.registrationToken);
      setRegisterStep('profile');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'OTP tidak valid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('Nama, Email, Telepon, dan Password wajib diisi');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    const passwordError = validatePassword(password, {
      minLength: MOBILE_PASSWORD_MIN_LENGTH,
    });
    if (passwordError) { setError(passwordError); return; }

    if (password !== confirmPassword) { setError('Konfirmasi password tidak cocok'); return; }
    if (!registrationToken) { setError('Sesi OTP sudah habis. Silakan verifikasi nomor HP lagi'); return; }

    const data: RegisteredUser = {
      name,
      email,
      password,
      phone,
      gender,
    };

    setIsSubmitting(true);
    const result = await register(data, registrationToken);
    setIsSubmitting(false);
    if (result.success) { reset(); onClose(); showAlert('Selamat!', 'Registrasi berhasil!'); }
    else setError(result.error || 'Registrasi gagal');
  };

  const handleResendOtp = async () => {
    if (otpResendCountdown > 0 || isSubmitting) {
      return;
    }

    await handleRequestOtp();
  };

  const handleBackToPhone = () => {
    setError('');
    setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
    setRegistrationToken('');
    setRegisterStep('phone');
    setOtpResendCountdown(0);
  };

  const handleSwitchMode = () => {
    reset(mode === 'login' ? 'register' : 'login');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{mode === 'login' ? 'Masuk' : 'Daftar'}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.authScrollContent}>
            <View style={styles.authIntroWrap}>
              <View style={[styles.authIntroImageCard, mode === 'register' && registerStep === 'otp' ? styles.authIntroImageCardOtp : null]}>
                <Image
                  source={require('../../assets/images/logo-header.png')}
                  style={styles.authIntroImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.authIntroTitle}>{authHeroContent.title}</Text>
              <Text style={styles.authIntroText}>{authHeroContent.description}</Text>
            </View>

            {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color={COLORS.accent} /><Text style={styles.errorText}>{error}</Text></View> : null}

            {mode === 'register' && (
              <>
                {registerStep === 'phone' && (
                  <>
                    <Text style={styles.inputLabel}>No. Telepon / WhatsApp</Text>
                    <View style={styles.inputShell}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="call-outline" size={18} color={COLORS.primaryDark} />
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="08xxxxxxxxxx"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <Text style={styles.hintText}>Nomor ini akan dipakai untuk masuk dan menerima pembaruan akun.</Text>
                  </>
                )}

                {registerStep === 'otp' && (
                  <>
                    <View style={styles.otpSection}>
                      <View style={styles.otpFieldRow}>
                        {otpDigits.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(element) => {
                              otpInputRefs.current[index] = element;
                            }}
                            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                            value={digit}
                            onChangeText={(value) => handleOtpDigitChange(value, index)}
                            onKeyPress={(event) => handleOtpKeyPress(event, index)}
                            placeholder="•"
                            placeholderTextColor="#B8C7B7"
                            keyboardType="number-pad"
                            textAlign="center"
                            maxLength={index === 0 ? OTP_LENGTH : 1}
                            autoFocus={index === 0}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={styles.inlineActionRow}>
                      <TouchableOpacity onPress={handleBackToPhone} disabled={isSubmitting}>
                        <Text style={styles.inlineActionText}>Ganti nomor</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleResendOtp} disabled={otpResendCountdown > 0 || isSubmitting}>
                        <Text style={[styles.inlineActionText, otpResendCountdown > 0 && styles.inlineActionTextDisabled]}>
                          {otpResendCountdown > 0 ? `Kirim ulang ${formatCountdown(otpResendCountdown)}` : 'Kirim ulang OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {registerStep === 'profile' && (
                  <>
                    <Text style={styles.inputLabel}>Nama Lengkap</Text>
                    <View style={styles.inputShell}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="person-outline" size={18} color={COLORS.primaryDark} />
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={name}
                        onChangeText={setName}
                        placeholder="Masukkan nama lengkap"
                        placeholderTextColor={COLORS.textLight}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputShell}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="mail-outline" size={18} color={COLORS.primaryDark} />
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="email@contoh.com"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <Text style={styles.inputLabel}>Jenis Kelamin</Text>
                    <View style={styles.selectionRow}>
                      {[
                        { label: 'Laki-laki', value: 'MALE' as const, icon: 'man-outline' },
                        { label: 'Perempuan', value: 'FEMALE' as const, icon: 'woman-outline' },
                      ].map((option) => {
                        const isActive = gender === option.value;

                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[styles.selectionBtn, isActive && styles.selectionBtnActive]}
                            onPress={() => setGender(option.value)}
                          >
                            <Ionicons
                              name={option.icon as any}
                              size={16}
                              color={isActive ? COLORS.white : COLORS.primary}
                            />
                            <Text style={[styles.selectionBtnText, isActive && styles.selectionBtnTextActive]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordRow}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="lock-closed-outline" size={18} color={COLORS.primaryDark} />
                      </View>
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Buat password"
                        placeholderTextColor={COLORS.textLight}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textLight} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.hintText}>
                      Gunakan password minimal {MOBILE_PASSWORD_MIN_LENGTH} karakter.
                    </Text>

                    <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                    <View style={styles.passwordRow}>
                      <View style={styles.inputIconWrap}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primaryDark} />
                      </View>
                      <TextInput
                        style={styles.passwordInput}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Ulangi password Anda"
                        placeholderTextColor={COLORS.textLight}
                        secureTextEntry={!showPassword}
                      />
                    </View>

                    <View style={styles.inlineActionRow}>
                      <TouchableOpacity onPress={handleBackToPhone} disabled={isSubmitting}>
                        <Text style={styles.inlineActionText}>Ulang verifikasi nomor</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}

            {mode === 'login' && (
              <>
                <Text style={styles.inputLabel}>No. Telepon</Text>
                <View style={styles.inputShell}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="call-outline" size={18} color={COLORS.primaryDark} />
                  </View>
                  <TextInput style={styles.inputField} value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" placeholderTextColor={COLORS.textLight} keyboardType="phone-pad" />
                </View>
              </>
            )}

            {mode === 'login' && (
              <>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <View style={styles.inputIconWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.primaryDark} />
                  </View>
                  <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="Masukkan password" placeholderTextColor={COLORS.textLight} secureTextEntry={!showPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={
                mode === 'login'
                  ? handleLogin
                  : registerStep === 'phone'
                    ? handleRequestOtp
                    : registerStep === 'otp'
                      ? handleVerifyOtp
                      : handleRegister
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login'
                    ? 'Masuk'
                    : registerStep === 'phone'
                      ? 'Kirim OTP'
                      : registerStep === 'otp'
                        ? 'Verifikasi OTP'
                        : 'Buat Akun'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchMode}
              onPress={handleSwitchMode}
              disabled={isSubmitting}
            >
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
  const completedOrders = orders.filter(
    (o) => o.type === 'product' && (o.status === 'delivered' || o.status === 'completed'),
  ).length;

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
        { id: 'password', icon: 'lock-closed-outline', label: 'Ubah Password', route: '/change-password', color: '#2E7D32' },
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
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/profile-edit')}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </TouchableOpacity>
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
          { icon: 'checkmark-done', label: 'Selesai', count: completedOrders, bg: '#E8F5E9', color: '#4CAF50' }].map((s, i) => (
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
  const router = useRouter();
  const { login } = useLocalSearchParams<{ login?: string }>();
  const { isAuthHydrating, isLoggedIn, user } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      return;
    }

    if (login === '1') {
      setShowAuth(true);
    }
  }, [isLoggedIn, login]);

  const handleCloseAuth = () => {
    setShowAuth(false);

    if (login === '1') {
      router.replace('/(tabs)/profile');
    }
  };

  if (isAuthHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat sesi akun...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <GuestProfile onLogin={() => setShowAuth(true)} />
        <AuthModal visible={showAuth} onClose={handleCloseAuth} />
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 29, 20, 0.44)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FCFEF9', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING.xl, maxHeight: '92%' },
  authScrollContent: { paddingBottom: SPACING.xl },
  modalHandle: { width: 48, height: 5, backgroundColor: '#D7E2D0', borderRadius: RADIUS.full, alignSelf: 'center', marginBottom: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#183624' },
  authIntroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  authIntroImageCard: { width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F8EE', borderRadius: 28, paddingHorizontal: 18, paddingVertical: 20, borderWidth: 1, borderColor: '#E0EBD8' },
  authIntroImageCardOtp: { paddingVertical: 16 },
  authIntroImage: { width: '100%', height: 140 },
  authIntroTitle: { marginTop: 14, fontSize: 22, fontWeight: '800', color: '#183624', textAlign: 'center' },
  authIntroText: { marginTop: 6, fontSize: 13, lineHeight: 20, color: '#6A7F71', textAlign: 'center', paddingHorizontal: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F0', borderRadius: 18, padding: 12, marginBottom: 14, gap: 8, borderWidth: 1, borderColor: '#FFD6D2' },
  errorText: { fontSize: 13, color: COLORS.accent, flex: 1, lineHeight: 18 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#244531', marginBottom: 8, marginTop: 14 },
  inputShell: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: '#D9E4D5', paddingHorizontal: 12, minHeight: 56, ...SHADOWS.small },
  inputIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EEF7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  inputField: { flex: 1, fontSize: 15, color: '#183624', paddingVertical: 14 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: '#D9E4D5', paddingHorizontal: 12, minHeight: 56, ...SHADOWS.small },
  passwordInput: { flex: 1, fontSize: 15, color: '#183624', paddingVertical: 14 },
  eyeBtn: { padding: 8 },
  selectionRow: { flexDirection: 'row', gap: 10 },
  selectionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#B7D2B4', backgroundColor: COLORS.white },
  selectionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  selectionBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  selectionBtnTextActive: { color: COLORS.white },
  otpSection: { alignItems: 'center', marginTop: 12, marginBottom: 4, backgroundColor: '#F7FBF3', borderRadius: 24, borderWidth: 1, borderColor: '#E0EBD8', paddingHorizontal: 14, paddingVertical: 18 },
  otpFieldRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  otpInput: { width: 46, height: 58, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: '#D7E3D3', fontSize: 24, fontWeight: '800', color: '#173523', ...SHADOWS.small },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: '#F4FBF1' },
  inlineActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12 },
  inlineActionText: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '700' },
  inlineActionTextDisabled: { color: COLORS.textLight },
  hintText: { fontSize: 12, color: '#6A7F71', marginTop: 10, lineHeight: 18 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 18, paddingVertical: 17, alignItems: 'center', marginTop: 22, ...SHADOWS.medium },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  switchMode: { alignItems: 'center', marginTop: 18 },
  switchText: { fontSize: 14, color: COLORS.textSecondary },
  switchLink: { color: COLORS.primaryDark, fontWeight: '800' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, paddingHorizontal: SPACING.xl },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
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
