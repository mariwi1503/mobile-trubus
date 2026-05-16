import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BackendMobileProfile,
  changeMobileUserPassword,
  getMobileUserProfile,
  loginMobileUser,
  MOBILE_PASSWORD_MIN_LENGTH,
  MobileConsumerGender,
  normalizeIndonesianMobilePhone,
  registerMobileCustomer,
  updateMobileUserProfile,
  validateEmail,
  updateMobileExpertPresenceStatus,
  validateIndonesianMobilePhone,
  validatePassword,
} from '../lib/auth';
import type { Address } from '../types/address';
import {
  createMobileUserAddress,
  deleteMobileUserAddress,
  getMobileUserAddresses,
  type CreateMobileUserAddressPayload,
  updateMobileUserAddress,
} from '../lib/addresses';
import {
  addMobileCartItem,
  clearMobileCart,
  getMobileCart,
  removeMobileCartItem,
  updateMobileCartItem,
  type MobileCart,
} from '../lib/cart';
import {
  getMobileProductOrders,
  type MobileProductOrder,
} from '../lib/orders';

const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') { return localStorage.getItem(key); }
      return await AsyncStorage.getItem(key);
    } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.setItem(key, value); }
      else { await AsyncStorage.setItem(key, value); }
    } catch { }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.removeItem(key); }
      else { await AsyncStorage.removeItem(key); }
    } catch { }
  },
};

export interface CartItem {
  cartItemId?: string;
  productId: string; name: string; price: number; image: any;
  quantity: number; weight: number; store: string;
}
export type { Address } from '../types/address';
export interface Order {
  id: string; type: 'product' | 'consultation'; items?: CartItem[];
  orderCode?: string;
  expertId?: string; expertName?: string; consultationDate?: string; consultationTime?: string;
  expertImage?: string; expertSpecialization?: string;
  totalAmount: number; shippingCost?: number; courier?: string; address?: Address;
  fulfillmentMethod?: 'delivery' | 'pickup';
  coinRedemptionCost?: number;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'expired';
  paymentMethod?: string; createdAt: string; store?: string;
  paymentGateway?: 'midtrans';
  paymentProviderOrderId?: string;
  paymentRedirectUrl?: string;
  paymentType?: string;
  paymentExpiresAt?: string;
  paymentStatusDetail?: string;
  paymentUpdatedAt?: string;
  // For expert: client info
  clientName?: string; clientPhone?: string; clientAvatar?: string;
}
export interface Notification {
  id: string; title: string; message: string;
  type: 'order' | 'consultation' | 'promo' | 'info' | 'article'; read: boolean; createdAt: string;
}
export interface UserProfile {
  name: string; email: string; phone: string; avatar: string;
  role: 'consumer' | 'expert';
  trubusCoins: number; // For loyalty points
  gender?: MobileConsumerGender;
  specialization?: string; experience?: number; fee?: number;
  status?: 'online' | 'busy' | 'offline'; // Added status
}
export interface Transaction {
  id: string; type: 'topup' | 'transfer_in' | 'transfer_out' | 'payment';
  amount: number; date: string; description: string;
  status: 'success' | 'failed' | 'pending';
}
export interface RegisteredUser {
  name: string;
  email: string;
  phone: string;
  gender: MobileConsumerGender;
  password: string;
}

type AuthResult = { success: boolean; error?: string };

type StoredSession = {
  accessToken: string;
  user: UserProfile;
};

interface AppContextType {
  // Auth
  isAuthHydrating: boolean;
  isLoggedIn: boolean;
  authToken: string | null;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  updateProfile: (data: {
    name: string;
    email: string;
    phone: string;
    gender: MobileConsumerGender;
  }) => Promise<AuthResult>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<AuthResult>;
  updateStatus: (status: UserProfile['status']) => Promise<void>;
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (data: RegisteredUser, registrationToken: string) => Promise<AuthResult>;
  logout: () => void;
  // Onboarding
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  hasAcceptedTerms: boolean;
  setHasAcceptedTerms: (v: boolean) => void;
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  getCartTotal: () => number;
  getCartCount: () => number;
  // Addresses
  addresses: Address[];
  isAddressesLoading: boolean;
  refreshAddresses: () => Promise<void>;
  createAddress: (payload: CreateMobileUserAddressPayload) => Promise<Address>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  // Orders
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Order, options?: { silent?: boolean }) => void;
  patchOrder: (orderId: string, patch: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderPayment: (orderId: string, method: string) => void;
  getDraftOrder: () => Order | undefined;
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  // Transactions
  transactions: Transaction[];
}

