export interface CoinReward {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  weight: number;
  store: string;
  badge: string;
  image: string;
}

export const COIN_REWARDS: CoinReward[] = [
  {
    id: 'reward_tumbler',
    name: 'Tumbler Trubus Exclusive',
    description: 'Tumbler stainless 500ml dengan logo Trubus. Cocok untuk aktivitas harian.',
    coinCost: 450,
    weight: 450,
    store: 'Merchandise Center Jakarta',
    badge: 'Favorit',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop',
  },
  {
    id: 'reward_payung',
    name: 'Payung Lipat Trubus',
    description: 'Payung lipat anti UV dengan warna khas Trubus dan sleeve premium.',
    coinCost: 650,
    weight: 600,
    store: 'Merchandise Center Bandung',
    badge: 'Musim Hujan',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=300&h=300&fit=crop',
  },
  {
    id: 'reward_kaos',
    name: 'Kaos Trubus Signature',
    description: 'Kaos cotton combed edisi Trubus Signature. Nyaman untuk kegiatan lapangan.',
    coinCost: 900,
    weight: 300,
    store: 'Merchandise Center Surabaya',
    badge: 'Limited',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
  },
  {
    id: 'reward_totebag',
    name: 'Totebag Kanvas Trubus',
    description: 'Totebag kanvas serbaguna untuk belanja, membawa buku, atau perlengkapan kebun.',
    coinCost: 500,
    weight: 250,
    store: 'Merchandise Center Yogyakarta',
    badge: 'Eco Pick',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
  },
];
