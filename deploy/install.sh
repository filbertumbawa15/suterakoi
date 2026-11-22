#!/usr/bin/env bash
# Pasang website Sutera Koi di VPS Ubuntu 24.04 (Nginx + HTTPS Let's Encrypt).
#
# Cara pakai (sebagai root atau dengan sudo):
#   curl -fsSL https://raw.githubusercontent.com/filbertumbawa15/suterakoi/main/deploy/install.sh -o install.sh
#   sudo bash install.sh
#
# Repo private? Jalankan dengan deploy key:
#   sudo USE_SSH=1 bash install.sh
#
# Aman dijalankan ulang: kalau sudah terpasang, script hanya memperbarui file dan konfigurasi.
set -euo pipefail

DOMAIN="${DOMAIN:-suterakoi.biz.id}"
REPO_PATH="${REPO_PATH:-filbertumbawa15/suterakoi}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/suterakoi}"
CERT_EMAIL="${CERT_EMAIL:-hrd@suterakoi.biz.id}"
USE_SSH="${USE_SSH:-0}"

KEY_FILE="/root/.ssh/suterakoi_deploy"
SSH_HOST_ALIAS="github-suterakoi"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Jalankan dengan sudo: sudo bash install.sh"
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || warn "Script ini dibuat untuk Ubuntu 24.04. Sistem Anda: ${PRETTY_NAME:-tidak diketahui}."

say "Memasang paket: nginx, git, certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx git certbot python3-certbot-nginx curl ca-certificates

# ---------- Akses repo ----------
if [ "$USE_SSH" = "1" ]; then
  say "Menyiapkan deploy key untuk repo private"
  mkdir -p /root/.ssh && chmod 700 /root/.ssh
  if [ ! -f "$KEY_FILE" ]; then
    ssh-keygen -t ed25519 -N "" -C "deploy@${DOMAIN}" -f "$KEY_FILE" >/dev/null
  fi
  touch /root/.ssh/config
  if ! grep -q "Host ${SSH_HOST_ALIAS}" /root/.ssh/config; then
    cat >> /root/.ssh/config <<EOF

Host ${SSH_HOST_ALIAS}
  HostName github.com
  User git
  IdentityFile ${KEY_FILE}
  IdentitiesOnly yes
EOF
  fi
  chmod 600 /root/.ssh/config
  ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
  sort -u -o /root/.ssh/known_hosts /root/.ssh/known_hosts

  REPO_URL="git@${SSH_HOST_ALIAS}:${REPO_PATH}.git"
  if ! ssh -o BatchMode=yes -T "git@${SSH_HOST_ALIAS}" 2>&1 | grep -q "successfully authenticated"; then
    echo
    echo "Tambahkan public key di bawah ini ke GitHub:"
    echo "  https://github.com/${REPO_PATH}/settings/keys  ->  Add deploy key"
    echo "  Title: VPS ${DOMAIN}   (biarkan 'Allow write access' TIDAK dicentang)"
    echo
    cat "${KEY_FILE}.pub"
    echo
    read -r -p "Tekan Enter setelah deploy key ditambahkan... " _
    ssh -o BatchMode=yes -T "git@${SSH_HOST_ALIAS}" 2>&1 | grep -q "successfully authenticated" \
      || die "GitHub belum menerima deploy key. Periksa lagi lalu jalankan ulang script."
  fi
else
  REPO_URL="https://github.com/${REPO_PATH}.git"
fi

# ---------- Ambil kode ----------
if [ -d "$APP_DIR/.git" ]; then
  say "Memperbarui kode di $APP_DIR"
  git -C "$APP_DIR" remote set-url origin "$REPO_URL"
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  say "Mengambil kode dari GitHub ke $APP_DIR"
  [ -e "$APP_DIR" ] && die "$APP_DIR sudah ada tapi bukan repo git. Pindahkan atau hapus dulu folder itu."
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR" \
    || die "Gagal clone. Kalau repo sudah private, jalankan ulang dengan: sudo USE_SSH=1 bash install.sh"
fi
chmod -R a+rX "$APP_DIR"

# ---------- Nginx ----------
say "Menulis konfigurasi Nginx"
SITE_CONF="/etc/nginx/sites-available/${DOMAIN}"
cat > "$SITE_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    root ${APP_DIR};
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    # Jangan tampilkan file internal (git, script deploy, catatan)
    location ~ /\\.(?!well-known) { deny all; return 404; }
    location ^~ /deploy/     { deny all; return 404; }
    location ~* \\.(md|sh)\$ { deny all; return 404; }

    location = /index.html   { expires -1; }
    location ^~ /data/       { expires -1; }
    location ^~ /assets/     { expires 7d; }

    location / {
        try_files \$uri \$uri/ =404;
    }

    error_page 404 /404.html;
}
EOF
ln -sf "$SITE_CONF" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# ---------- Firewall ----------
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  say "Membuka port 80 dan 443 di UFW"
  ufw allow 'Nginx Full' >/dev/null
fi

# ---------- HTTPS ----------
say "Memeriksa DNS ${DOMAIN}"
SERVER_IP="$(curl -4 -fsS --max-time 10 https://api.ipify.org || true)"
DOMAIN_IP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
WWW_IP="$(getent ahostsv4 "www.$DOMAIN" | awk 'NR==1{print $1}' || true)"
echo "IP server ini : ${SERVER_IP:-tidak terbaca}"
echo "IP ${DOMAIN}  : ${DOMAIN_IP:-tidak ada}"
echo "IP www        : ${WWW_IP:-tidak ada}"

if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" = "$DOMAIN_IP" ] && [ "$SERVER_IP" = "$WWW_IP" ]; then
  say "Memasang sertifikat HTTPS (Let's Encrypt)"
  certbot --nginx --non-interactive --agree-tos --redirect \
    -m "$CERT_EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" \
    || warn "Certbot gagal. Pastikan port 80 dan 443 terbuka di firewall/security group penyedia VPS, lalu jalankan ulang script."
else
  warn "DNS belum mengarah ke server ini, jadi HTTPS dilewati. Pastikan record A '@' dan 'www' berisi ${SERVER_IP:-IP VPS}, tunggu beberapa menit, lalu jalankan ulang script."
fi

# ---------- Perintah update ----------
say "Memasang perintah update: suterakoi-update"
cat > /usr/local/bin/suterakoi-update <<EOF
#!/usr/bin/env bash
# Ambil versi terbaru website dari GitHub.
set -euo pipefail
git -C "${APP_DIR}" fetch --depth 1 origin "${BRANCH}"
git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
chmod -R a+rX "${APP_DIR}"
echo "Website diperbarui ke commit \$(git -C "${APP_DIR}" rev-parse --short HEAD)."
EOF
chmod +x /usr/local/bin/suterakoi-update

say "Selesai."
echo "Buka: http://${DOMAIN}  (atau https:// bila sertifikat berhasil dipasang)"
echo "Untuk update website setelah ada perubahan di GitHub, jalankan: sudo suterakoi-update"
