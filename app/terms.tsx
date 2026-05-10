import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function TermsScreen() {
  const router = useRouter();
  const { readonly } = useLocalSearchParams<{ readonly?: string }>();
  const { setHasAcceptedTerms } = useApp();
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isPreparingPdf, setIsPreparingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const isReadOnly = readonly === '1';

  useEffect(() => {
    let isMounted = true;

    const loadPdf = async () => {
      try {
        setIsPreparingPdf(true);
        setPdfError(null);

        const asset = Asset.fromModule(require('../docs/syarat-dan-ketentuan.pdf'));

        if (Platform.OS !== 'web' && !asset.localUri) {
          await asset.downloadAsync();
        }

        if (!isMounted) return;

        setPdfUri(asset.localUri ?? asset.uri);
      } catch {
        if (!isMounted) return;
        setPdfError('Dokumen PDF tidak dapat dimuat.');
      } finally {
        if (isMounted) {
          setIsPreparingPdf(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleContinue = () => {
    if (!hasAgreed) return;
    setHasAcceptedTerms(true);
    router.replace('/(tabs)');
  };

  const renderPdfState = () => {
    if (isPreparingPdf) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.stateTitle}>Menyiapkan dokumen</Text>
          <Text style={styles.stateSubtitle}>PDF syarat dan ketentuan sedang dimuat.</Text>
        </View>
      );
    }

    if (!pdfUri || pdfError) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="document-text-outline" size={32} color={COLORS.textSecondary} />
          <Text style={styles.stateTitle}>Dokumen belum tersedia</Text>
          <Text style={styles.stateSubtitle}>{pdfError ?? 'PDF tidak ditemukan.'}</Text>
        </View>
      );
    }

    return (
      <WebView
        source={{ uri: pdfUri }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onError={() => setPdfError('Dokumen PDF tidak dapat ditampilkan di perangkat ini.')}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateSubtitle}>Membuka dokumen...</Text>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        {isReadOnly ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <View style={styles.headerText}>
          <Text style={styles.title}>Syarat & Ketentuan</Text>
        </View>
      </View>

      <View style={styles.viewerContainer}>{renderPdfState()}</View>

      {!isReadOnly && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasAgreed((current) => !current)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, hasAgreed && styles.checkboxChecked]}>
              {hasAgreed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>Saya setuju dengan syarat dan ketentuan Halo Trubus.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !hasAgreed && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!hasAgreed}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>Lanjutkan</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e6ebe2',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e3e8de',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
  },
  stateTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  stateSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#e6ebe2',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#b8c4b1',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
  },
  continueButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  continueButtonDisabled: {
    backgroundColor: '#b9c7b5',
  },
  continueButtonText: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
