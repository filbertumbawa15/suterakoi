# Website Sutera Koi

Website resmi Sutera Koi (suterakoi.biz.id), dikelola oleh CV Sutera Petindo Abadi.
Website statis: HTML, CSS dan JavaScript tanpa database, dijalankan dengan Nginx.

Halaman: Beranda, Katalog, Lelang, Layanan, Tentang dan Kontak. Menu dan footer ada di setiap file halaman, jadi kalau menambah halaman baru, tambahkan juga tautannya di semua halaman.

## Mengubah isi

| Yang diubah | File |
|---|---|
| Nomor WhatsApp, email, Instagram, alamat, jadwal lelang | `assets/js/config.js` |
| Daftar ikan di katalog | `data/koi.json` |
| Teks halaman | `index.html`, `katalog.html`, `lelang.html`, `layanan.html`, `tentang.html`, `kontak.html` |
| Warna dan tampilan | `assets/css/style.css` |
| Logo | `assets/img/logo-mark.svg` |

### Menambah ikan ke katalog

Tambahkan satu baris di `data/koi.json`, misalnya:

```json
{ "kode": "SK-009", "varietas": "Kohaku", "breeder": "Nama Farm", "ukuran_cm": 35, "umur": "2 sai", "gender": "Betina", "harga": "", "status": "tersedia", "foto": "assets/img/koi/sk-009.jpg" }
```

- `status`: `tersedia` atau `terjual`.
- `label`: `hot`, `baru` atau kosong.
- `unggulan`: `true` untuk satu ikan yang tampil besar di bagian "Pilihan minggu ini".
- `harga`: kosongkan untuk menampilkan "Tanyakan via WhatsApp".
- `foto`: simpan foto di `assets/img/koi/`. Bila kosong, website menampilkan ilustrasi koi sesuai varietas
  (Kohaku, Showa, Sanke, Tancho, Ogon, Asagi, Shiro Utsuri, Kujaku).
- Setelah data asli terisi, ubah `"contoh": true` menjadi `"contoh": false` supaya pemberitahuan "katalog contoh" hilang.

### Jadwal lelang

Isi `lelang.mulai` di `assets/js/config.js`, misalnya `"2026-12-06T19:00:00+07:00"`. Hitung mundur muncul otomatis. Isi `lelang.link` dengan halaman lelangnya, atau kosongkan untuk mengarah ke Instagram.

## Pasang di VPS (Ubuntu 24.04)

Pastikan record DNS **A** untuk `@` dan `www` sudah berisi IP VPS, lalu di VPS jalankan:

```bash
curl -fsSL https://raw.githubusercontent.com/filbertumbawa15/suterakoi/main/deploy/install.sh -o install.sh
sudo bash install.sh
```

Script memasang Nginx, mengambil kode dari GitHub ke `/var/www/suterakoi`, dan memasang HTTPS gratis (Let's Encrypt).
Aman dijalankan ulang.

### Repo private

Jalankan dengan deploy key (tanpa token):

```bash
sudo USE_SSH=1 bash install.sh
```

Script akan menampilkan public key. Tempel di GitHub: **Settings → Deploy keys → Add deploy key** (tanpa write access), lalu tekan Enter.
Karena repo private tidak bisa diunduh lewat `curl` tanpa login, salin `deploy/install.sh` ke VPS secara manual.

## Update website

Setelah perubahan di-push ke GitHub, jalankan di VPS:

```bash
sudo suterakoi-update
```
