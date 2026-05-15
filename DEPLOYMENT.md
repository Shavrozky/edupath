# Deployment Guide

Panduan ini menyiapkan EduPath Rombel Planner di Ubuntu server menggunakan Docker Compose. Mode awal memakai IP server lewat HTTP. Saat domain sudah siap, Caddyfile bisa diganti ke mode domain agar HTTPS aktif otomatis.

## Arsitektur

```text
Browser
  |
  | http://SERVER_IP
  v
Caddy container
  |-- /      -> frontend container
  |-- /api/* -> backend container
```

Service Docker:

- `backend`: FastAPI + JSON storage
- `frontend`: Nginx static React build
- `caddy`: reverse proxy

Backend tidak diekspos langsung ke internet.

## File Deployment

```text
docker-compose.yml
.env.example
backend/Dockerfile
backend/.dockerignore
frontend/Dockerfile
frontend/.dockerignore
frontend/nginx.conf
frontend/.env.production.example
```

## Persiapan Server Ubuntu

Update server:

```bash
sudo apt update
sudo apt upgrade -y
```

Install tools dasar:

```bash
sudo apt install -y ca-certificates curl gnupg ufw
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Aktifkan Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Tambahkan user ke group Docker:

```bash
sudo usermod -aG docker $USER
```

Logout lalu login ulang SSH, kemudian cek:

```bash
docker --version
docker compose version
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Upload Project ke Server

Rekomendasi lokasi project:

```text
/opt/edupath
```

Buat folder:

```bash
sudo mkdir -p /opt/edupath
sudo chown -R $USER:$USER /opt/edupath
```

Upload seluruh folder project `edupath-rombel-planner` ke `/opt/edupath`, atau clone dari Git jika sudah tersedia.

Jika hasil upload menjadi `/opt/edupath/edupath-rombel-planner`, pindahkan isinya agar `docker-compose.yml` berada langsung di `/opt/edupath`.

Struktur akhir:

```text
/opt/edupath/docker-compose.yml
/opt/edupath/backend
/opt/edupath/frontend
/opt/edupath/deploy
```

## Environment Production

Masuk ke project:

```bash
cd /opt/edupath
```

Buat `.env`:

```bash
cp .env.example .env
nano .env
```

Isi contoh:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ganti-dengan-password-kuat
JWT_SECRET_KEY=ganti-dengan-random-secret-panjang
JWT_EXPIRE_MINUTES=720
```

Generate secret sederhana:

```bash
openssl rand -hex 32
```

## Jalankan Aplikasi via IP Server

Build dan start:

```bash
docker compose up -d --build
```

Cek status:

```bash
docker compose ps
```

Cek logs:

```bash
docker compose logs -f
```

Test backend:

```bash
curl http://SERVER_IP/api/health
```

Response normal:

```json
{"status":"OK"}
```

Buka browser:

```text
http://SERVER_IP
```

Login memakai username/password dari `.env`.

## Operasi Harian

Restart aplikasi:

```bash
docker compose restart
```

Stop aplikasi:

```bash
docker compose down
```

Update setelah upload kode baru:

```bash
docker compose up -d --build
```

Lihat logs backend:

```bash
docker compose logs -f backend
```

Lihat logs Caddy:

```bash
docker compose logs -f caddy
```

## Backup JSON Data

Data penting berada di:

```text
/opt/edupath/backend/app/data
```

Jalankan backup manual:

```bash
chmod +x /opt/edupath/deploy/backup-data.sh
APP_DIR=/opt/edupath /opt/edupath/deploy/backup-data.sh
```

Backup akan tersimpan di:

```text
/opt/edupath-backups
```

Cron backup harian jam 02:00:

```bash
crontab -e
```

Tambahkan:

```text
0 2 * * * APP_DIR=/opt/edupath /opt/edupath/deploy/backup-data.sh >> /opt/edupath-backups/backup.log 2>&1
```

## Upgrade ke Domain + HTTPS

Saat domain siap, buat DNS record:

```text
Type: A
Name: edupath
Value: SERVER_IP
TTL: Auto atau 300
```

Hasil:

```text
edupath.katasurya.my.id -> SERVER_IP
```

Edit Caddyfile:

```bash
nano /opt/edupath/deploy/Caddyfile
```

Ganti isi dari mode IP:

```text
:80 {
    encode gzip

    handle_path /api/* {
        reverse_proxy backend:8000
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

Menjadi mode domain HTTPS:

```text
edupath.katasurya.my.id {
    encode gzip

    handle_path /api/* {
        reverse_proxy backend:8000
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

Restart Caddy:

```bash
docker compose restart caddy
```

Caddy akan otomatis meminta SSL Let’s Encrypt.

Test:

```bash
curl https://edupath.katasurya.my.id/api/health
```

## Checklist Setelah Deploy

- Buka `http://SERVER_IP`.
- Login berhasil.
- Dashboard load.
- Students load.
- Import Excel berhasil.
- Generate recommendation berhasil.
- Filter `Need Review` berhasil.
- `Review / Place` berhasil.
- Export Excel berhasil.
- Logout berhasil.
- Backup manual berhasil.

## Catatan Keamanan

- Mode IP memakai HTTP, belum HTTPS. Gunakan untuk testing awal.
- Jangan share IP publik jika data siswa sudah real dan sensitif.
- Gunakan password admin kuat.
- Setelah domain siap, segera ubah Caddyfile ke mode HTTPS.
- JSON storage cocok untuk MVP, tetapi untuk multi-admin/production serius sebaiknya migrasi ke PostgreSQL.
