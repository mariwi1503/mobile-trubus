import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { TERMS_MARKDOWN } from '../data/termsMarkdown';

type TermsBlock =
  | { type: 'heading1'; text: string }
  | { type: 'heading2'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

function parseTermsMarkdown(markdown: string): TermsBlock[] {
  const blocks: TermsBlock[] = [];
  const lines = markdown.split('\n');
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(' ').trim();
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      blocks.push({ type: 'heading1', text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'heading2', text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: line.slice(2).trim() });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return blocks;
}

const TERMS_BLOCKS = parseTermsMarkdown(TERMS_MARKDOWN);

export default function TermsScreen() {
  const router = useRouter();
  const { readonly } = useLocalSearchParams<{ readonly?: string }>();
  const { setHasAcceptedTerms } = useApp();
  const [hasAgreed, setHasAgreed] = useState(false);

  const isReadOnly = readonly === '1';

  const handleContinue = () => {
    if (!hasAgreed) return;
    setHasAcceptedTerms(true);
    router.replace('/(tabs)');
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

      <ScrollView
        style={styles.viewerContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {TERMS_BLOCKS.map((block, index) => {
          if (block.type === 'heading1') {
            return (
              <Text key={`h1-${index}`} style={styles.documentTitle}>
                {block.text}
              </Text>
            );
          }

          if (block.type === 'heading2') {
            return (
              <Text key={`h2-${index}`} style={styles.sectionTitle}>
                {block.text}
              </Text>
            );
          }

          if (block.type === 'bullet') {
            return (
              <View key={`bullet-${index}`} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{block.text}</Text>
              </View>
            );
          }

          return (
            <Text key={`p-${index}`} style={styles.paragraph}>
              {block.text}
            </Text>
          );
        })}
      </ScrollView>

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
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  documentTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#183624',
    marginBottom: 14,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#214a30',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 6,
  },
  bulletMark: {
    width: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#214a30',
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 24,
    color: COLORS.text,
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
