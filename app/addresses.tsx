import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

type ActiveTab = 'alamat' | 'toko';

const NEARBY_STORES = [
  {
    id: 'store_1',
    name: 'Trubus Menteng',
    distance: '1.2 km',
    address: 'Jl. HOS Cokroaminoto No. 72, Menteng',
  },
  {
    id: 'store_2',
    name: 'Trubus Depok',
    distance: '4.8 km',
    address: 'Jl. Margonda Raya No. 211, Kemiri Muka',
  },
  {
    id: 'store_3',
    name: 'Trubus Bintaro',
    distance: '7.3 km',
    address: 'Jl. Boulevard Bintaro Jaya Blok RA 11',
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const {
    addresses,
    isAddressesLoading,
    isLoggedIn,
    refreshAddresses,
    removeAddress,
    setDefaultAddress,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('alamat');
  const [selectedStoreId, setSelectedStoreId] = useState(NEARBY_STORES[0].id);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    void refreshAddresses().catch(() => {
      // Keep the last known address list if refresh fails.
    });
  }, [isLoggedIn, refreshAddresses]);

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Hapus Alamat', `Hapus alamat "${label}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeAddress(id);
            } catch (error) {
              Alert.alert(
                'Gagal',
                error instanceof Error ? error.message : 'Alamat gagal dihapus.',
              );
            }
          })();
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (error) {
      Alert.alert(
        'Gagal',
        error instanceof Error
          ? error.message
          : 'Alamat utama belum berhasil diperbarui.',
      );
    }
  };

  const renderAddressesContent = () => {
    if (!isLoggedIn) {
      return (
        <View style={styles.empty}>
          <Ionicons name="log-in-outline" size={42} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Masuk untuk kelola alamat</Text>
          <Text style={styles.emptyDescription}>
            Alamat pengiriman sekarang tersimpan ke akun Anda agar bisa dipakai saat checkout.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.primaryButtonText}>Buka Profil</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar alamat tujuan</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/address-form')}
          >
            <Ionicons name="add" size={16} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        {isAddressesLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat alamat pengiriman...</Text>
          </View>
        ) : null}

        {!isAddressesLoading && addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.card, addr.isDefault && styles.cardActive]}
            onPress={() => {
              if (!addr.isDefault) {
                void handleSetDefault(addr.id);
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name={addr.isDefault ? 'checkmark-circle' : 'location-outline'}
                  size={18}
                  color={addr.isDefault ? COLORS.primary : COLORS.textSecondary}
                />
                <View style={styles.cardBody}>
                  <View style={styles.addressTitleRow}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.isDefault ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Utama</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.addressMeta}>
                    {addr.recipient} · {addr.phone}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => handleDelete(addr.id, addr.label)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>{addr.address}</Text>
            {addr.additional ? (
              <Text style={styles.addressAdditional}>{addr.additional}</Text>
            ) : null}
            <Text style={styles.cityText}>
              {addr.subDistrict}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
            </Text>

            {!addr.isDefault ? (
              <Text style={styles.setDefaultText}>Tap untuk jadikan alamat utama</Text>
            ) : null}
          </TouchableOpacity>
        ))}

        {!isAddressesLoading && addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={42} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Belum ada alamat</Text>
            <Text style={styles.emptyDescription}>
              Tambahkan alamat pengiriman pertama Anda untuk dipakai saat checkout.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/address-form')}
            >
              <Text style={styles.primaryButtonText}>Tambah Alamat</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'alamat' && styles.tabButtonActive]}
          onPress={() => setActiveTab('alamat')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={activeTab === 'alamat' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'alamat' && styles.tabTextActive]}>Alamat Tujuan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'toko' && styles.tabButtonActive]}
          onPress={() => setActiveTab('toko')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activeTab === 'toko' ? COLORS.white : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'toko' && styles.tabTextActive]}>Toko Terdekat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'alamat' ? (
          renderAddressesContent()
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Daftar toko terdekat</Text>

            {NEARBY_STORES.map((store) => {
              const selected = selectedStoreId === store.id;

              return (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.card, selected && styles.cardActive]}
                  onPress={() => setSelectedStoreId(store.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons
                        name={selected ? 'storefront' : 'storefront-outline'}
                        size={18}
                        color={selected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <View style={styles.cardBody}>
                        <Text style={styles.addressLabel}>{store.name}</Text>
                        <Text style={styles.addressMeta}>{store.distance}</Text>
                      </View>
                    </View>

                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    ) : null}
                  </View>

                  <Text style={styles.addressText}>{store.address}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardActive: {
    borderWidth: 1,
    borderColor: '#A5D6A7',
    backgroundColor: '#F5FBF5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardBody: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: '#DDEFD7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    color: '#1B5E20',
    fontWeight: '700',
  },
  addressMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 12,
    lineHeight: 20,
  },
  addressAdditional: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  cityText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  setDefaultText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 10,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
