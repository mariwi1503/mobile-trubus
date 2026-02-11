import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

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
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.removeItem(key); }
      else { delete memoryStorage[key]; }
    } catch {}
  },
};
const memoryStorage: Record<string, string> = {};

export interface CartItem {
  productId: string; name: string; price: number; image: string;
  quantity: number; weight: number; store: string;
}
export interface Address {
  id: string; label: string; recipient: string; phone: string;
  address: string; city: string; province: string; postalCode: string; isDefault: boolean;
}
export interface Order {
  id: string; type: 'product' | 'consultation'; items?: CartItem[];
  expertId?: string; expertName?: string; consultationDate?: string; consultationTime?: string;
  totalAmount: number; shippingCost?: number; courier?: string; address?: Address;
  status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  paymentMethod?: string; createdAt: string; store?: string;
  // For expert: client info
  clientName?: string; clientPhone?: string;
}
export interface Notification {
  id: string; title: string; message: string;
  type: 'order' | 'consultation' | 'promo' | 'info'; read: boolean; createdAt: string;
}
export interface UserProfile {
  name: string; email: string; phone: string; avatar: string;
  role: 'consumer' | 'expert'; trubusCoins: number;
  specialization?: string; experience?: number; fee?: number;
}
export interface RegisteredUser extends UserProfile {
  password: string;
}

interface AppContextType {
  // Auth
  isLoggedIn: boolean;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (data: RegisteredUser) => { success: boolean; error?: string };
  logout: () => void;
  registeredUsers: RegisteredUser[];
  // Onboarding
  isOnboarded: boolean;
  setIsOnboarded: (v: boolean) => void;
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
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderPayment: (orderId: string, method: string) => void;
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
}

const guestUser: UserProfile = {
  name: 'Tamu', email: '', phone: '', avatar: '', role: 'consumer', trubusCoins: 0,
};

const defaultAddresses: Address[] = [
  { id: 'addr1', label: 'Rumah', recipient: 'Budi Santoso', phone: '081234567890',
    address: 'Jl. Merdeka No. 123, RT 05/RW 02, Kel. Menteng', city: 'Jakarta Pusat',
    province: 'DKI Jakarta', postalCode: '10310', isDefault: true },
  { id: 'addr2', label: 'Kantor', recipient: 'Budi Santoso', phone: '081234567890',
    address: 'Gedung Graha Mandiri Lt. 5, Jl. Imam Bonjol No. 61', city: 'Jakarta Pusat',
    province: 'DKI Jakarta', postalCode: '10310', isDefault: false },
];

const defaultNotifications: Notification[] = [
  { id: 'n1', title: 'Selamat Datang!', message: 'Selamat datang di Halo Toko Trubus. Nikmati konsultasi pertama GRATIS!',
    type: 'promo', read: false, createdAt: '2026-02-11T08:00:00Z' },
  { id: 'n2', title: 'Promo Pupuk Organik', message: 'Diskon 20% untuk semua pupuk organik. Berlaku hingga akhir bulan!',
    type: 'promo', read: false, createdAt: '2026-02-10T10:00:00Z' },
  { id: 'n3', title: 'Tips Berkebun', message: 'Musim hujan tiba! Baca tips melindungi tanaman dari genangan air.',
    type: 'info', read: true, createdAt: '2026-02-09T14:00:00Z' },
];

// Pre-seeded users for demo
const seedUsers: RegisteredUser[] = [
  { name: 'Budi Santoso', email: 'budi@email.com', phone: '081234567890', password: '123456',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    role: 'consumer', trubusCoins: 250000 },
  { name: 'Dr. Ir. Bambang Suryadi', email: 'bambang@email.com', phone: '081298765432', password: '123456',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
    role: 'expert', trubusCoins: 1500000, specialization: 'Ahli Hama & Penyakit Tanaman', experience: 15, fee: 75000 },
  { name: 'Dr. Rina Wulandari', email: 'rina@email.com', phone: '081345678901', password: '123456',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    role: 'expert', trubusCoins: 980000, specialization: 'Ahli Hidroponik & Urban Farming', experience: 10, fee: 85000 },
];

