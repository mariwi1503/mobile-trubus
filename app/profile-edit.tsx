import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { MobileConsumerGender } from '../lib/auth';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { isLoggedIn, user, updateProfile } = useApp();
  const { showAlert } = useAlert();
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [gender, setGender] = useState<MobileConsumerGender>(user.gender || 'MALE');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/(tabs)/profile');
      return;
    }

    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setGender(user.gender || 'MALE');
  }, [isLoggedIn, router, user.email, user.gender, user.name, user.phone]);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const result = await updateProfile({
      name,
      email,
      phone,
      gender,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Profil belum berhasil diperbarui');
      return;
    }

    showAlert('Berhasil', 'Profil Anda berhasil diperbarui.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formScrollContent}
          >
            <View style={styles.screenIntro}>
              <Text style={styles.screenTitle}>Perbarui Data Akun</Text>
              <Text style={styles.screenDescription}>
                Ubah nama, email, nomor WhatsApp, dan jenis kelamin Anda di sini.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.accent} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@contoh.com"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>No. Telepon / WhatsApp</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="08xxxxxxxxxx"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldHint}>
                Nomor ini tetap bisa dipakai untuk login dan menerima pembaruan akun.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Jenis Kelamin</Text>
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
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={isActive ? COLORS.white : COLORS.textSecondary}
                      />
                      <Text style={[styles.selectionBtnText, isActive && styles.selectionBtnTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  keyboardWrap: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 0,
  },
  contentCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  formScrollContent: {
    padding: SPACING.lg,
    paddingBottom: 28,
  },
  screenIntro: {
    marginBottom: SPACING.lg,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  screenDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F3',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD6D2',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.accent,
    flex: 1,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.white,
  },
  selectionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectionBtnTextActive: {
    color: COLORS.white,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    ...SHADOWS.medium,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
