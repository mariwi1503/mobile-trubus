import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  BackendMobileUser,
  getMobileUserProfile,
  loginMobileUser,
  validateIndonesianMobilePhone,
  validatePassword,
} from '../lib/auth';

const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') { return localStorage.getItem(key); }
      return memoryStorage[key] || null;
    } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.setItem(key, value); }
      else { memoryStorage[key] = value; }
    } catch { }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.removeItem(key); }
      else { delete memoryStorage[key]; }
    } catch { }
  },
};
const memoryStorage: Record<string, string> = {};

export interface CartItem {
  productId: string; name: string; price: number; image: any;
  quantity: number; weight: number; store: string;
}
export interface Address {
  id: string; label: string; recipient: string; phone: string;
  address: string; city: string; province: string; postalCode: string; isDefault: boolean;
}
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
  specialization?: string; experience?: number; fee?: number;
  status?: 'online' | 'busy' | 'offline'; // Added status
}
export interface Transaction {
  id: string; type: 'topup' | 'transfer_in' | 'transfer_out' | 'payment';
  amount: number; date: string; description: string;
  status: 'success' | 'failed' | 'pending';
}
export interface RegisteredUser extends UserProfile {
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
  updateStatus: (status: UserProfile['status']) => void; // Added updateStatus
  login: (phone: string, password: string) => Promise<AuthResult>;
  register: (data: RegisteredUser) => Promise<AuthResult>;
  logout: () => void;
  // Onboarding
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
  hasAcceptedTerms: boolean;
  setHasAcceptedTerms: (v: boolean) => void;
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  // Addresses
  addresses: Address[];
  addAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // Orders
  orders: Order[];
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

function formatPhoneForDisplay(phone: string) {
  if (phone.startsWith('62')) {
    return `0${phone.slice(2)}`;
  }

  return phone;
}

function normalizeBackendUser(user: BackendMobileUser): UserProfile {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    name: fullName || 'Sahabat Trubus',
    email: user.email || '',
    phone: formatPhoneForDisplay(user.phone),
    avatar: user.gender === 'FEMALE' ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR,
    role: 'consumer',
    trubusCoins: 0,
  };
}

const defaultAddresses: Address[] = [
  {
    id: 'addr1', label: 'Rumah', recipient: 'Budi Santoso', phone: '081234567890',
    address: 'Jl. Merdeka No. 123, RT 05/RW 02, Kel. Menteng', city: 'Jakarta Pusat',
    province: 'DKI Jakarta', postalCode: '10310', isDefault: true
  },
  {
    id: 'addr2', label: 'Kantor', recipient: 'Budi Santoso', phone: '081234567890',
    address: 'Gedung Graha Mandiri Lt. 5, Jl. Imam Bonjol No. 61', city: 'Jakarta Pusat',
    province: 'DKI Jakarta', postalCode: '10310', isDefault: false
  },
];

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
            const backendUser = await getMobileUserProfile(session.accessToken);
            const normalizedUser = normalizeBackendUser(backendUser);
            setAuthToken(session.accessToken);
            setUserState(normalizedUser);
            setIsLoggedIn(true);
            persistSession({
              accessToken: session.accessToken,
              user: normalizedUser,
            });
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
  }, [clearSession, persistSession]);

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

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login gagal',
      };
    }
  }, [persistSession]);

  const register = useCallback(async (_data: RegisteredUser): Promise<AuthResult> => {
    const phoneError = validateIndonesianMobilePhone(_data.phone);
    if (phoneError) {
      return { success: false, error: phoneError };
    }

    const passwordError = validatePassword(_data.password, { minLength: 6 });
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    return {
      success: false,
      error: 'Registrasi backend masih memakai OTP WhatsApp 3 langkah dan belum diintegrasikan di aplikasi ini.',
    };
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setIsLoggedIn(false);
    setUserState(guestUser);
    clearSession();
  }, [clearSession]);

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
    if (isLoggedIn && authToken) {
      persistSession({ accessToken: authToken, user: u });
    }
  }, [authToken, isLoggedIn, persistSession]);

  const updateStatus = useCallback((status: UserProfile['status']) => {
    setUserState(prev => {
      const updated = { ...prev, status };
      if (isLoggedIn && authToken) {
        persistSession({ accessToken: authToken, user: updated });
      }
      return updated;
    });
  }, [authToken, isLoggedIn, persistSession]);

  // Cart
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      const newCart = existing
        ? prev.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i)
        : [...prev, item];
      Storage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  }, []);
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => { const c = prev.filter(i => i.productId !== productId); Storage.setItem('cart', JSON.stringify(c)); return c; });
  }, []);
  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => {
      const c = quantity <= 0 ? prev.filter(i => i.productId !== productId) : prev.map(i => i.productId === productId ? { ...i, quantity } : i);
      Storage.setItem('cart', JSON.stringify(c)); return c;
    });
  }, []);
  const clearCart = useCallback(() => { setCart([]); Storage.setItem('cart', '[]'); }, []);
  const getCartTotal = useCallback(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const getCartCount = useCallback(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  // Addresses
  const addAddress = useCallback((address: Address) => {
    setAddresses(prev => {
      const a = address.isDefault ? [...prev.map(x => ({ ...x, isDefault: false })), address] : [...prev, address];
      Storage.setItem('addresses', JSON.stringify(a)); return a;
    });
  }, []);
  const removeAddress = useCallback((id: string) => {
    setAddresses(prev => { const a = prev.filter(x => x.id !== id); Storage.setItem('addresses', JSON.stringify(a)); return a; });
  }, []);
  const setDefaultAddress = useCallback((id: string) => {
    setAddresses(prev => { const a = prev.map(x => ({ ...x, isDefault: x.id === id })); Storage.setItem('addresses', JSON.stringify(a)); return a; });
  }, []);

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
      isAuthHydrating, isLoggedIn, authToken, user, setUser, updateStatus, login, register, logout,
      isOnboarded, setIsOnboarded: handleSetOnboarded, hasAcceptedTerms, setHasAcceptedTerms: handleSetHasAcceptedTerms,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartCount,
      addresses, addAddress, removeAddress, setDefaultAddress,
      orders, addOrder, patchOrder, updateOrderStatus, updateOrderPayment, getDraftOrder,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount,
      wishlist, toggleWishlist,
      transactions,
    }}>
      {children}
    </AppContext.Provider>
  );
};