const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUserState] = useState<UserProfile>(guestUser);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(seedUsers);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedOnboarded = await Storage.getItem('onboarded');
        if (storedOnboarded === 'true') setIsOnboarded(true);
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
        const storedRegisteredUsers = await Storage.getItem('registeredUsers');
        if (storedRegisteredUsers) setRegisteredUsers(JSON.parse(storedRegisteredUsers));
        // Restore session
        const storedSession = await Storage.getItem('session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          setUserState(session);
          setIsLoggedIn(true);
        }
      } catch {}
    };
    loadData();
  }, []);

  // Auth
  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const found = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) return { success: false, error: 'Email atau password salah' };
    const { password: _, ...profile } = found;
    setUserState(profile);
    setIsLoggedIn(true);
    Storage.setItem('session', JSON.stringify(profile));
    return { success: true };
  }, [registeredUsers]);

  const register = useCallback((data: RegisteredUser): { success: boolean; error?: string } => {
    const exists = registeredUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'Email sudah terdaftar' };
    if (!data.name.trim()) return { success: false, error: 'Nama tidak boleh kosong' };
    if (!data.email.includes('@')) return { success: false, error: 'Format email tidak valid' };
    if (data.password.length < 6) return { success: false, error: 'Password minimal 6 karakter' };
    if (!data.phone || data.phone.length < 10) return { success: false, error: 'Nomor telepon tidak valid' };
    const newUser: RegisteredUser = {
      ...data,
      avatar: data.role === 'expert'
        ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face'
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      trubusCoins: 50000, // Welcome bonus
    };
    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    Storage.setItem('registeredUsers', JSON.stringify(updated));
    // Auto login
    const { password: _, ...profile } = newUser;
    setUserState(profile);
    setIsLoggedIn(true);
    Storage.setItem('session', JSON.stringify(profile));
    return { success: true };
  }, [registeredUsers]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserState(guestUser);
    Storage.removeItem('session');
  }, []);

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
    if (isLoggedIn) Storage.setItem('session', JSON.stringify(u));
  }, [isLoggedIn]);

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
  const addOrder = useCallback((order: Order) => {
    setOrders(prev => { const o = [order, ...prev]; Storage.setItem('orders', JSON.stringify(o)); return o; });
    const notif: Notification = {
      id: `n_${Date.now()}`,
      title: order.type === 'consultation' ? 'Konsultasi Dibuat' : 'Pesanan Dibuat',
      message: order.type === 'consultation'
        ? `Konsultasi dengan ${order.expertName} berhasil dibuat. Silakan lakukan pembayaran.`
        : `Pesanan #${order.id} berhasil dibuat. Total: Rp ${order.totalAmount.toLocaleString('id-ID')}`,
      type: order.type === 'consultation' ? 'consultation' : 'order', read: false, createdAt: new Date().toISOString(),
    };
    setNotifications(prev => { const n = [notif, ...prev]; Storage.setItem('notifications', JSON.stringify(n)); return n; });
  }, []);
  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => { const o = prev.map(x => x.id === orderId ? { ...x, status } : x); Storage.setItem('orders', JSON.stringify(o)); return o; });
  }, []);
  const updateOrderPayment = useCallback((orderId: string, method: string) => {
    setOrders(prev => { const o = prev.map(x => x.id === orderId ? { ...x, paymentMethod: method, status: 'paid' as const } : x); Storage.setItem('orders', JSON.stringify(o)); return o; });
  }, []);

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

  return (
    <AppContext.Provider value={{
      isLoggedIn, user, setUser, login, register, logout, registeredUsers,
      isOnboarded, setIsOnboarded: handleSetOnboarded,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartCount,
      addresses, addAddress, removeAddress, setDefaultAddress,
      orders, addOrder, updateOrderStatus, updateOrderPayment,
      notifications, addNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount,
      wishlist, toggleWishlist,
    }}>
      {children}
    </AppContext.Provider>
  );
};
