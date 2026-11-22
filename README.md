# Website Sutera Koi

Website resmi Sutera Koi (suterakoi.biz.id), dikelola oleh CV Sutera Petindo Abadi.
Website statis: HTML, CSS dan JavaScript tanpa database, dijalankan dengan Nginx.

## Mengubah isi

| Yang diubah | File |
|---|---|
| Nomor WhatsApp, email, Instagram, alamat | `assets/js/config.js` |
| Daftar ikan di katalog | `data/koi.json` |
| Teks halaman | `index.html` |
| Warna dan tampilan | `assets/css/style.css` |
| Logo | `assets/img/logo-mark.svg` |

### Menambah ikan ke katalog

Tambahkan satu baris di `data/koi.json`, misalnya:

```json
{ "kode": "SK-009", "varietas": "Kohaku", "breeder": "Nama Farm", "ukuran_cm": 35, "umur": "2 sai", "gender": "Betina", "harga": "", "status": "tersedia", "foto": "assets/img/koi/sk-009.jpg" }
```

- `status`: `tersedia` atau `terjual`.
- `harga`: kosongkan untuk menampilkan "Tanyakan via WhatsApp".
- `foto`: simpan foto di `assets/img/koi/`. Bila kosong, website menampilkan ilustrasi koi sesuai varietas
  (Kohaku, Showa, Sanke, Tancho, Ogon, Asagi, Shiro Utsuri, Kujaku).
- Setelah data asli terisi, ubah `"contoh": true` menjadi `"contoh": false` supaya pemberitahuan "katalog contoh" hilang.

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
