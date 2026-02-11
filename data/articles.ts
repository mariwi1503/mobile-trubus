export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  views: number;
}

export const ARTICLE_CATEGORIES = [
  { id: 'all', name: 'Semua' },
  { id: 'tips', name: 'Tips & Trik' },
  { id: 'berita', name: 'Berita' },
  { id: 'panduan', name: 'Panduan' },
  { id: 'teknologi', name: 'Teknologi' },
  { id: 'inspirasi', name: 'Inspirasi' },
];

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'Cara Menanam Tomat di Pot untuk Pemula',
    excerpt: 'Panduan lengkap menanam tomat di pot dari persiapan media tanam hingga panen pertama.',
    content: `Menanam tomat di pot adalah salah satu cara terbaik untuk memulai berkebun di rumah. Berikut panduan lengkapnya:\n\n**1. Persiapan Pot dan Media Tanam**\nGunakan pot berdiameter minimal 30cm dengan lubang drainase. Campurkan tanah, kompos, dan sekam bakar dengan perbandingan 1:1:1.\n\n**2. Pemilihan Bibit**\nPilih bibit tomat yang berkualitas dari varietas yang sesuai dengan iklim daerah Anda. Untuk pemula, varietas cherry sangat direkomendasikan.\n\n**3. Penanaman**\nTanam bibit sedalam 2/3 batang. Tomat akan menumbuhkan akar tambahan dari batang yang terpendam.\n\n**4. Perawatan**\n- Siram 2x sehari (pagi dan sore)\n- Berikan pupuk NPK setiap 2 minggu\n- Pasang ajir/penyangga saat tanaman mulai tinggi\n- Pangkas tunas air yang tumbuh di ketiak daun\n\n**5. Panen**\nTomat siap panen 60-80 hari setelah tanam. Petik saat buah sudah berwarna merah merata.`,
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&h=400&fit=crop',
    category: 'panduan',
    author: 'Tim Redaksi Trubus',
    date: '2026-02-10',
    readTime: 5,
    views: 12500,
  },
  {
    id: 'a2',
    title: 'Teknologi Smart Farming: Revolusi Pertanian Indonesia',
    excerpt: 'Bagaimana teknologi IoT dan AI mengubah wajah pertanian di Indonesia.',
    content: `Revolusi industri 4.0 telah membawa perubahan signifikan dalam dunia pertanian Indonesia. Smart farming atau pertanian cerdas menjadi tren yang semakin berkembang.\n\n**Sensor IoT untuk Monitoring Tanaman**\nSensor kelembaban tanah, suhu, dan pH dapat dipasang di lahan untuk monitoring real-time kondisi tanaman melalui smartphone.\n\n**Drone untuk Penyemprotan**\nDrone pertanian mampu menyemprot pestisida dan pupuk cair dengan lebih efisien, menghemat waktu hingga 80% dibanding cara manual.\n\n**AI untuk Deteksi Penyakit**\nAplikasi berbasis AI dapat mengidentifikasi penyakit tanaman hanya dari foto daun, membantu petani mengambil tindakan cepat.\n\n**Manfaat Smart Farming:**\n- Efisiensi penggunaan air hingga 40%\n- Pengurangan penggunaan pestisida 30%\n- Peningkatan produktivitas 20-30%\n- Monitoring lahan dari jarak jauh`,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    category: 'teknologi',
    author: 'Dr. Wahyu Prasetyo',
    date: '2026-02-09',
    readTime: 7,
    views: 8900,
  },
  {
    id: 'a3',
    title: '5 Pupuk Organik yang Bisa Dibuat di Rumah',
    excerpt: 'Hemat biaya dengan membuat pupuk organik sendiri dari bahan-bahan di sekitar rumah.',
    content: `Membuat pupuk organik sendiri tidak hanya menghemat biaya, tapi juga membantu mengurangi sampah rumah tangga.\n\n**1. Kompos dari Sampah Dapur**\nKumpulkan sisa sayuran, kulit buah, dan ampas kopi. Campurkan dengan tanah dan daun kering.\n\n**2. Pupuk Cair dari Kulit Pisang**\nRendam kulit pisang dalam air selama 2-3 hari. Air rendaman kaya akan kalium yang baik untuk pembungaan.\n\n**3. Pupuk dari Cangkang Telur**\nKeringkan dan haluskan cangkang telur. Taburkan di sekitar tanaman sebagai sumber kalsium.\n\n**4. Pupuk Hijau dari Daun**\nCacah daun-daun hijau segar dan benamkan ke dalam tanah sebagai sumber nitrogen.\n\n**5. Kompos Cacing (Vermikompos)**\nGunakan cacing tanah untuk mengolah sampah organik menjadi kompos berkualitas tinggi.`,
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&h=400&fit=crop',
    category: 'tips',
    author: 'Ir. Hendra Kusuma',
    date: '2026-02-08',
    readTime: 4,
    views: 15200,
  },
  {
    id: 'a4',
    title: 'Petani Milenial: Kisah Sukses Bertani Hidroponik',
    excerpt: 'Kisah inspiratif anak muda yang sukses membangun bisnis hidroponik beromzet ratusan juta.',
    content: `Andi (28) membuktikan bahwa bertani bisa menjadi profesi yang menjanjikan bagi generasi muda. Berawal dari hobi berkebun di balkon apartemen, kini ia mengelola greenhouse hidroponik seluas 2000m2.\n\n**Awal Mula**\nSemua bermula dari 10 pipa PVC NFT di balkon apartemennya. Hasil panen selada dan bayam dijual ke tetangga dan teman kantor.\n\n**Perkembangan Bisnis**\nDalam 2 tahun, Andi berhasil mengembangkan bisnisnya:\n- Tahun 1: Omzet Rp 5 juta/bulan\n- Tahun 2: Omzet Rp 50 juta/bulan\n- Tahun 3: Omzet Rp 200 juta/bulan\n\n**Kunci Sukses:**\n1. Konsistensi dalam kualitas produk\n2. Pemasaran melalui media sosial\n3. Kerjasama dengan restoran dan hotel\n4. Terus belajar dan berinovasi`,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop',
    category: 'inspirasi',
    author: 'Tim Redaksi Trubus',
    date: '2026-02-07',
    readTime: 6,
    views: 20100,
  },
  {
    id: 'a5',
    title: 'Mengenal Hama Utama Tanaman Cabai dan Cara Mengatasinya',
    excerpt: 'Identifikasi dan pengendalian hama yang sering menyerang tanaman cabai.',
    content: `Tanaman cabai rentan terhadap berbagai serangan hama. Berikut hama utama dan cara mengatasinya:\n\n**1. Kutu Daun (Aphids)**\nCiri: Koloni kecil berwarna hijau/hitam di bawah daun.\nPengendalian: Semprotkan larutan sabun atau neem oil.\n\n**2. Thrips**\nCiri: Daun menggulung dan berwarna keperakan.\nPengendalian: Gunakan sticky trap kuning dan insektisida sistemik.\n\n**3. Lalat Buah**\nCiri: Buah busuk dan berlubang kecil.\nPengendalian: Pasang perangkap metil eugenol.\n\n**4. Tungau (Mites)**\nCiri: Bintik kuning pada daun, jaring halus.\nPengendalian: Semprotkan akarisida atau minyak hortikultura.\n\n**Pencegahan Terpadu:**\n- Rotasi tanaman\n- Sanitasi kebun\n- Tanam refugia (bunga pengundang predator)\n- Monitoring rutin`,
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&h=400&fit=crop',
    category: 'panduan',
    author: 'Dr. Ir. Bambang Suryadi',
    date: '2026-02-06',
    readTime: 8,
    views: 11300,
  },
  {
    id: 'a6',
    title: 'Pemerintah Luncurkan Program Subsidi Pupuk 2026',
    excerpt: 'Program subsidi pupuk baru menjangkau lebih banyak petani kecil di seluruh Indonesia.',
    content: `Kementerian Pertanian resmi meluncurkan program subsidi pupuk tahun 2026 dengan cakupan yang lebih luas.\n\n**Highlights Program:**\n- Anggaran meningkat 25% dari tahun sebelumnya\n- Mencakup 30 juta petani di seluruh Indonesia\n- Jenis pupuk: Urea, NPK, dan Organik\n- Distribusi melalui aplikasi digital\n\n**Cara Mendaftar:**\n1. Daftar di aplikasi SiPetani\n2. Upload KTP dan kartu tani\n3. Verifikasi data lahan\n4. Dapatkan e-voucher pupuk\n\nProgram ini diharapkan dapat meningkatkan produktivitas pertanian nasional dan menekan biaya produksi petani.`,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
    category: 'berita',
    author: 'Tim Redaksi Trubus',
    date: '2026-02-05',
    readTime: 3,
    views: 25600,
  },
  {
    id: 'a7',
    title: 'Panduan Lengkap Berkebun Hidroponik di Rumah',
    excerpt: 'Mulai kebun hidroponik Anda dengan panduan step-by-step ini.',
    content: `Hidroponik adalah metode bercocok tanam tanpa tanah yang semakin populer untuk berkebun di rumah.\n\n**Sistem Hidroponik untuk Pemula:**\n\n**1. Wick System (Sistem Sumbu)**\nPaling sederhana, cocok untuk pemula. Nutrisi diserap melalui sumbu kain.\n\n**2. DFT (Deep Flow Technique)**\nAir nutrisi menggenang di talang. Cocok untuk selada dan sayuran daun.\n\n**3. NFT (Nutrient Film Technique)**\nAir nutrisi mengalir tipis di pipa. Paling populer untuk skala rumahan.\n\n**Kebutuhan Dasar:**\n- Pipa PVC atau talang\n- Pompa air\n- Nutrisi AB Mix\n- Net pot dan rockwool\n- pH meter dan TDS meter\n\n**Tips Sukses:**\n- Jaga pH larutan 5.5-6.5\n- Ganti nutrisi setiap 1-2 minggu\n- Pastikan aerasi cukup\n- Pilih lokasi dengan cahaya 6-8 jam/hari`,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=400&fit=crop',
    category: 'panduan',
    author: 'Dr. Rina Wulandari',
    date: '2026-02-04',
    readTime: 10,
    views: 18700,
  },
  {
    id: 'a8',
    title: 'Tren Tanaman Hias 2026: Apa yang Sedang Populer?',
    excerpt: 'Daftar tanaman hias yang sedang tren dan tips merawatnya.',
    content: `Dunia tanaman hias terus berkembang. Berikut tren tanaman hias 2026:\n\n**1. Philodendron Variegata**\nTanaman dengan daun belang putih-hijau yang eksotis. Harga masih premium tapi mulai terjangkau.\n\n**2. Anthurium Crystallinum**\nDaun berbentuk hati dengan urat daun perak yang memukau. Cocok untuk indoor.\n\n**3. Alocasia Dragon Scale**\nDaun bertekstur seperti sisik naga. Unik dan eye-catching.\n\n**4. Calathea White Fusion**\nDaun berwarna putih, hijau, dan ungu. Cantik tapi butuh perawatan ekstra.\n\n**5. Hoya Kerrii Variegata**\nTanaman berbentuk hati dengan variegasi kuning. Perawatan mudah.\n\n**Tips Merawat Tanaman Hias:**\n- Hindari sinar matahari langsung\n- Siram saat media tanam mulai kering\n- Berikan pupuk daun 2x sebulan\n- Jaga kelembaban udara 60-80%`,
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=400&fit=crop',
    category: 'tips',
    author: 'Ir. Maya Putri',
    date: '2026-02-03',
    readTime: 5,
    views: 14200,
  },
];
