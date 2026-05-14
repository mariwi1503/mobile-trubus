import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  WebView,
} from 'react-native-webview';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp, type Order } from '../context/AppContext';
import { useAlert } from '../context/AlertContext';
import { consultationToOrder } from '../lib/consultation-orders';
import { getMobileConsultationById } from '../lib/consultations';
import { getOrderDisplayCode } from '../lib/order-display';
import {
  createMidtransPaymentSession,
  getMobilePaymentStatus,
  type MidtransAddressPayload,
  type MidtransLineItem,
  type MidtransPaymentSession,
  type MobilePaymentStatus,
} from '../lib/payments';

const PAYMENT_LOGOS = [
  { id: 'bca', source: require('../assets/images/logos/bca.png') },
  { id: 'bni', source: require('../assets/images/logos/bni.png') },
  { id: 'bri', source: require('../assets/images/logos/bri.png') },
  { id: 'mandiri', source: require('../assets/images/logos/mandiri.png') },
  { id: 'qris', source: require('../assets/images/logos/qris.jpg') },
  { id: 'gopay', source: require('../assets/images/logos/gopay.png') },
  { id: 'ovo', source: require('../assets/images/logos/ovo.png') },
  { id: 'dana', source: require('../assets/images/logos/dana.png') },
  { id: 'shopeepay', source: require('../assets/images/logos/shopeepay.png') },
];

type CheckoutLoadRequest = {
  url: string;
};

function splitFullName(fullName: string) {
  const normalized = fullName.trim();

  if (!normalized) {
    return {
      firstName: 'Pelanggan',
      lastName: '',
    };
  }

  const parts = normalized.split(/\s+/);

  return {
    firstName: parts[0] || 'Pelanggan',
    lastName: parts.slice(1).join(' '),
  };
}

