export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Pesanan',
    question: 'Bagaimana cara melacak status pesanan saya?',
    answer: 'Buka menu Pesanan Saya pada halaman profil, lalu pilih pesanan yang ingin dicek. Anda bisa melihat status seperti belum bayar, diproses, atau dikirim secara real-time.',
  },
  {
    id: 'faq-2',
    category: 'Pesanan',
    question: 'Apa yang harus dilakukan jika pembayaran sudah berhasil tetapi status belum berubah?',
    answer: 'Tunggu beberapa menit agar sistem memverifikasi pembayaran secara otomatis. Jika setelah 10 menit status belum berubah, hubungi tim bantuan melalui Pusat Bantuan atau Customer Service.',
  },
  {
    id: 'faq-3',
    category: 'Konsultasi',
    question: 'Bagaimana cara memesan sesi konsultasi dengan ahli?',
    answer: 'Masuk ke tab Konsultasi, pilih ahli yang tersedia, lalu tentukan jadwal dan lanjutkan ke pembayaran. Setelah pembayaran berhasil, sesi akan muncul di riwayat konsultasi Anda.',
  },
  {
    id: 'faq-4',
    category: 'Konsultasi',
    question: 'Apakah saya bisa mengubah jadwal konsultasi?',
    answer: 'Untuk saat ini perubahan jadwal dilakukan melalui bantuan admin. Silakan hubungi Customer Service dengan menyertakan nama ahli, tanggal, dan jam konsultasi yang ingin diubah.',
  },
  {
    id: 'faq-5',
    category: 'Akun',
    question: 'Bagaimana cara mengganti alamat pengiriman utama?',
    answer: 'Buka menu Alamat Pengiriman di profil, lalu pilih alamat yang ingin dijadikan utama. Pastikan data penerima, nomor telepon, dan detail lokasi sudah benar.',
  },
  {
    id: 'faq-6',
    category: 'Akun',
    question: 'Apakah saya bisa menggunakan satu akun di lebih dari satu perangkat?',
    answer: 'Bisa, tetapi kami menyarankan hanya login di perangkat pribadi agar notifikasi, keamanan, dan riwayat aktivitas tetap terjaga dengan baik.',
  },
  {
    id: 'faq-7',
    category: 'Promo & Coin',
    question: 'Bagaimana cara mendapatkan Trubus Coin?',
    answer: 'Trubus Coin bisa diperoleh dari transaksi tertentu, promo musiman, atau program loyalitas. Pantau banner promo dan halaman membership untuk informasi terbaru.',
  },
  {
    id: 'faq-8',
    category: 'Promo & Coin',
    question: 'Apakah Trubus Coin bisa diuangkan?',
    answer: 'Tidak. Trubus Coin digunakan untuk penukaran hadiah, promo tertentu, atau benefit khusus di dalam aplikasi sesuai syarat program yang sedang berjalan.',
  },
];
