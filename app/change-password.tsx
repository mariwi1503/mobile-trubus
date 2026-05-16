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
import { MOBILE_PASSWORD_MIN_LENGTH } from '../lib/auth';

type PasswordField = 'current' | 'new' | 'confirm';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isLoggedIn, user, changePassword } = useApp();
  const { showAlert } = useAlert();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/(tabs)/profile');
      return;
    }

    if (user.role !== 'consumer') {
      router.replace('/(tabs)/profile');
    }
  }, [isLoggedIn, router, user.role]);

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Password belum berhasil diperbarui');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    showAlert('Berhasil', 'Password Anda berhasil diperbarui.', [
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
        <Text style={styles.headerTitle}>Ubah Password</Text>
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
              <Text style={styles.screenTitle}>Perbarui Password Akun</Text>
              <Text style={styles.screenDescription}>
                Masukkan password saat ini lalu buat password baru minimal {MOBILE_PASSWORD_MIN_LENGTH} karakter.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.accent} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password Saat Ini</Text>
              <View style={styles.passwordField}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Masukkan password saat ini"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!visibleFields.current}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => toggleVisibility('current')}
                >
                  <Ionicons
                    name={visibleFields.current ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Password Baru</Text>
              <View style={styles.passwordField}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={`Minimal ${MOBILE_PASSWORD_MIN_LENGTH} karakter`}
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!visibleFields.new}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => toggleVisibility('new')}
                >
                  <Ionicons
                    name={visibleFields.new ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Konfirmasi Password Baru</Text>
              <View style={styles.passwordField}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ulangi password baru"
                  placeholderTextColor={COLORS.textLight}
                  secureTextEntry={!visibleFields.confirm}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => toggleVisibility('confirm')}
                >
                  <Ionicons
                    name={visibleFields.confirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textLight}
                  />
                </TouchableOpacity>
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
                <Text style={styles.saveBtnText}>Simpan Password Baru</Text>
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
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    paddingLeft: 14,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  passwordToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