const guestUser: UserProfile = {
  name: 'Tamu', email: '', phone: '', avatar: '', role: 'consumer', trubusCoins: 0
};

const SESSION_STORAGE_KEY = 'session';
const DEFAULT_MALE_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
const DEFAULT_FEMALE_AVATAR = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face';
const DEFAULT_EXPERT_AVATAR = 'https://ui-avatars.com/api/?name=Ahli&background=E8F5E9&color=1B5E20&size=256';
const DEFAULT_CART_ITEM_IMAGE =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&h=800&fit=crop';
const DEFAULT_CART_ITEM_WEIGHT = 500;
const DEFAULT_CART_ITEM_STORE = 'Trubus Official Store';

function formatPhoneForDisplay(phone: string) {
  if (phone.startsWith('62')) {
    return `0${phone.slice(2)}`;
  }

  return phone;
}

function fallbackExpertAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'Ahli',
  )}&background=E8F5E9&color=1B5E20&size=256`;
}

function splitFullName(name: string) {
  const trimmedName = name.trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = trimmedName.split(' ');

  return {
    firstName: firstName || '',
    lastName: rest.length > 0 ? rest.join(' ') : undefined,
  };
}

function normalizeBackendUser(user: BackendMobileProfile): UserProfile {
  if (user.accountType === 'expert') {
    return {
      name: user.name || 'Ahli Trubus',
      email: user.email || '',
      phone: formatPhoneForDisplay(user.phone),
      avatar:
        user.imageThumbnailUrl ||
        user.imageOriginalUrl ||
        fallbackExpertAvatar(user.name) ||
        DEFAULT_EXPERT_AVATAR,
      role: 'expert',
      trubusCoins: 0,
      specialization: user.specialization,
      experience: user.experience,
      fee: user.price,
      status: user.presenceStatus,
    };
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    name: fullName || 'Sahabat Trubus',
    email: user.email || '',
    phone: formatPhoneForDisplay(user.phone),
    avatar: user.gender === 'FEMALE' ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR,
    role: 'consumer',
    trubusCoins: 0,
    gender: user.gender,
  };
}

function mapMobileCartToCartItems(backendCart: MobileCart): CartItem[] {
  return backendCart.items
    .filter((item) => item.product?.isShownInApp !== false)
    .map((item) => ({
      cartItemId: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      image: item.product.thumbnailUrl || DEFAULT_CART_ITEM_IMAGE,
      quantity: item.qty,
      weight: DEFAULT_CART_ITEM_WEIGHT,
      store: DEFAULT_CART_ITEM_STORE,
    }));
}

function normalizeMobileProductOrder(order: MobileProductOrder): Order {
  return {
    ...order,
    items: (order.items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || DEFAULT_CART_ITEM_IMAGE,
      quantity: item.quantity,
      weight: item.weight || DEFAULT_CART_ITEM_WEIGHT,
      store: item.store || order.store || DEFAULT_CART_ITEM_STORE,
    })),
  };
}

const defaultAddresses: Address[] = [];

const defaultNotifications: Notification[] = [
  {
    id: 'n1', title: 'Pesanan Dikonfirmasi', message: 'Pesanan #ORD-1029 berhasil dikonfirmasi dan sedang dikemas.',
    type: 'order', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
  },
  {
    id: 'n2', title: 'Selamat Datang!', message: 'Selamat datang di Halo Trubus. Nikmati konsultasi pertama GRATIS!',
    type: 'promo', read: false, createdAt: '2026-02-11T08:00:00Z'
  },
  {
    id: 'n3', title: 'Promo Pupuk Organik', message: 'Diskon 20% untuk semua pupuk organik. Berlaku hingga akhir bulan!',
    type: 'promo', read: false, createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'n4', title: 'Artikel: Tips Berkebun', message: 'Musim hujan tiba! Baca tips melindungi tanaman dari genangan air.',
    type: 'article', read: true, createdAt: '2026-02-09T14:00:00Z'
  },
  {
    id: 'n5', title: 'Update Sistem', message: 'Pembaruan aplikasi ke versi 2.0 memberikan pengalaman lebih baik.',
    type: 'info', read: true, createdAt: '2026-02-08T10:00:00Z'
  },
];

const defaultTransactions: Transaction[] = [
  { id: 'tx1', type: 'topup', amount: 50000, date: '2026-02-12T10:00:00Z', description: 'Top Up via BCA', status: 'success' },
  { id: 'tx2', type: 'payment', amount: 25000, date: '2026-02-11T14:30:00Z', description: 'Pembayaran Bibit Mangga', status: 'success' },
  { id: 'tx3', type: 'transfer_in', amount: 10000, date: '2026-02-10T09:15:00Z', description: 'Transfer dari Budi', status: 'success' },
];

const defaultOrders: Order[] = [
  {
    id: 'CONS-1001',
    type: 'consultation',
    expertId: '1',
    expertName: 'Dr. Ir. Bambang Suryadi',
    consultationDate: '2026-04-09',
    consultationTime: '09:00',
    totalAmount: 75000,
    status: 'pending_payment',
    createdAt: '2026-04-07T08:15:00Z',
    clientName: 'Budi Santoso',
    clientPhone: '081234567890',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'CONS-1002',
    type: 'consultation',
    expertId: '1',
    expertName: 'Dr. Ir. Bambang Suryadi',
    consultationDate: '2026-04-08',
    consultationTime: '14:00',
    totalAmount: 75000,
    status: 'paid',
    paymentMethod: 'BCA Virtual Account',
    createdAt: '2026-04-06T10:30:00Z',
    clientName: 'Budi Santoso',
    clientPhone: '081234567890',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'CONS-1003',
    type: 'consultation',
    expertId: '4',
    expertName: 'Dr. Rina Wulandari',
    consultationDate: '2026-04-05',
    consultationTime: '16:00',
    totalAmount: 85000,
    status: 'completed',
    paymentMethod: 'GoPay',
    createdAt: '2026-04-04T13:45:00Z',
    clientName: 'Budi Santoso',
    clientPhone: '081234567890',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'CONS-1004',
    type: 'consultation',
    expertId: '1',
    expertName: 'Dr. Ir. Bambang Suryadi',
    consultationDate: '2026-04-10',
    consultationTime: '10:00',
    totalAmount: 75000,
    status: 'paid',
    paymentMethod: 'QRIS',
    createdAt: '2026-04-07T06:20:00Z',
    clientName: 'Sari Dewi',
    clientPhone: '081377788899',
    clientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'CONS-1005',
    type: 'consultation',
    expertId: '5',
    expertName: 'Ir. Hendra Kusuma, M.Si.',
    consultationDate: '2026-04-03',
    consultationTime: '11:00',
    totalAmount: 70000,
    status: 'completed',
    paymentMethod: 'Mandiri Virtual Account',
    createdAt: '2026-04-02T09:10:00Z',
    clientName: 'Rudi Hartono',
    clientPhone: '081388877766',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: 'CONS-1006',
    type: 'consultation',
    expertId: '1',
    expertName: 'Dr. Ir. Bambang Suryadi',
    consultationDate: '2026-04-01',
    consultationTime: '08:00',
    totalAmount: 75000,
    status: 'cancelled',
    createdAt: '2026-03-31T07:00:00Z',
    clientName: 'Andi Saputra',
    clientPhone: '081355566677',
    clientAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  },
];

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthHydrating, setIsAuthHydrating] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUserState] = useState<UserProfile>(guestUser);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>(defaultOrders);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);

  const persistSession = useCallback((session: StoredSession) => {
    Storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearSession = useCallback(() => {
    Storage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const persistAddresses = useCallback((nextAddresses: Address[]) => {
    Storage.setItem('addresses', JSON.stringify(nextAddresses));
  }, []);

  const persistCart = useCallback((nextCart: CartItem[]) => {
    Storage.setItem('cart', JSON.stringify(nextCart));
  }, []);

  const sortAddresses = useCallback((nextAddresses: Address[]) => {
    return [...nextAddresses].sort((left, right) => {
      if (left.isDefault === right.isDefault) {
        return 0;
      }

      return left.isDefault ? -1 : 1;
    });
  }, []);

  const hydrateAddresses = useCallback(async (accessToken: string) => {
    setIsAddressesLoading(true);

    try {
      const nextAddresses = sortAddresses(
        await getMobileUserAddresses(accessToken),
      );

      setAddresses(nextAddresses);
      persistAddresses(nextAddresses);
    } finally {
      setIsAddressesLoading(false);
    }
  }, [persistAddresses, sortAddresses]);

  const hydrateCart = useCallback(async (accessToken: string) => {
    const nextCart = mapMobileCartToCartItems(
      await getMobileCart(accessToken),
    );

    setCart(nextCart);
    persistCart(nextCart);
  }, [persistCart]);

  const hydrateProductOrders = useCallback(async (accessToken: string) => {
    const nextProductOrders = (
      await getMobileProductOrders(accessToken)
    ).map(normalizeMobileProductOrder);

    setOrders((prevOrders) => {
      const mergedOrders = [
        ...nextProductOrders,
        ...prevOrders.filter((order) => order.type !== 'product'),
      ];

      Storage.setItem('orders', JSON.stringify(mergedOrders));
      return mergedOrders;
    });
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!authToken || !isLoggedIn) {
      setOrders((prevOrders) => {
        const remainingOrders = prevOrders.filter((order) => order.type !== 'product');
        Storage.setItem('orders', JSON.stringify(remainingOrders));
        return remainingOrders;
      });
      return;
    }

    await hydrateProductOrders(authToken);
  }, [authToken, hydrateProductOrders, isLoggedIn]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedOnboarded = await Storage.getItem('onboarded');
        if (storedOnboarded === 'true') setIsOnboarded(true);
        const storedAcceptedTerms = await Storage.getItem('acceptedTerms');
        if (storedAcceptedTerms === 'true') setHasAcceptedTerms(true);
        const storedCart = await Storage.getItem('cart');
        if (storedCart) setCart(JSON.parse(storedCart));
        const storedOrders = await Storage.getItem('orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
        const storedAddresses = await Storage.getItem('addresses');
        if (storedAddresses) setAddresses(JSON.parse(storedAddresses));
        const storedWishlist = await Storage.getItem('wishlist');
        if (storedWishlist) setWishlist(JSON.parse(storedWishlist));
        const storedNotifications = await Storage.getItem('notifications');
        if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        const storedTransactions = await Storage.getItem('transactions');
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        const storedSession = await Storage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const session = JSON.parse(storedSession) as Partial<StoredSession>;

          if (session.accessToken) {
            const cachedUser = session.user ?? guestUser;

            setAuthToken(session.accessToken);
            setUserState(cachedUser);
            setIsLoggedIn(true);

            try {
              const backendUser = await getMobileUserProfile(session.accessToken);
              const normalizedUser = normalizeBackendUser(backendUser);
              setUserState(normalizedUser);
              persistSession({
                accessToken: session.accessToken,
                user: normalizedUser,
              });
            } catch {
              persistSession({
                accessToken: session.accessToken,
                user: cachedUser,
              });
            }

            try {
              await hydrateAddresses(session.accessToken);
            } catch {
              setAddresses([]);
              persistAddresses([]);
            }

            try {
              await hydrateCart(session.accessToken);
            } catch {
              setCart([]);
              persistCart([]);
            }

            try {
              await hydrateProductOrders(session.accessToken);
            } catch {
              // Keep locally cached orders when backend orders are temporarily unavailable.
            }
          } else {
            clearSession();
          }
        }
      } catch {
        clearSession();
      } finally {
        setIsAuthHydrating(false);
      }
    };
    loadData();
  }, [clearSession, hydrateAddresses, hydrateCart, hydrateProductOrders, persistAddresses, persistCart, persistSession]);

  // Auth
  const login = useCallback(async (phone: string, password: string): Promise<AuthResult> => {
    const phoneError = validateIndonesianMobilePhone(phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }

    try {
      const authResponse = await loginMobileUser(phone.trim(), password);
      const backendUser = await getMobileUserProfile(authResponse.accessToken);
      const normalizedUser = normalizeBackendUser(backendUser);

      setAuthToken(authResponse.accessToken);
      setUserState(normalizedUser);
      setIsLoggedIn(true);
      persistSession({
        accessToken: authResponse.accessToken,
        user: normalizedUser,
      });
      try {
        await hydrateAddresses(authResponse.accessToken);
      } catch {
        setAddresses([]);
        persistAddresses([]);
      }

      try {
        await hydrateCart(authResponse.accessToken);
      } catch {
        setCart([]);
        persistCart([]);
      }

      try {
        await hydrateProductOrders(authResponse.accessToken);
      } catch {
        // Leave local orders as-is when backend sync is temporarily unavailable.
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login gagal',
      };
    }
  }, [hydrateAddresses, hydrateCart, hydrateProductOrders, persistAddresses, persistCart, persistSession]);

  const register = useCallback(async (data: RegisteredUser, registrationToken: string): Promise<AuthResult> => {
    const phoneError = validateIndonesianMobilePhone(data.phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }

    if (!data.name.trim()) {
      return { success: false, error: 'Nama lengkap wajib diisi' };
    }

    const emailError = validateEmail(data.email);
    if (emailError) {
      return { success: false, error: emailError };
    }

    const passwordError = validatePassword(data.password, {
      minLength: MOBILE_PASSWORD_MIN_LENGTH,
    });
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    if (!registrationToken.trim()) {
      return { success: false, error: 'Sesi verifikasi nomor HP tidak ditemukan' };
    }

    const { firstName, lastName } = splitFullName(data.name);
    if (!firstName) {
      return { success: false, error: 'Nama depan wajib diisi' };
    }

    try {
      await registerMobileCustomer({
        registrationToken: registrationToken.trim(),
        email: data.email.trim().toLowerCase(),
        firstName,
        lastName,
        gender: data.gender,
        password: data.password,
      });

      const authResponse = await loginMobileUser(data.phone.trim(), data.password);
      const backendUser = await getMobileUserProfile(authResponse.accessToken);
      const normalizedUser = normalizeBackendUser(backendUser);

      setAuthToken(authResponse.accessToken);
      setUserState(normalizedUser);
      setIsLoggedIn(true);
      persistSession({
        accessToken: authResponse.accessToken,
        user: normalizedUser,
      });
      try {
        await hydrateAddresses(authResponse.accessToken);
      } catch {
        setAddresses([]);
        persistAddresses([]);
      }

      try {
        await hydrateCart(authResponse.accessToken);
      } catch {
        setCart([]);
        persistCart([]);
      }

      try {
        await hydrateProductOrders(authResponse.accessToken);
      } catch {
        // Leave local orders as-is when backend sync is temporarily unavailable.
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registrasi gagal',
      };
    }
  }, [hydrateAddresses, hydrateCart, hydrateProductOrders, persistAddresses, persistCart, persistSession]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setIsLoggedIn(false);
    setUserState(guestUser);
    setCart([]);
    Storage.removeItem('cart');
    setAddresses([]);
    Storage.removeItem('addresses');
    setOrders((prevOrders) => {
      const remainingOrders = prevOrders.filter((order) => order.type !== 'product');
      Storage.setItem('orders', JSON.stringify(remainingOrders));
      return remainingOrders;
    });
    clearSession();
  }, [clearSession]);

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
    if (isLoggedIn && authToken) {
      persistSession({ accessToken: authToken, user: u });
    }
  }, [authToken, isLoggedIn, persistSession]);

  const updateProfile = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    gender: MobileConsumerGender;
  }): Promise<AuthResult> => {
    if (!authToken || !isLoggedIn) {
      return {
        success: false,
        error: 'Silakan login untuk memperbarui profil.',
      };
    }

    if (user.role !== 'consumer') {
      return {
        success: false,
        error: 'Perubahan profil ahli belum didukung dari aplikasi ini.',
      };
    }

    if (!data.name.trim()) {
      return { success: false, error: 'Nama lengkap wajib diisi' };
    }

    const phoneError = validateIndonesianMobilePhone(data.phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }

    const trimmedEmail = data.email.trim();

    if (user.email.trim() || trimmedEmail) {
      const emailError = validateEmail(trimmedEmail);
      if (emailError) {
        return { success: false, error: emailError };
      }
    }

    const { firstName, lastName } = splitFullName(data.name);
    if (!firstName) {
      return { success: false, error: 'Nama depan wajib diisi' };
    }

    try {
      const backendUser = await updateMobileUserProfile(authToken, {
        phone: normalizeIndonesianMobilePhone(data.phone),
        ...(trimmedEmail ? { email: trimmedEmail.toLowerCase() } : {}),
        firstName,
        lastName,
        gender: data.gender,
      });
      const normalizedUser = normalizeBackendUser(backendUser);

      setUserState(normalizedUser);
      persistSession({ accessToken: authToken, user: normalizedUser });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Profil belum berhasil diperbarui.',
      };
    }
  }, [authToken, isLoggedIn, persistSession, user.email, user.role]);

  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AuthResult> => {
    if (!authToken || !isLoggedIn) {
      return {
        success: false,
        error: 'Silakan login untuk mengganti password.',
      };
    }

    if (user.role !== 'consumer') {
      return {
        success: false,
        error: 'Perubahan password ahli belum didukung dari aplikasi ini.',
      };
    }

    const currentPasswordError = validatePassword(data.currentPassword);
    if (currentPasswordError) {
      return { success: false, error: 'Password saat ini wajib diisi' };
    }

    const newPasswordError = validatePassword(data.newPassword, {
      minLength: MOBILE_PASSWORD_MIN_LENGTH,
    });
    if (newPasswordError) {
      return { success: false, error: newPasswordError };
    }

    if (data.currentPassword.trim() === data.newPassword.trim()) {
      return {
        success: false,
        error: 'Password baru tidak boleh sama dengan password saat ini',
      };
    }

    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        error: 'Konfirmasi password tidak cocok',
      };
    }

    try {
      await changeMobileUserPassword(authToken, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Password belum berhasil diperbarui.',
      };
    }
  }, [authToken, isLoggedIn, user.role]);

  const updateStatus = useCallback(async (status: UserProfile['status']) => {
    setUserState(prev => {
      const updated = { ...prev, status };
      if (isLoggedIn && authToken) {
        persistSession({ accessToken: authToken, user: updated });
      }
      return updated;
    });

    if (!status || !isLoggedIn || !authToken || user.role !== 'expert') {
      return;
    }

    try {
      const backendExpert = await updateMobileExpertPresenceStatus(
        authToken,
        status,
      );
      const normalizedUser = normalizeBackendUser(backendExpert);
      setUserState(normalizedUser);
      persistSession({ accessToken: authToken, user: normalizedUser });
    } catch {
      // Keep the optimistic status locally when the backend update fails.
    }
  }, [authToken, isLoggedIn, persistSession, user.role]);

  // Cart
  const addToCart = useCallback(async (item: CartItem) => {
    if (!authToken || !isLoggedIn) {
      return false;
    }

    try {
      const nextCart = mapMobileCartToCartItems(
        await addMobileCartItem(authToken, {
          productId: item.productId,
          qty: item.quantity,
        }),
      );

      setCart(nextCart);
      persistCart(nextCart);
      return true;
    } catch (error) {
      Alert.alert(
        'Keranjang Belum Tersimpan',
        error instanceof Error
          ? error.message
          : 'Produk belum berhasil ditambahkan ke keranjang.',
      );
      return false;
    }
  }, [authToken, isLoggedIn, persistCart]);
  const removeFromCart = useCallback(async (productId: string) => {
    const existingItem = cart.find((item) => item.productId === productId);

    if (authToken && isLoggedIn) {
      if (!existingItem?.cartItemId) {
        Alert.alert(
          'Keranjang Belum Sinkron',
          'Item keranjang ini belum punya ID backend. Coba buka ulang halaman keranjang.',
        );
        return false;
      }

      try {
        await removeMobileCartItem(authToken, existingItem.cartItemId);
        const nextCart = cart.filter((item) => item.productId !== productId);
        setCart(nextCart);
        persistCart(nextCart);
        return true;
      } catch (error) {
        Alert.alert(
          'Gagal Menghapus Produk',
          error instanceof Error
            ? error.message
            : 'Produk belum berhasil dihapus dari keranjang.',
        );
        return false;
      }
    }

    setCart(prev => {
      const nextCart = prev.filter(i => i.productId !== productId);
      persistCart(nextCart);
      return nextCart;
    });
    return true;
  }, [authToken, cart, isLoggedIn, persistCart]);
  const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    const existingItem = cart.find((item) => item.productId === productId);

    if (authToken && isLoggedIn) {
      if (!existingItem?.cartItemId) {
        Alert.alert(
          'Keranjang Belum Sinkron',
          'Item keranjang ini belum punya ID backend. Coba buka ulang halaman keranjang.',
        );
        return false;
      }

      try {
        await updateMobileCartItem(authToken, existingItem.cartItemId, { qty: quantity });
        const nextCart = cart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        );
        setCart(nextCart);
        persistCart(nextCart);
        return true;
      } catch (error) {
        Alert.alert(
          'Gagal Mengubah Kuantitas',
          error instanceof Error
            ? error.message
            : 'Kuantitas produk belum berhasil diubah.',
        );
        return false;
      }
    }

    setCart(prev => {
      const nextCart = prev.map(i => i.productId === productId ? { ...i, quantity } : i);
      persistCart(nextCart);
      return nextCart;
    });
    return true;
  }, [authToken, cart, isLoggedIn, persistCart, removeFromCart]);
  const clearCart = useCallback(async () => {
    if (authToken && isLoggedIn) {
      try {
        if (cart.length > 0) {
          await clearMobileCart(authToken);
        }
        setCart([]);
        persistCart([]);
        return true;
      } catch (error) {
        Alert.alert(
          'Gagal Mengosongkan Keranjang',
          error instanceof Error
            ? error.message
            : 'Keranjang belum berhasil dikosongkan.',
        );
        return false;
      }
    }

    setCart([]);
    persistCart([]);
    return true;
  }, [authToken, cart.length, isLoggedIn, persistCart]);
  const getCartTotal = useCallback(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const getCartCount = useCallback(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // Addresses
  const refreshAddresses = useCallback(async () => {
    if (!authToken || !isLoggedIn) {
      setAddresses([]);
      persistAddresses([]);
      return;
    }

    await hydrateAddresses(authToken);
  }, [authToken, hydrateAddresses, isLoggedIn, persistAddresses]);

  const createAddress = useCallback(async (payload: CreateMobileUserAddressPayload) => {
    if (!authToken || !isLoggedIn) {
      throw new Error('Silakan login untuk menyimpan alamat pengiriman.');
    }

    const createdAddress = await createMobileUserAddress(authToken, payload);
    await hydrateAddresses(authToken);
    return createdAddress;
  }, [authToken, hydrateAddresses, isLoggedIn]);

  const removeAddress = useCallback(async (id: string) => {
    if (!authToken || !isLoggedIn) {
      throw new Error('Silakan login untuk menghapus alamat pengiriman.');
    }

    await deleteMobileUserAddress(authToken, id);
    await hydrateAddresses(authToken);
  }, [authToken, hydrateAddresses, isLoggedIn]);

  const setDefaultAddress = useCallback(async (id: string) => {
    if (!authToken || !isLoggedIn) {
      throw new Error('Silakan login untuk mengubah alamat utama.');
    }

    await updateMobileUserAddress(authToken, id, {
      isPrimary: true,
    });
    await hydrateAddresses(authToken);
  }, [authToken, hydrateAddresses, isLoggedIn]);

  // Orders
  const addOrder = useCallback((order: Order, options?: { silent?: boolean }) => {
    const createdNewOrder = !orders.some(item => item.id === order.id);

    setOrders(prev => {
      const existingIndex = prev.findIndex(item => item.id === order.id);
      const nextOrders = existingIndex >= 0
        ? prev.map(item => item.id === order.id ? { ...item, ...order } : item)
        : [order, ...prev];

      Storage.setItem('orders', JSON.stringify(nextOrders));
      return nextOrders;
    });

    if (!createdNewOrder || options?.silent) {
      return;
    }

    const notif: Notification = {
      id: `n_${Date.now()}`,
      title: order.type === 'consultation' ? 'Konsultasi Dibuat' : 'Pesanan Dibuat',
      message: order.type === 'consultation'
        ? `Konsultasi dengan ${order.expertName} berhasil dibuat. Silakan lakukan pembayaran.`
        : `Pesanan #${order.orderCode || order.id} berhasil dibuat. Total: Rp ${order.totalAmount.toLocaleString('id-ID')}`,
      type: order.type === 'consultation' ? 'consultation' : 'order', read: false, createdAt: new Date().toISOString(),
    };
    setNotifications(prev => { const n = [notif, ...prev]; Storage.setItem('notifications', JSON.stringify(n)); return n; });
  }, [orders]);
  const patchOrder = useCallback((orderId: string, patch: Partial<Order>) => {
    setOrders(prev => {
      const o = prev.map(x => x.id === orderId ? { ...x, ...patch } : x);
      Storage.setItem('orders', JSON.stringify(o));
      return o;
    });
  }, []);
  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => { const o = prev.map(x => x.id === orderId ? { ...x, status } : x); Storage.setItem('orders', JSON.stringify(o)); return o; });
  }, []);
  const updateOrderPayment = useCallback((orderId: string, method: string) => {
    setOrders(prev => { const o = prev.map(x => x.id === orderId ? { ...x, paymentMethod: method, status: 'paid' as const } : x); Storage.setItem('orders', JSON.stringify(o)); return o; });
  }, []);
  const getDraftOrder = useCallback(() => {
    return orders.find(
      (o) =>
        o.type === 'product' &&
        (o.status === 'draft' || o.status === 'pending_payment'),
    );
  }, [orders]);

  // Notifications
  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => { const ns = [n, ...prev]; Storage.setItem('notifications', JSON.stringify(ns)); return ns; });
  }, []);
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => { const n = prev.map(x => x.id === id ? { ...x, read: true } : x); Storage.setItem('notifications', JSON.stringify(n)); return n; });
  }, []);
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => { const n = prev.map(x => ({ ...x, read: true })); Storage.setItem('notifications', JSON.stringify(n)); return n; });
  }, []);
  const getUnreadCount = useCallback(() => notifications.filter(n => !n.read).length, [notifications]);

  // Wishlist
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist(prev => {
      const w = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      Storage.setItem('wishlist', JSON.stringify(w)); return w;
    });
  }, []);

  const handleSetOnboarded = useCallback((v: boolean) => { setIsOnboarded(v); Storage.setItem('onboarded', v ? 'true' : 'false'); }, []);
  const handleSetHasAcceptedTerms = useCallback((v: boolean) => { setHasAcceptedTerms(v); Storage.setItem('acceptedTerms', v ? 'true' : 'false'); }, []);

  return (
    <AppContext.Provider value={{
      isAuthHydrating, isLoggedIn, authToken, user, setUser, updateProfile, changePassword, updateStatus, login, register, logout,
      isOnboarded, setIsOnboarded: handleSetOnboarded, hasAcceptedTerms, setHasAcceptedTerms: handleSetHasAcceptedTerms,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartCount,
      addresses, isAddressesLoading, refreshAddresses, createAddress, removeAddress, setDefaultAddress,
      orders, refreshOrders, addOrder, patchOrder, updateOrderStatus, updateOrderPayment, getDraftOrder,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount,
      wishlist, toggleWishlist,
      transactions,
    }}>
      {children}
    </AppContext.Provider>
  );
};
