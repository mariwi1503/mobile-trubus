import React, { useCallback, useEffect, useState } from 'react';
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
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { getMobileStores } from '../lib/stores';
import type { Store } from '../types/store';

type ActiveTab = 'alamat' | 'toko';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  originLatitude: number,
  originLongitude: number,
  destinationLatitude: number,
  destinationLongitude: number,
) {
  const latitudeDistance = toRadians(destinationLatitude - originLatitude);
  const longitudeDistance = toRadians(destinationLongitude - originLongitude);

  const haversineValue =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(toRadians(originLatitude)) *
      Math.cos(toRadians(destinationLatitude)) *
      Math.sin(longitudeDistance / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
}

function formatStoreDistance(distanceKm?: number) {
  if (distanceKm === undefined) {
    return 'Jarak belum tersedia';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function formatStoreArea(store: Store) {
  return [store.subDistrict, store.city, store.province]
    .filter((value) => value.trim().length > 0)
    .join(', ');
}

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    addresses,
    isAddressesLoading,
    isLoggedIn,
    refreshAddresses,
    removeAddress,
    setDefaultAddress,
  } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('alamat');
  const [stores, setStores] = useState<Store[]>([]);
  const [isStoresLoading, setIsStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storesRequestVersion, setStoresRequestVersion] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    void refreshAddresses().catch(() => {
      // Keep the last known address list if refresh fails.
    });
  }, [isLoggedIn, refreshAddresses]);

  const loadCurrentLocation = useCallback(async () => {
    setIsLocationLoading(true);
    setLocationError(null);

    try {
      const currentPermission =
        await Location.getForegroundPermissionsAsync();
      let permissionStatus = currentPermission.status;

      if (permissionStatus !== 'granted') {
        const requestedPermission =
          await Location.requestForegroundPermissionsAsync();
        permissionStatus = requestedPermission.status;
      }

      if (permissionStatus !== 'granted') {
        throw new Error(
          'Izin lokasi dibutuhkan untuk menghitung toko terdekat dari posisi perangkat.',
        );
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setDeviceLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      setDeviceLocation(null);
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Lokasi perangkat belum berhasil diambil.',
      );
    } finally {
      setIsLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        if (isMounted) {
          setIsStoresLoading(true);
          setStoresError(null);
        }

        const response = await getMobileStores({ page: 1, perPage: 100 });

        if (!isMounted) {
          return;
        }

        setStores(response.stores);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStoresError(
          error instanceof Error ? error.message : 'Daftar toko belum berhasil dimuat.',
        );
      } finally {
        if (isMounted) {
          setIsStoresLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [storesRequestVersion]);

  useEffect(() => {
    if (activeTab !== 'toko' || deviceLocation || isLocationLoading) {
      return;
    }

    void loadCurrentLocation();
  }, [activeTab, deviceLocation, isLocationLoading, loadCurrentLocation]);

  const hasReferenceLocation = Boolean(deviceLocation);
  const nearbyStores = [...stores]
    .map((store) => ({
      ...store,
      distanceKm:
        deviceLocation &&
        typeof store.latitude === 'number' &&
        typeof store.longitude === 'number'
          ? calculateDistanceKm(
              deviceLocation.latitude,
              deviceLocation.longitude,
              store.latitude,
              store.longitude,
            )
          : undefined,
    }))
    .sort((left, right) => {
      if (left.distanceKm !== undefined && right.distanceKm !== undefined) {
        if (left.distanceKm !== right.distanceKm) {
          return left.distanceKm - right.distanceKm;
        }
      } else if (left.distanceKm !== undefined) {
        return -1;
      } else if (right.distanceKm !== undefined) {
        return 1;
      }

      return left.name.localeCompare(right.name);
    });
  const effectiveSelectedStoreId =
    nearbyStores.some((store) => store.id === selectedStoreId)
      ? selectedStoreId
      : nearbyStores[0]?.id;

  const handleRefreshStores = () => {
    setStoresRequestVersion((value) => value + 1);
    void loadCurrentLocation();
  };

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alamat Pengiriman</Text>
          <View style={styles.headerSpacer} />
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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Daftar toko terdekat</Text>
                <Text style={styles.sectionDescription}>
                  {hasReferenceLocation
                    ? 'Diurutkan dari current location perangkat Anda.'
                    : isLocationLoading
                      ? 'Mengambil current location perangkat untuk menghitung jarak toko.'
                      : 'Aktifkan izin lokasi agar toko diurutkan dari current location perangkat.'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleRefreshStores}
              >
                <Ionicons name="refresh" size={16} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Muat ulang</Text>
              </TouchableOpacity>
            </View>

            {storesError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.accent} />
                <Text style={styles.errorBannerText}>{storesError}</Text>
              </View>
            ) : null}

            {locationError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="locate-outline" size={18} color={COLORS.accent} />
                <Text style={styles.errorBannerText}>{locationError}</Text>
              </View>
            ) : null}

            {isStoresLoading || isLocationLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  {isStoresLoading
                    ? 'Memuat daftar toko dari server...'
                    : 'Mengambil current location perangkat...'}
                </Text>
              </View>
            ) : null}

            {!isStoresLoading && nearbyStores.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="storefront-outline" size={42} color={COLORS.textLight} />
                <Text style={styles.emptyTitle}>Belum ada toko tersedia</Text>
                <Text style={styles.emptyDescription}>
                  Data toko aktif dari backend belum tersedia untuk aplikasi mobile.
                </Text>
              </View>
            ) : null}

            {!isStoresLoading && nearbyStores.map((store) => {
              const selected = effectiveSelectedStoreId === store.id;
              const areaLabel = formatStoreArea(store);

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
                        <Text style={styles.addressMeta}>
                          {formatStoreDistance(store.distanceKm)}
                        </Text>
                      </View>
                    </View>

                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    ) : null}
                  </View>

                  <Text style={styles.addressText}>{store.address}</Text>
                  {areaLabel ? (
                    <Text style={styles.cityText}>
                      {areaLabel}
                      {store.postalCode ? ` ${store.postalCode}` : ''}
                    </Text>
                  ) : null}
                  {store.isOnlineOrderSupported ? (
                    <Text style={styles.setDefaultText}>Toko ini mendukung order online</Text>
                  ) : null}
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
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 8,
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
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: 12,
  },
  sectionHeading: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionDescription: {
    marginTop: -6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#FDECEA',
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.accent,
  },
});
