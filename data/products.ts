export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  sold: number;
  stock: number;
  description: string;
  weight: number;
  store: string;
}

export const PRODUCT_CATEGORIES = [
  { id: 'all', name: 'Semua', icon: 'apps' },
  { id: 'bibit', name: 'Bibit', icon: 'leaf' },
  { id: 'tanaman', name: 'Tanaman', icon: 'flower' },
  { id: 'pupuk', name: 'Pupuk', icon: 'flask' },
  { id: 'pestisida', name: 'Pestisida', icon: 'shield-checkmark' },
  { id: 'alat', name: 'Alat Tani', icon: 'construct' },
  { id: 'media', name: 'Media Tanam', icon: 'layers' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Bibit Tomat Cherry Premium', category: 'bibit',
    price: 25000, originalPrice: 35000,
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=300&h=300&fit=crop',
    rating: 4.8, sold: 1250, stock: 50,
    description: 'Bibit tomat cherry unggul varietas F1 dengan produktivitas tinggi. Cocok untuk dataran rendah hingga menengah. Buah berukuran kecil, manis, dan renyah. Masa panen 60-70 hari setelah tanam.',
    weight: 50, store: 'Trubus Store Jakarta',
  },
  {
    id: 'p2', name: 'Pupuk NPK Mutiara 16-16-16', category: 'pupuk',
    price: 85000, originalPrice: 95000,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop',
    rating: 4.9, sold: 3420, stock: 200,
    description: 'Pupuk NPK Mutiara dengan komposisi seimbang 16-16-16. Cocok untuk semua jenis tanaman. Meningkatkan pertumbuhan vegetatif dan generatif tanaman. Kemasan 5 kg.',
    weight: 5000, store: 'Trubus Store Bandung',
  },
  {
    id: 'p3', name: 'Pestisida Organik Neem Oil', category: 'pestisida',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1631209121750-a9f656d1cae2?w=300&h=300&fit=crop',
    rating: 4.6, sold: 890, stock: 150,
    description: 'Pestisida organik berbahan dasar minyak mimba (neem oil) 100% alami. Efektif mengendalikan kutu daun, ulat, dan tungau. Aman untuk tanaman sayur dan buah.',
    weight: 500, store: 'Trubus Store Surabaya',
  },
  {
    id: 'p4', name: 'Tanaman Monstera Deliciosa', category: 'tanaman',
    price: 150000, originalPrice: 200000,
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300&h=300&fit=crop',
    rating: 4.7, sold: 567, stock: 30,
    description: 'Tanaman hias Monstera Deliciosa dewasa dengan 4-5 daun berlubang indah. Tinggi tanaman 40-50cm. Cocok untuk dekorasi indoor. Termasuk pot plastik.',
    weight: 2000, store: 'Trubus Store Jakarta',
  },
  {
    id: 'p5', name: 'Bibit Cabai Rawit Domba', category: 'bibit',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=300&h=300&fit=crop',
    rating: 4.5, sold: 2100, stock: 300,
    description: 'Bibit cabai rawit varietas Domba yang terkenal sangat pedas. Produktivitas tinggi, tahan penyakit layu. Isi 100 biji per kemasan.',
    weight: 30, store: 'Trubus Store Yogyakarta',
  },
  {
    id: 'p6', name: 'Pupuk Organik Kompos Premium', category: 'pupuk',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300&h=300&fit=crop',
    rating: 4.4, sold: 1800, stock: 500,
    description: 'Pupuk kompos organik premium dari bahan alami pilihan. Memperbaiki struktur tanah, meningkatkan kesuburan dan daya serap air. Kemasan 10 kg.',
    weight: 10000, store: 'Trubus Store Bandung',
  },
  {
    id: 'p7', name: 'Fungisida Dithane M-45', category: 'pestisida',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=300&fit=crop',
    rating: 4.7, sold: 1560, stock: 120,
    description: 'Fungisida kontak untuk mengendalikan penyakit jamur pada tanaman. Efektif untuk bercak daun, busuk buah, dan embun tepung. Kemasan 500g.',
    weight: 500, store: 'Trubus Store Surabaya',
  },
  {
    id: 'p8', name: 'Tanaman Lidah Mertua', category: 'tanaman',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1593482892540-72a2c7e7e8b4?w=300&h=300&fit=crop',
    rating: 4.8, sold: 2340, stock: 80,
    description: 'Sansevieria trifasciata atau Lidah Mertua. Tanaman pembersih udara terbaik. Perawatan mudah, cocok untuk pemula. Tinggi 30-40cm termasuk pot.',
    weight: 1500, store: 'Trubus Store Jakarta',
  },
  {
    id: 'p9', name: 'Sprayer Elektrik 5 Liter', category: 'alat',
    price: 285000, originalPrice: 350000,
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=300&h=300&fit=crop',
    rating: 4.6, sold: 432, stock: 45,
    description: 'Sprayer elektrik rechargeable kapasitas 5 liter. Tekanan tinggi, semprotan halus dan merata. Baterai tahan 3-4 jam pemakaian. Cocok untuk kebun rumah.',
    weight: 1800, store: 'Trubus Store Bandung',
  },
  {
    id: 'p10', name: 'Cocopeat Media Tanam 5kg', category: 'media',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&h=300&fit=crop',
    rating: 4.5, sold: 3200, stock: 400,
    description: 'Media tanam cocopeat berkualitas dari sabut kelapa pilihan. Steril, pH netral, daya serap air tinggi. Cocok untuk semai, hidroponik, dan campuran media tanam.',
    weight: 5000, store: 'Trubus Store Yogyakarta',
  },
  {
    id: 'p11', name: 'Bibit Alpukat Mentega', category: 'bibit',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&h=300&fit=crop',
    rating: 4.8, sold: 678, stock: 25,
    description: 'Bibit alpukat mentega hasil okulasi, siap tanam. Tinggi 50-70cm. Mulai berbuah 2-3 tahun. Daging buah tebal, lembut, dan tidak berserat.',
    weight: 1000, store: 'Trubus Store Jakarta',
  },
  {
    id: 'p12', name: 'Pupuk Cair Gandasil D', category: 'pupuk',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=300&h=300&fit=crop',
    rating: 4.3, sold: 1450, stock: 250,
    description: 'Pupuk daun Gandasil D untuk fase pertumbuhan vegetatif. Mengandung unsur hara makro dan mikro lengkap. Larut sempurna dalam air. Kemasan 500g.',
    weight: 500, store: 'Trubus Store Surabaya',
  },
  {
    id: 'p13', name: 'Gunting Pangkas Profesional', category: 'alat',
    price: 125000, originalPrice: 165000,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300&h=300&fit=crop',
    rating: 4.7, sold: 890, stock: 60,
    description: 'Gunting pangkas profesional dengan bilah baja karbon tinggi. Pegangan ergonomis anti slip. Cocok untuk memangkas ranting, dahan kecil, dan tanaman hias.',
    weight: 300, store: 'Trubus Store Bandung',
  },
  {
    id: 'p14', name: 'Bibit Strawberry California', category: 'bibit',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop',
    rating: 4.6, sold: 1890, stock: 100,
    description: 'Bibit strawberry varietas California yang adaptif di dataran rendah. Buah besar, manis, dan produktif. Isi 5 bibit per paket.',
    weight: 200, store: 'Trubus Store Yogyakarta',
  },
  {
    id: 'p15', name: 'Pot Fiber Minimalis 30cm', category: 'alat',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&h=300&fit=crop',
    rating: 4.4, sold: 2100, stock: 150,
    description: 'Pot fiber cement minimalis diameter 30cm. Desain modern, ringan namun kuat. Dilengkapi lubang drainase. Cocok untuk tanaman hias indoor dan outdoor.',
    weight: 2500, store: 'Trubus Store Jakarta',
  },
  {
    id: 'p16', name: 'Herbisida Roundup 486 SL', category: 'pestisida',
    price: 72000,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&h=300&fit=crop',
    rating: 4.5, sold: 1230, stock: 90,
    description: 'Herbisida sistemik pasca tumbuh untuk mengendalikan gulma. Efektif untuk berbagai jenis rumput dan gulma berdaun lebar. Kemasan 1 liter.',
    weight: 1000, store: 'Trubus Store Surabaya',
  },
];