function truncateMidtransItemName(name: string, maxLength = 50) {
  if (name.length <= maxLength) {
    return name;
  }

  return `${name.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatConsultationSchedule(order: Order) {
  if (!order.consultationDate && !order.consultationTime) {
    return null;
  }

  const scheduleParts: string[] = [];

  if (order.consultationDate) {
    const scheduleDate = new Date(`${order.consultationDate}T00:00:00`);
    scheduleParts.push(
      scheduleDate.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    );
  }

  if (order.consultationTime) {
    scheduleParts.push(`${order.consultationTime} WIB`);
  }

  return scheduleParts.join(' • ');
}


function buildShippingAddress(order: Order) {
  if (!order.address) {
    return undefined;
  }

  const { firstName, lastName } = splitFullName(order.address.recipient);
  const streetAddress = [order.address.address, order.address.additional]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(', ');

  return {
    firstName,
    lastName: lastName || undefined,
    email: '',
    phone: order.address.phone,
    address: streetAddress || order.address.address,
    city: order.address.city,
    postalCode: order.address.postalCode,
    countryCode: 'IDN',
  } satisfies MidtransAddressPayload;
}

function buildLineItems(order: Order) {
  if (order.type === 'consultation') {
    const expertName = order.expertName?.trim() || 'Ahli Trubus';

    return [
      {
        id: order.expertId || order.id,
        name: truncateMidtransItemName(`Konsultasi ${expertName}`),
        price: order.totalAmount,
        quantity: 1,
        category: 'consultation',
      },
    ];
  }

  const lineItems: MidtransLineItem[] = (order.items || []).map((item) => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: 'product',
  }));

  if (order.shippingCost && order.shippingCost > 0) {
    lineItems.push({
      id: 'shipping',
      name: `Pengiriman${order.courier ? ` - ${order.courier}` : ''}`,
      price: order.shippingCost,
      quantity: 1,
      category: 'shipping',
    });
  }

  return lineItems;
}

function mapPaymentStatusToOrderStatus(
  paymentStatus: MobilePaymentStatus,
  transactionStatus?: string | null,
) {
  if (paymentStatus === 'paid') {
    return 'paid' as const;
  }

  if (paymentStatus === 'expired' || transactionStatus === 'expire') {
    return 'expired' as const;
  }

  if (paymentStatus === 'failed' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
    return 'cancelled' as const;
  }

  return 'pending_payment' as const;
}

function getStatusTone(status: ReturnType<typeof mapPaymentStatusToOrderStatus>) {
  switch (status) {
    case 'paid':
      return {
        label: 'Pembayaran berhasil diverifikasi',
        backgroundColor: '#E8F5E9',
        textColor: '#1B5E20',
        icon: 'checkmark-circle',
      };
    case 'expired':
      return {
        label: 'Sesi pembayaran sudah kedaluwarsa',
        backgroundColor: '#FFF3E0',
        textColor: '#A15C00',
        icon: 'time',
      };
    case 'cancelled':
      return {
        label: 'Transaksi dibatalkan atau ditolak',
        backgroundColor: '#FFEBEE',
        textColor: '#B71C1C',
        icon: 'close-circle',
      };
    default:
      return {
        label: 'Menunggu pembayaran di Midtrans',
        backgroundColor: '#E3F2FD',
        textColor: '#0D47A1',
        icon: 'wallet',
      };
  }
}

function canRetryPayment(order: Order) {
  if (order.type === 'consultation' && order.status === 'expired') {
    return false;
  }

  return order.status === 'draft' || order.status === 'pending_payment' || order.status === 'expired';
}

function buildExpiredSessionPatch(existingOrder: Order) {
  return {
    status: 'expired' as const,
    paymentGateway: 'midtrans' as const,
    paymentRedirectUrl: undefined,
    paymentType: undefined,
    paymentMethod: undefined,
    paymentExpiresAt: existingOrder.paymentExpiresAt,
  };
}

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, midtransReturn } = useLocalSearchParams<{
    orderId?: string;
    midtransReturn?: string;
  }>();
  const {
    addOrder,
    orders,
    authToken,
    patchOrder,
    user,
    setUser,
  } = useApp();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [hydratedOrder, setHydratedOrder] = useState<Order | null>(null);
  const [isHydratingOrder, setIsHydratingOrder] = useState(false);
  const [orderLookupError, setOrderLookupError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const [activeCheckoutSession, setActiveCheckoutSession] = useState<MidtransPaymentSession | null>(null);
  const [isCheckoutWebViewLoading, setIsCheckoutWebViewLoading] = useState(false);

  const resolvedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const returnedFromMidtrans = (Array.isArray(midtransReturn) ? midtransReturn[0] : midtransReturn) === '1';
  const order = orders.find((candidate) => candidate.id === resolvedOrderId) || hydratedOrder;
  const hasFinishedPayment = order
    ? ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(order.status)
    : false;

  const statusTone = useMemo(() => {
    return getStatusTone(order ? mapPaymentStatusToOrderStatus(
      hasFinishedPayment
        ? 'paid'
        : order.status === 'expired'
        ? 'expired'
        : order.status === 'cancelled'
        ? 'failed'
        : 'pending',
      order.paymentStatusDetail,
    ) : 'pending_payment');
  }, [hasFinishedPayment, order]);

  const supportedMethods = useMemo(() => {
    return [
      'Virtual Account bank',
      'QRIS',
      'GoPay',
      'ShopeePay',
      'DANA',
      'OVO',
    ].join(' • ');
  }, []);

  const expireAtLabel = useMemo(() => {
    if (!order?.paymentExpiresAt) {
      return null;
    }

    return new Date(order.paymentExpiresAt).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [order?.paymentExpiresAt]);

  const paymentDetails = useMemo(() => {
    if (!order) {
      return null;
    }

    if (order.type === 'consultation') {
      return {
        itemRows: [
          {
            id: 'consultation-slot',
            title: '1 Slot Konsultasi',
            description: order.expertName?.trim() || 'Ahli Trubus',
            supporting: formatConsultationSchedule(order),
            quantityLabel: `1 x ${formatRupiah(order.totalAmount)}`,
            lineTotal: order.totalAmount,
          },
        ],
        itemSubtotal: order.totalAmount,
        shippingAmount: 0,
      };
    }

    const productItems = (order.items || []).map((item) => ({
      id: item.productId,
      title: item.name,
      description: item.store || undefined,
      supporting: undefined,
      quantityLabel: `${item.quantity} x ${formatRupiah(item.price)}`,
      lineTotal: item.price * item.quantity,
    }));
    const itemSubtotal = productItems.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      itemRows: productItems.length > 0
        ? productItems
        : [
            {
              id: 'product-order',
              title: 'Pesanan Produk',
              description: order.store || 'Produk Trubus',
              supporting: undefined,
              quantityLabel: null,
              lineTotal: order.totalAmount,
            },
          ],
      itemSubtotal: productItems.length > 0 ? itemSubtotal : order.totalAmount,
      shippingAmount: order.shippingCost || 0,
    };
  }, [order]);

  const checkoutSource = useMemo(() => {
    if (activeCheckoutSession?.redirectUrl) {
      return {
        uri: activeCheckoutSession.redirectUrl,
      };
    }

    return null;
  }, [activeCheckoutSession]);

  useEffect(() => {
    let isMounted = true;

    if (!resolvedOrderId || order || !authToken) {
      setHydratedOrder((currentOrder) => {
        if (order && currentOrder?.id === order.id) {
          return null;
        }

        return currentOrder;
      });
      setOrderLookupError(null);
      setIsHydratingOrder(false);

      return () => {
        isMounted = false;
      };
    }

    const loadConsultationOrder = async () => {
      try {
        setIsHydratingOrder(true);
        const consultation = await getMobileConsultationById(authToken, resolvedOrderId);

        if (!isMounted) {
          return;
        }

        const nextOrder = consultationToOrder(consultation);
        setHydratedOrder(nextOrder);
        addOrder(nextOrder, { silent: true });
        setOrderLookupError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHydratedOrder(null);
        setOrderLookupError(
          error instanceof Error
            ? error.message
            : 'Pesanan pembayaran tidak ditemukan.',
        );
      } finally {
        if (isMounted) {
          setIsHydratingOrder(false);
        }
      }
    };

    void loadConsultationOrder();

    return () => {
      isMounted = false;
    };
  }, [addOrder, authToken, order, resolvedOrderId]);

  const finalizeSuccessfulPayment = useCallback((paymentMethod?: string | null, transactionStatus?: string | null) => {
    if (!order) {
      return;
    }

    const wasAlreadyPaid = order.status === 'paid';
    const resolvedMethod = paymentMethod?.trim() || order.paymentMethod || 'Midtrans';

    patchOrder(order.id, {
      status: 'paid',
      paymentGateway: 'midtrans',
      paymentMethod: resolvedMethod,
      paymentStatusDetail: transactionStatus || order.paymentStatusDetail,
      paymentUpdatedAt: new Date().toISOString(),
    });

    if (!wasAlreadyPaid) {
      const nextCoinBalance = order.coinRedemptionCost
        ? Math.max(0, (user.trubusCoins || 0) - order.coinRedemptionCost)
        : (user.trubusCoins || 0) + Math.floor(order.totalAmount / 100);

      setUser({ ...user, trubusCoins: nextCoinBalance });
    }

    router.replace({
      pathname: '/order-success',
      params: { orderId: order.id, type: order.type },
    });
  }, [order, patchOrder, router, setUser, user]);

  const syncPaymentStatus = useCallback(async (refresh = true) => {
    if (!order || isSyncingStatus) {
      return;
    }

    setIsSyncingStatus(true);

    try {
      const statusResponse = await getMobilePaymentStatus(order.id, {
        accessToken: authToken || undefined,
        refresh,
      });
      const nextStatus = mapPaymentStatusToOrderStatus(
        statusResponse.paymentStatus,
        statusResponse.transactionStatus,
      );
      const resolvedMethod = statusResponse.paymentMethod?.trim()
        || statusResponse.paymentType?.trim()
        || order.paymentMethod;

      patchOrder(order.id, {
        ...(nextStatus === 'expired'
          ? buildExpiredSessionPatch(order)
          : {
              status: nextStatus,
              paymentGateway: 'midtrans',
              paymentRedirectUrl: statusResponse.redirectUrl || order.paymentRedirectUrl,
              paymentMethod: resolvedMethod,
              paymentType: statusResponse.paymentType || order.paymentType,
            }),
        paymentProviderOrderId: statusResponse.orderCode,
        paymentExpiresAt: statusResponse.expiresAt || order.paymentExpiresAt,
        paymentStatusDetail: statusResponse.transactionStatus,
        paymentUpdatedAt: statusResponse.updatedAt || new Date().toISOString(),
      });

      if (nextStatus === 'paid') {
        finalizeSuccessfulPayment(resolvedMethod, statusResponse.transactionStatus);
        return;
      }

      if (nextStatus === 'expired') {
        showAlert('Sesi Kedaluwarsa', 'Sesi pembayaran Midtrans sudah kedaluwarsa. Silakan buat sesi pembayaran baru.');
      }
    } catch (error) {
      showAlert(
        'Status Belum Tersinkron',
        error instanceof Error
          ? error.message
          : 'Status pembayaran belum bisa diperbarui dari backend.',
      );
    } finally {
      setIsSyncingStatus(false);
    }
  }, [authToken, finalizeSuccessfulPayment, isSyncingStatus, order, patchOrder, showAlert]);

  const ensurePaymentSession = useCallback(async () => {
    if (!order) {
      return null;
    }

    if (order.status === 'expired') {
      patchOrder(order.id, buildExpiredSessionPatch(order));
    }

    if (
      order.paymentGateway === 'midtrans'
      && order.paymentRedirectUrl
      && order.status !== 'expired'
      && order.status !== 'cancelled'
    ) {
      return {
        orderCode: order.paymentProviderOrderId || order.id,
        redirectUrl: order.paymentRedirectUrl || '',
        transactionStatus: order.paymentStatusDetail || 'pending',
        paymentStatus: order.status === 'paid' ? 'paid' : 'pending' as MobilePaymentStatus,
        paymentMethod: order.paymentMethod || null,
        paymentType: order.paymentType || null,
        expiresAt: order.paymentExpiresAt || null,
      };
    }

    const { firstName, lastName } = splitFullName(user.name);
    const lineItems = buildLineItems(order);
    const returnUrl = Linking.createURL('/payment', {
      queryParams: {
        orderId: order.id,
        midtransReturn: '1',
      },
    });

    setIsCreatingSession(true);

    try {
      const session = await createMidtransPaymentSession({
        orderCode: order.id,
        orderType: order.type,
        grossAmount: order.totalAmount,
        shippingAmount: order.shippingCost,
        items: lineItems,
        customer: {
          firstName,
          lastName: lastName || undefined,
          email: user.email || undefined,
          phone: user.phone,
        },
        shippingAddress: buildShippingAddress(order),
        returnUrl,
        metadata: {
          appPlatform: Platform.OS,
          fulfillmentMethod:
            order.type === 'consultation'
              ? 'consultation'
              : order.fulfillmentMethod || 'delivery',
          coinRedemptionCost: order.coinRedemptionCost || 0,
        },
      }, authToken || undefined);

      patchOrder(order.id, {
        status: mapPaymentStatusToOrderStatus(session.paymentStatus, session.transactionStatus),
        paymentGateway: 'midtrans',
        paymentProviderOrderId: session.orderCode,
        paymentRedirectUrl: session.redirectUrl,
        paymentType: session.paymentType || undefined,
        paymentMethod: session.paymentMethod || undefined,
        paymentExpiresAt: session.expiresAt || undefined,
        paymentStatusDetail: session.transactionStatus,
        paymentUpdatedAt: new Date().toISOString(),
      });

      return session;
    } catch (error) {
      showAlert(
        'Gagal Membuat Pembayaran',
        error instanceof Error
          ? error.message
          : 'Sesi pembayaran Midtrans belum dapat dibuat.',
      );
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [authToken, order, patchOrder, showAlert, user.email, user.name, user.phone]);

  const handlePayNow = useCallback(async () => {
    if (!order) {
      return;
    }

    if (order.type === 'consultation' && order.status === 'expired') {
      router.replace('/consultations');
      return;
    }

    if (order.status === 'paid') {
      finalizeSuccessfulPayment(order.paymentMethod, order.paymentStatusDetail);
      return;
    }

    if (hasFinishedPayment) {
      router.replace(order.type === 'consultation' ? '/consultations' : '/orders');
      return;
    }

    const session = await ensurePaymentSession();

    if (!session) {
      return;
    }

    const canUseInternalRedirect = Boolean(session.redirectUrl);

    if (Platform.OS !== 'web' && !canUseInternalRedirect) {
      showAlert(
        'Checkout Belum Siap',
        'Sesi pembayaran Midtrans belum memiliki redirect URL yang bisa dibuka.',
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (!session.redirectUrl) {
          throw new Error('Redirect URL Midtrans tidak tersedia untuk web checkout.');
        }

        await WebBrowser.openBrowserAsync(session.redirectUrl);
      } else {
        setIsCheckoutWebViewLoading(true);
        setActiveCheckoutSession(session);
      }
    } catch (error) {
      showAlert(
        'Halaman Pembayaran Tidak Bisa Dibuka',
        error instanceof Error
          ? error.message
          : 'Midtrans checkout belum bisa dibuka dari aplikasi.',
      );
      return;
    }

    if (Platform.OS === 'web') {
      await syncPaymentStatus(true);
    }
  }, [ensurePaymentSession, finalizeSuccessfulPayment, hasFinishedPayment, order, router, showAlert, syncPaymentStatus]);

  const closeCheckout = useCallback(async (shouldSyncStatus = true) => {
    setActiveCheckoutSession(null);
    setIsCheckoutWebViewLoading(false);

    if (shouldSyncStatus) {
      await syncPaymentStatus(true);
    }
  }, [syncPaymentStatus]);

  const handleCheckoutRequest = useCallback((request: CheckoutLoadRequest) => {
    const requestUrl = request.url || '';
    const appReturnUrl = Linking.createURL('/payment');

    if (requestUrl.startsWith(appReturnUrl) || requestUrl.startsWith('halo-trubus://payment')) {
      void closeCheckout(true);
      return false;
    }

    if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
      Linking.openURL(requestUrl).catch(() => undefined);
      return false;
    }

    return true;
  }, [closeCheckout]);

  useEffect(() => {
    if (returnedFromMidtrans) {
      void syncPaymentStatus(true);
    }
  }, [returnedFromMidtrans, syncPaymentStatus]);

  if (isHydratingOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pembayaran</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.emptySubtext}>
            Menyiapkan data konsultasi untuk pembayaran...
          </Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pembayaran</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Pesanan tidak ditemukan</Text>
          <Text style={styles.emptySubtext}>
            {orderLookupError || 'Pastikan pesanan masih tersedia sebelum melanjutkan pembayaran.'}
          </Text>
        </View>
      </View>
    );
  }

  const isBusy = isCreatingSession || isSyncingStatus;
  const isPendingPayment = canRetryPayment(order);
  const isExpiredPayment = order.status === 'expired';
  const isExpiredConsultation = order.type === 'consultation' && order.status === 'expired';
  const displayOrderCode = getOrderDisplayCode(order, resolvedOrderId);
  const primaryButtonLabel = hasFinishedPayment
    ? 'Lihat Status Pesanan'
    : order.paymentRedirectUrl && (order.status === 'draft' || order.status === 'pending_payment')
    ? 'Lanjutkan Pembayaran'
    : isExpiredConsultation
    ? 'Kembali ke Riwayat Konsultasi'
    : order.status === 'expired'
    ? 'Pilih Metode Pembayaran Baru'
    : order.status === 'cancelled'
    ? 'Buat Sesi Pembayaran Baru'
    : 'Bayar dengan Midtrans';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pembayaran Midtrans</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Kode Pesanan</Text>
          <Text style={styles.summaryOrderId}>{displayOrderCode}</Text>
          <Text style={styles.summaryAmount}>Rp {order.totalAmount.toLocaleString('id-ID')}</Text>
          {order.coinRedemptionCost ? (
            <Text style={styles.summaryCoinText}>
              {order.coinRedemptionCost.toLocaleString('id-ID')} coin akan dipotong setelah pembayaran berhasil.
            </Text>
          ) : null}
        </View>

        <View style={[styles.statusCard, { backgroundColor: statusTone.backgroundColor }]}>
          <Ionicons name={statusTone.icon as never} size={18} color={statusTone.textColor} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: statusTone.textColor }]}>
              {statusTone.label}
            </Text>
            <Text style={[styles.statusSubtext, { color: statusTone.textColor }]}>
              {order.paymentStatusDetail
                ? `Status Midtrans: ${order.paymentStatusDetail}`
                : 'Status akhir transaksi selalu divalidasi ulang dari backend.'}
            </Text>
          </View>
        </View>

        {paymentDetails ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailTitle}>Rincian yang Dibayar</Text>
            </View>

            {paymentDetails.itemRows.map((item) => (
              <View key={item.id} style={styles.detailItemRow}>
                <View style={styles.detailItemInfo}>
                  <Text style={styles.detailItemName}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.detailItemMeta}>{item.description}</Text>
                  ) : null}
                  {item.supporting ? (
                    <Text style={styles.detailItemSupporting}>{item.supporting}</Text>
                  ) : null}
                  {item.quantityLabel ? (
                    <Text style={styles.detailItemQty}>{item.quantityLabel}</Text>
                  ) : null}
                </View>
                <Text style={styles.detailItemAmount}>{formatRupiah(item.lineTotal)}</Text>
              </View>
            ))}

            <View style={styles.detailDivider} />

            <View style={styles.detailSummaryRow}>
              <Text style={styles.detailSummaryLabel}>Subtotal Item</Text>
              <Text style={styles.detailSummaryValue}>
                {formatRupiah(paymentDetails.itemSubtotal)}
              </Text>
            </View>

            {order.type === 'product' ? (
              <View style={styles.detailSummaryRow}>
                <Text style={styles.detailSummaryLabel}>
                  {order.courier ? `Pengiriman (${order.courier})` : 'Pengiriman'}
                </Text>
                <Text style={styles.detailSummaryValue}>
                  {paymentDetails.shippingAmount > 0
                    ? formatRupiah(paymentDetails.shippingAmount)
                    : 'Gratis'}
                </Text>
              </View>
            ) : null}

            <View style={[styles.detailSummaryRow, styles.detailTotalRow]}>
              <Text style={styles.detailTotalLabel}>Total Dibayar Sekarang</Text>
              <Text style={styles.detailTotalValue}>{formatRupiah(order.totalAmount)}</Text>
            </View>

            {order.coinRedemptionCost ? (
              <View style={styles.coinNotice}>
                <Ionicons name="leaf-outline" size={16} color="#7A5A00" />
                <Text style={styles.coinNoticeText}>
                  {order.coinRedemptionCost.toLocaleString('id-ID')} coin Trubus juga akan dipakai
                  setelah pembayaran berhasil.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {isExpiredPayment ? (
          <View style={styles.expiredNoticeCard}>
            <View style={styles.expiredNoticeHeader}>
              <Ionicons name="refresh-circle-outline" size={18} color="#A15C00" />
              <Text style={styles.expiredNoticeTitle}>
                {isExpiredConsultation
                  ? 'Konsultasi ini sudah tidak valid'
                  : 'Metode pembayaran sebelumnya kedaluwarsa'}
              </Text>
            </View>
            <Text style={styles.expiredNoticeText}>
              {isExpiredConsultation
                ? 'Karena pembayaran tidak diselesaikan tepat waktu, slot konsultasi ini sudah dilepas dan tidak bisa dibayar ulang. Silakan buat konsultasi baru jika masih ingin melanjutkan.'
                : 'Sesi lama sudah tidak bisa dipakai lagi. Tekan tombol utama untuk membuat sesi Midtrans baru dan pilih metode pembayaran yang baru.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Flow pembayaran</Text>
          </View>
          <Text style={styles.infoText}>
            Checkout Midtrans dibuka langsung di dalam aplikasi tanpa browser eksternal. Untuk alur yang lebih stabil, aplikasi memprioritaskan halaman pembayaran Midtrans internal di WebView.
          </Text>
          <Text style={styles.infoCaption}>{supportedMethods}</Text>
        </View>

        <View style={styles.logoCard}>
          <Text style={styles.logoCardTitle}>Metode yang kami siapkan</Text>
          <View style={styles.logoGrid}>
            {PAYMENT_LOGOS.map((logo) => (
              <View key={logo.id} style={styles.logoBox}>
                <Image source={logo.source} style={styles.logoImage} resizeMode="contain" />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Gateway</Text>
            <Text style={styles.sessionValue}>Midtrans SNAP</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Metode terdeteksi</Text>
            <Text style={styles.sessionValue}>{order.paymentMethod || order.paymentType || '-'}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Status lokal</Text>
            <Text style={styles.sessionValue}>{order.status}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionLabel}>Kedaluwarsa sesi</Text>
            <Text style={styles.sessionValue}>{expireAtLabel || '-'}</Text>
          </View>
        </View>

        {isBusy ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {isCreatingSession
                ? 'Membuat sesi pembayaran Midtrans...'
                : 'Menyinkronkan status pembayaran...'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomLabel}>Total Pembayaran</Text>
          <Text style={styles.bottomAmount}>Rp {order.totalAmount.toLocaleString('id-ID')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isBusy && styles.buttonDisabled]}
          disabled={isBusy}
          onPress={() => void handlePayNow()}
        >
          <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
        </TouchableOpacity>
      </View>

      {activeCheckoutSession && checkoutSource ? (
        <Modal
          animationType="slide"
          presentationStyle="fullScreen"
          visible
          onRequestClose={() => {
            void closeCheckout(true);
          }}
        >
          <SafeAreaView style={styles.checkoutModal}>
            <View style={styles.checkoutHeader}>
              <TouchableOpacity
                style={styles.checkoutCloseButton}
                onPress={() => {
                  void closeCheckout(true);
                }}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.checkoutHeaderText}>
                <Text style={styles.checkoutTitle}>Checkout Midtrans</Text>
                <Text style={styles.checkoutSubtitle}>
                  Checkout dibuka langsung di dalam aplikasi tanpa browser eksternal.
                </Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.checkoutBody}>
              <WebView
                key={`${activeCheckoutSession.orderCode}:${activeCheckoutSession.redirectUrl || 'checkout'}`}
                source={checkoutSource}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
                setSupportMultipleWindows={false}
                startInLoadingState
                onLoadStart={() => setIsCheckoutWebViewLoading(true)}
                onLoadEnd={() => setIsCheckoutWebViewLoading(false)}
                onShouldStartLoadWithRequest={handleCheckoutRequest}
                onError={() => {
                  setIsCheckoutWebViewLoading(false);
                  showAlert(
                    'Checkout Tidak Bisa Dibuka',
                    'Halaman pembayaran Midtrans gagal dimuat di dalam aplikasi.',
                  );
                  void closeCheckout(false);
                }}
                renderLoading={() => (
                  <View style={styles.checkoutLoadingState}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.checkoutLoadingText}>
                      Membuka checkout Midtrans...
                    </Text>
                  </View>
                )}
              />

            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
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
    paddingTop: 48,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutModal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  checkoutCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F2',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  checkoutHeaderText: {
    flex: 1,
  },
  checkoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkoutBody: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  checkoutLoadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F4F7F2',
  },
  checkoutLoadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDark,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.76)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryOrderId: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  summaryAmount: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  summaryCoinText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#FFF8D6',
  },
  statusCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusSubtext: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
  detailCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailItemRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailItemInfo: {
    flex: 1,
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailItemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailItemSupporting: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  detailItemQty: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailItemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailDivider: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  detailSummaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailSummaryLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailSummaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  detailTotalRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  detailTotalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  coinNotice: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFF8D6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  coinNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A5A00',
    fontWeight: '600',
  },
  infoCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  expiredNoticeCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#F4D38D',
  },
  expiredNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiredNoticeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#8C5A00',
  },
  expiredNoticeText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: '#8C5A00',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  infoCaption: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  logoCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  logoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  logoGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  logoBox: {
    width: 58,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  logoImage: {
    width: 40,
    height: 24,
  },
  sessionCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  sessionLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sessionValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  loadingCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#DCEBDC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  bottomSummary: {
    marginBottom: SPACING.md,
  },
  bottomLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomAmount: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  primaryButton: {
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
