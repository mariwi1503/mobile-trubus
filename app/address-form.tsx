import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import * as Location from 'expo-location';
import LocationMapPicker from '../components/LocationMapPicker';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { validateIndonesianMobilePhone } from '../lib/auth';
import {
  getShippingCities,
  getShippingDistricts,
  getShippingProvinces,
  getShippingSubDistricts,
  type ShippingLocationOption,
} from '../lib/shipping';

type LocationPickerField = 'province' | 'city' | 'district' | 'subDistrict';
type AddressFormTextFieldKey =
  | 'label'
  | 'recipient'
  | 'phone'
  | 'address'
  | 'additional'
  | 'latitude'
  | 'longitude';

type AddressFormState = {
  label: string;
  recipient: string;
  phone: string;
  address: string;
  additional: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
  province?: ShippingLocationOption;
  city?: ShippingLocationOption;
  district?: ShippingLocationOption;
  subDistrict?: ShippingLocationOption;
};

type CoordinateDraft = {
  latitude: number;
  longitude: number;
};

type CoordinateSource = 'device' | 'map' | null;

const emptyFormState = (isDefault = false): AddressFormState => ({
  label: '',
  recipient: '',
  phone: '',
  address: '',
  additional: '',
  latitude: '',
  longitude: '',
  isDefault,
});

const locationFieldMeta: Record<
  LocationPickerField,
  {
    label: string;
    placeholder: string;
  }
> = {
  province: {
    label: 'Provinsi',
    placeholder: 'Pilih provinsi',
  },
  city: {
    label: 'Kota / Kabupaten',
    placeholder: 'Pilih kota atau kabupaten',
  },
  district: {
    label: 'Kecamatan',
    placeholder: 'Pilih kecamatan',
  },
  subDistrict: {
    label: 'Kelurahan',
    placeholder: 'Pilih kelurahan',
  },
};

const textFieldMeta: Array<{
  key: Extract<AddressFormTextFieldKey, 'label' | 'recipient' | 'phone'>;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}> = [
  { key: 'label', label: 'Label Alamat', placeholder: 'Contoh: Rumah, Kantor' },
  { key: 'recipient', label: 'Nama Penerima', placeholder: 'Nama lengkap penerima' },
  { key: 'phone', label: 'No. Telepon', placeholder: '08xxxxxxxxxx', keyboardType: 'phone-pad' },
];

const addressDetailFieldMeta: Array<{
  key: Extract<AddressFormTextFieldKey, 'address' | 'additional'>;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { key: 'address', label: 'Alamat Lengkap', placeholder: 'Nama jalan, nomor rumah, RT/RW', multiline: true },
  {
    key: 'additional',
    label: 'Detail Tambahan',
    placeholder: 'Patokan, catatan kurir, atau detail lain',
    multiline: true,
  },
];

function normalizeLocationName(value?: string | null) {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .replace(/\b(provinsi|propinsi)\b/g, '')
    .replace(/\b(kota|kabupaten|kab\.?|kab)\b/g, '')
    .replace(/\b(kecamatan|kec\.?|kelurahan|kel\.?|desa)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchingLocationOption(
  options: ShippingLocationOption[],
  candidates: Array<string | null | undefined>,
) {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeLocationName(candidate))
    .filter(Boolean);

  if (!normalizedCandidates.length) {
    return undefined;
  }

  const exactMatch = options.find((option) => {
    const normalizedOption = normalizeLocationName(option.name);
    return normalizedCandidates.includes(normalizedOption);
  });

  if (exactMatch) {
    return exactMatch;
  }

  return options.find((option) => {
    const normalizedOption = normalizeLocationName(option.name);

    return normalizedCandidates.some(
      (candidate) =>
        candidate.length >= 4 &&
        (normalizedOption.includes(candidate) || candidate.includes(normalizedOption)),
    );
  });
}

function findLocationMatchByPriority(
  options: ShippingLocationOption[],
  candidates: Array<string | null | undefined>,
) {
  for (const candidate of candidates) {
    const matched = findMatchingLocationOption(options, [candidate]);

    if (matched) {
      return matched;
    }
  }

  return undefined;
}

function findSubDistrictByPostalCode(
  options: ShippingLocationOption[],
  postalCode?: string | null,
) {
  if (!postalCode?.trim()) {
    return undefined;
  }

  return options.find((option) => option.zipCode?.trim() === postalCode.trim());
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function parseCoordinate(value: string) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export default function AddressFormScreen() {
  const router = useRouter();
  const { addresses, createAddress } = useApp();
  const [form, setForm] = useState<AddressFormState>(emptyFormState(addresses.length === 0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [pickerField, setPickerField] = useState<LocationPickerField | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerOptions, setPickerOptions] = useState<ShippingLocationOption[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [isResolvingMapLocation, setIsResolvingMapLocation] = useState(false);
  const [mapDraftCoordinate, setMapDraftCoordinate] = useState<CoordinateDraft | null>(null);
  const [coordinateSource, setCoordinateSource] = useState<CoordinateSource>(null);

  useEffect(() => {
    if (!pickerField) {
      setPickerOptions([]);
      setPickerError(null);
      setPickerSearch('');
      return;
    }

    let isMounted = true;

    const loadPickerOptions = async () => {
      setIsPickerLoading(true);
      setPickerError(null);

      try {
        let nextOptions: ShippingLocationOption[] = [];

        if (pickerField === 'province') {
          nextOptions = await getShippingProvinces();
        } else if (pickerField === 'city') {
          if (!form.province?.id) {
            throw new Error('Pilih provinsi terlebih dahulu.');
          }

          nextOptions = await getShippingCities(form.province.id);
        } else if (pickerField === 'district') {
          if (!form.city?.id) {
            throw new Error('Pilih kota atau kabupaten terlebih dahulu.');
          }

          nextOptions = await getShippingDistricts(form.city.id);
        } else {
          if (!form.district?.id) {
            throw new Error('Pilih kecamatan terlebih dahulu.');
          }

          nextOptions = await getShippingSubDistricts(form.district.id);
        }

        if (!isMounted) {
          return;
        }

        setPickerOptions(nextOptions);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPickerOptions([]);
        setPickerError(
          error instanceof Error
            ? error.message
            : 'Daftar lokasi belum berhasil dimuat.',
        );
      } finally {
        if (isMounted) {
          setIsPickerLoading(false);
        }
      }
    };

    void loadPickerOptions();

    return () => {
      isMounted = false;
    };
  }, [form.city?.id, form.district?.id, form.province?.id, pickerField]);

  const filteredPickerOptions = useMemo(() => {
    const normalizedSearch = pickerSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return pickerOptions;
    }

    return pickerOptions.filter((option) =>
      option.name.toLowerCase().includes(normalizedSearch),
    );
  }, [pickerOptions, pickerSearch]);

  const postalCode = form.subDistrict?.zipCode || form.city?.zipCode || '';
  const savedLatitude = parseCoordinate(form.latitude);
  const savedLongitude = parseCoordinate(form.longitude);
  const hasSavedCoordinate = savedLatitude !== null && savedLongitude !== null;

  const savedCoordinate = hasSavedCoordinate
    ? {
        latitude: savedLatitude,
        longitude: savedLongitude,
      }
    : null;

  const handleUseCurrentLocation = async () => {
    setIsUsingCurrentLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Izin lokasi dibutuhkan untuk mengambil wilayah dari posisi perangkat.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const primaryAddress = reverseGeocode[0];

      if (!primaryAddress) {
        throw new Error('Lokasi perangkat belum bisa diterjemahkan menjadi alamat.');
      }

      const provinces = await getShippingProvinces();
      const matchedProvince = findMatchingLocationOption(provinces, [
        primaryAddress.region,
      ]);

      if (!matchedProvince) {
        throw new Error('Provinsi dari lokasi saat ini belum berhasil dicocokkan.');
      }

      const cities = await getShippingCities(matchedProvince.id);
      const matchedCity = findLocationMatchByPriority(cities, [
        primaryAddress.subregion,
        primaryAddress.city,
      ]);

      if (!matchedCity) {
        throw new Error('Kota atau kabupaten dari lokasi saat ini belum berhasil dicocokkan.');
      }

      const districts = await getShippingDistricts(matchedCity.id);
      const matchedDistrict = findLocationMatchByPriority(districts, [
        primaryAddress.city,
        primaryAddress.district,
        primaryAddress.name,
      ]);

      const nextFormState: AddressFormState = {
        ...form,
        latitude: formatCoordinate(position.coords.latitude),
        longitude: formatCoordinate(position.coords.longitude),
        province: matchedProvince,
        city: matchedCity,
        district: matchedDistrict,
        subDistrict: undefined,
      };

      if (matchedDistrict) {
        const subDistricts = await getShippingSubDistricts(matchedDistrict.id);
        const matchedSubDistrict =
          findSubDistrictByPostalCode(subDistricts, primaryAddress.postalCode) ||
          findLocationMatchByPriority(subDistricts, [
            primaryAddress.district,
            primaryAddress.name,
            primaryAddress.street,
          ]);

        nextFormState.subDistrict = matchedSubDistrict;
      }

      setForm(nextFormState);
      setCoordinateSource('device');
    } catch (error) {
      Alert.alert(
        'Lokasi Belum Bisa Dipakai',
        error instanceof Error
          ? error.message
          : 'Lokasi perangkat belum berhasil dibaca.',
      );
    } finally {
      setIsUsingCurrentLocation(false);
    }
  };

  const handleOpenLocationPicker = (field: LocationPickerField) => {
    if (field === 'city' && !form.province) {
      Alert.alert('Pilih Provinsi', 'Pilih provinsi terlebih dahulu.');
      return;
    }

    if (field === 'district' && !form.city) {
      Alert.alert('Pilih Kota', 'Pilih kota atau kabupaten terlebih dahulu.');
      return;
    }

    if (field === 'subDistrict' && !form.district) {
      Alert.alert('Pilih Kecamatan', 'Pilih kecamatan terlebih dahulu.');
      return;
    }

    setPickerField(field);
  };

  const handleSelectLocation = (field: LocationPickerField, option: ShippingLocationOption) => {
    setForm((currentForm) => {
      if (field === 'province') {
        return {
          ...currentForm,
          province: option,
          city: undefined,
          district: undefined,
          subDistrict: undefined,
          latitude: '',
          longitude: '',
        };
      }

      if (field === 'city') {
        return {
          ...currentForm,
          city: option,
          district: undefined,
          subDistrict: undefined,
          latitude: '',
          longitude: '',
        };
      }

      if (field === 'district') {
        return {
          ...currentForm,
          district: option,
          subDistrict: undefined,
          latitude: '',
          longitude: '',
        };
      }

      return {
        ...currentForm,
        subDistrict: option,
        latitude: '',
        longitude: '',
      };
    });

    setCoordinateSource(null);
    setPickerField(null);
  };

  const resolveMapStartingCoordinate = async () => {
    if (savedCoordinate) {
      return savedCoordinate;
    }

    const areaLabel = [
      form.subDistrict?.name,
      form.district?.name,
      form.city?.name,
      form.province?.name,
      'Indonesia',
    ]
      .filter(Boolean)
      .join(', ');

    if (!areaLabel) {
      throw new Error(
        'Pilih minimal provinsi, kota, kecamatan, dan kelurahan terlebih dahulu sebelum membuka peta.',
      );
    }

    const geocodeCandidates = [
      [form.address.trim(), areaLabel].filter(Boolean).join(', '),
      areaLabel,
    ];

    for (const candidate of geocodeCandidates) {
      const geocodeResults = await Location.geocodeAsync(candidate);
      const firstMatch = geocodeResults[0];

      if (firstMatch?.latitude && firstMatch?.longitude) {
        return {
          latitude: firstMatch.latitude,
          longitude: firstMatch.longitude,
        };
      }
    }

    throw new Error(
      'Lokasi awal peta belum berhasil ditemukan dari wilayah yang Anda pilih.',
    );
  };

  const handleOpenMapPicker = async () => {
    setIsResolvingMapLocation(true);

    try {
      const initialCoordinate = await resolveMapStartingCoordinate();
      setMapDraftCoordinate(initialCoordinate);
      setIsMapPickerVisible(true);
    } catch (error) {
      Alert.alert(
        'Peta Belum Bisa Dibuka',
        error instanceof Error
          ? error.message
          : 'Lokasi awal peta belum berhasil ditentukan.',
      );
    } finally {
      setIsResolvingMapLocation(false);
    }
  };

  const handleConfirmMapLocation = () => {
    if (!mapDraftCoordinate) {
      Alert.alert('Pilih Lokasi', 'Geser peta terlebih dahulu untuk menentukan pin alamat.');
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      latitude: formatCoordinate(mapDraftCoordinate.latitude),
      longitude: formatCoordinate(mapDraftCoordinate.longitude),
    }));
    setCoordinateSource('map');
    setIsMapPickerVisible(false);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      Alert.alert('Peringatan', 'Label alamat wajib diisi.');
      return;
    }

    if (!form.recipient.trim()) {
      Alert.alert('Peringatan', 'Nama penerima wajib diisi.');
      return;
    }

    const phoneError = validateIndonesianMobilePhone(form.phone);
    if (phoneError) {
      Alert.alert('Peringatan', phoneError);
      return;
    }

    if (!form.address.trim()) {
      Alert.alert('Peringatan', 'Alamat lengkap wajib diisi.');
      return;
    }

    if (!form.province || !form.city || !form.district || !form.subDistrict) {
      Alert.alert(
        'Peringatan',
        'Lengkapi provinsi, kota, kecamatan, dan kelurahan terlebih dahulu.',
      );
      return;
    }

    const latitude = Number.parseFloat(form.latitude);
    const longitude = Number.parseFloat(form.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      Alert.alert('Peringatan', 'Latitude belum valid. Gunakan lokasi saat ini atau isi koordinat yang benar.');
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      Alert.alert('Peringatan', 'Longitude belum valid. Gunakan lokasi saat ini atau isi koordinat yang benar.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createAddress({
        label: form.label,
        recipientName: form.recipient,
        phone: form.phone,
        address: form.address,
        additional: form.additional || undefined,
        latitude,
        longitude,
        rajaOngkirSubDistrictId: form.subDistrict.id,
        isPrimary: form.isDefault,
      });

      Alert.alert('Berhasil', 'Alamat berhasil ditambahkan.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Gagal',
        error instanceof Error ? error.message : 'Alamat belum berhasil disimpan.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Alamat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.locationAssistCard}>
          <View style={styles.locationAssistHeader}>
            <View style={styles.locationAssistIconWrap}>
              <Ionicons name="locate-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.locationAssistContent}>
              <Text style={styles.locationAssistTitle}>Gunakan Lokasi Perangkat</Text>
              <Text style={styles.locationAssistText}>
                Isi wilayah alamat lebih cepat dari posisi Anda saat ini.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.currentLocationButton,
              isUsingCurrentLocation && styles.currentLocationButtonDisabled,
            ]}
            onPress={() => {
              void handleUseCurrentLocation();
            }}
            activeOpacity={0.85}
            disabled={isUsingCurrentLocation}
          >
            {isUsingCurrentLocation ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons name="navigate-circle-outline" size={18} color={COLORS.primary} />
            )}
            <Text style={styles.currentLocationButtonText}>Gunakan Lokasi Saat Ini</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.formScrollContent}
          >
            {textFieldMeta.map((field) => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={[styles.formInput, field.multiline && styles.formInputMulti]}
                  value={form[field.key]}
                  onChangeText={(text) => setForm((currentForm) => ({ ...currentForm, [field.key]: text }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textLight}
                  multiline={field.multiline}
                  keyboardType={field.keyboardType}
                />
              </View>
            ))}

            {(Object.keys(locationFieldMeta) as LocationPickerField[]).map((field) => {
              const selectedValue = form[field]?.name;

              return (
                <View key={field} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{locationFieldMeta[field].label}</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => handleOpenLocationPicker(field)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        !selectedValue && styles.selectorPlaceholder,
                      ]}
                    >
                      {selectedValue || locationFieldMeta[field].placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {addressDetailFieldMeta.map((field) => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={[styles.formInput, field.multiline && styles.formInputMulti]}
                  value={form[field.key]}
                  onChangeText={(text) => setForm((currentForm) => ({ ...currentForm, [field.key]: text }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textLight}
                  multiline={field.multiline}
                />
              </View>
            ))}

            <View style={styles.coordinateCard}>
              <Text style={styles.coordinateCardTitle}>Pin Lokasi Alamat</Text>
              <Text style={styles.coordinateCardText}>
                {coordinateSource === 'device'
                  ? 'Lokasi perangkat sudah dipakai sebagai titik alamat. Anda tidak wajib membuka pin manual lagi, tetapi tetap bisa menyesuaikan pin bila perlu.'
                  : 'Geser peta untuk menempatkan pin di titik alamat. Pin ini dipakai sistem untuk memilih toko pengirim terdekat.'}
              </Text>

              <View style={styles.mapPreviewWrap}>
                {savedCoordinate ? (
                  <LocationMapPicker
                    coordinate={savedCoordinate}
                    interactive={false}
                    height={190}
                    label="Pin alamat tersimpan"
                  />
                ) : (
                  <View style={styles.mapPreviewPlaceholder}>
                    <Ionicons name="map-outline" size={26} color={COLORS.primary} />
                    <Text style={styles.mapPreviewPlaceholderTitle}>Pin lokasi belum dipilih</Text>
                    <Text style={styles.mapPreviewPlaceholderText}>
                      Sistem akan menyiapkan titik awal dari kelurahan, kecamatan, dan kota yang Anda input.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.mapPickerButton,
                  isResolvingMapLocation && styles.mapPickerButtonDisabled,
                ]}
                onPress={() => {
                  void handleOpenMapPicker();
                }}
                activeOpacity={0.85}
                disabled={isResolvingMapLocation}
              >
                {isResolvingMapLocation ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Ionicons
                    name={savedCoordinate ? 'navigate-outline' : 'pin-outline'}
                    size={18}
                    color={COLORS.primary}
                  />
                )}
                <Text style={styles.mapPickerButtonText}>
                  {coordinateSource === 'device'
                    ? 'Sesuaikan Pin Manual'
                    : savedCoordinate
                      ? 'Sesuaikan Pin Lokasi'
                      : 'Pilih Pin Lokasi'}
                </Text>
              </TouchableOpacity>

              {savedCoordinate ? (
                <Text style={styles.coordinateMetaText}>
                  {coordinateSource === 'device'
                    ? 'Koordinat dari lokasi perangkat tersimpan di '
                    : 'Titik tersimpan di '}
                  {savedCoordinate.latitude.toFixed(6)}, {savedCoordinate.longitude.toFixed(6)}
                </Text>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kode Pos</Text>
              <View style={styles.readonlyField}>
                <Text style={postalCode ? styles.readonlyText : styles.readonlyPlaceholder}>
                  {postalCode || 'Terisi otomatis dari kelurahan'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setForm((currentForm) => ({ ...currentForm, isDefault: !currentForm.isDefault }))}
              activeOpacity={0.85}
            >
              <Ionicons
                name={form.isDefault ? 'checkbox' : 'square-outline'}
                size={22}
                color={form.isDefault ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={styles.defaultToggleText}>Jadikan sebagai alamat utama</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={() => {
                void handleSave();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>Simpan Alamat</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {pickerField ? (
            <View style={styles.inlinePickerOverlay}>
              <View style={styles.locationPickerSheet}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>{locationFieldMeta[pickerField].label}</Text>
                  <TouchableOpacity onPress={() => setPickerField(null)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.formInput}
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                    placeholder="Cari lokasi"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                {isPickerLoading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat daftar lokasi...</Text>
                  </View>
                ) : pickerError ? (
                  <View style={styles.empty}>
                    <Ionicons name="alert-circle-outline" size={34} color={COLORS.accent} />
                    <Text style={styles.emptyTitle}>Lokasi belum tersedia</Text>
                    <Text style={styles.emptyDescription}>{pickerError}</Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredPickerOptions.map((option) => (
                      <TouchableOpacity
                        key={`${pickerField}_${option.id}`}
                        style={styles.locationOption}
                        onPress={() => {
                          handleSelectLocation(pickerField, option);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.locationOptionContent}>
                          <Text style={styles.locationOptionLabel}>{option.name}</Text>
                          {option.zipCode ? (
                            <Text style={styles.locationOptionMeta}>Kode pos {option.zipCode}</Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                      </TouchableOpacity>
                    ))}

                    {!filteredPickerOptions.length ? (
                      <View style={styles.empty}>
                        <Ionicons name="search-outline" size={36} color={COLORS.textLight} />
                        <Text style={styles.emptyTitle}>Lokasi tidak ditemukan</Text>
                        <Text style={styles.emptyDescription}>
                          Coba ubah kata kunci pencarian Anda.
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                )}
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={isMapPickerVisible}
        animationType="slide"
        onRequestClose={() => setIsMapPickerVisible(false)}
      >
        <View style={styles.mapPickerScreen}>
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsMapPickerVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.mapPickerHeaderText}>
              <Text style={styles.mapPickerTitle}>Tentukan Pin Lokasi</Text>
              <Text style={styles.mapPickerSubtitle}>
                Geser peta sampai pin berada tepat di alamat pengiriman.
              </Text>
            </View>
          </View>

          <View style={styles.mapPickerBody}>
            <LocationMapPicker
              coordinate={mapDraftCoordinate}
              interactive
              height={420}
              label="Titik alamat"
              onCoordinateChange={setMapDraftCoordinate}
            />

            <View style={styles.mapPickerInfoCard}>
              <Text style={styles.mapPickerInfoTitle}>Titik yang akan disimpan</Text>
              <Text style={styles.mapPickerInfoText}>
                {mapDraftCoordinate
                  ? `${mapDraftCoordinate.latitude.toFixed(6)}, ${mapDraftCoordinate.longitude.toFixed(6)}`
                  : 'Menunggu titik peta...'}
              </Text>
            </View>
          </View>

          <View style={styles.mapPickerFooter}>
            <TouchableOpacity
              style={styles.mapPickerCancelButton}
              onPress={() => setIsMapPickerVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.mapPickerCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapPickerConfirmButton}
              onPress={handleConfirmMapLocation}
              activeOpacity={0.85}
            >
              <Text style={styles.mapPickerConfirmText}>Gunakan Titik Ini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  keyboardWrap: {
    flex: 1,
    padding: SPACING.lg,
  },
  locationAssistCard: {
    backgroundColor: '#F5FBF5',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#DDEFD7',
  },
  locationAssistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: SPACING.md,
  },
  locationAssistIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  locationAssistContent: {
    flex: 1,
  },
  locationAssistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationAssistText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  contentCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  formScrollContent: {
    padding: SPACING.lg,
    paddingBottom: 28,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  currentLocationButtonDisabled: {
    opacity: 0.8,
  },
  currentLocationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
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
  formInputMulti: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  selectorPlaceholder: {
    color: COLORS.textLight,
  },
  coordinateCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  coordinateCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  coordinateCardText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  mapPreviewWrap: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#EEF4EE',
  },
  mapPreviewPlaceholder: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: '#EEF4EE',
  },
  mapPreviewPlaceholderTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapPreviewPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mapPickerButton: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  mapPickerButtonDisabled: {
    opacity: 0.75,
  },
  mapPickerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  coordinateMetaText: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  readonlyField: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F7F9F7',
  },
  readonlyText: {
    fontSize: 14,
    color: COLORS.text,
  },
  readonlyPlaceholder: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  defaultToggleText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  inlinePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
  locationPickerSheet: {
    flex: 1,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: 12,
  },
  locationOptionContent: {
    flex: 1,
  },
  locationOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationOptionMeta: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
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
  mapPickerScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapPickerHeader: {
    paddingTop: 52,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mapPickerHeaderText: {
    flex: 1,
    paddingTop: 2,
  },
  mapPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapPickerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  mapPickerBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  mapPickerInfoCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  mapPickerInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapPickerInfoText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  mapPickerFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  mapPickerCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 14,
  },
  mapPickerCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  mapPickerConfirmButton: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
  },
  mapPickerConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
