# EduPath Rombel Planner Backend

Backend MVP untuk menentukan rekomendasi rombel kelas XI/XII berdasarkan pilihan mata pelajaran, cita-cita, kuota, dan kapasitas rombel. Storage menggunakan file JSON, tanpa database dan tanpa authentication.

## Setup

```bash
cd edupath-rombel-planner/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Menjalankan API

```bash
uvicorn app.main:app --reload
```

API berjalan di `http://127.0.0.1:8000`.

Dokumentasi Swagger tersedia di `http://127.0.0.1:8000/docs`.

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "OK"
}
```

## Admin Authentication

Backend memakai single-admin JWT auth untuk MVP.

Environment variables:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
JWT_SECRET_KEY=change-this-to-a-long-random-secret
JWT_EXPIRE_MINUTES=720
```

Endpoint publik:

- `GET /health`
- `POST /auth/login`

Endpoint lain membutuhkan bearer token:

```http
Authorization: Bearer <accessToken>
```

Login:

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "change-this-password"
}
```

## File Storage

Data disimpan di:

- `app/data/students.json`
- `app/data/rombels.json`
- `app/data/subjects.json`
- `app/data/recommendations.json`

Jika file belum ada, helper storage akan membuat file JSON kosong otomatis.

## Endpoint Utama

- `POST /auth/login`
- `GET /auth/me`
- `GET /students`
- `GET /students/{student_id}`
- `POST /students`
- `POST /students/import-excel`
- `PUT /students/{student_id}`
- `DELETE /students/{student_id}`
- `GET /rombels`
- `GET /rombels/{rombel_id}`
- `POST /rombels`
- `PUT /rombels/{rombel_id}`
- `DELETE /rombels/{rombel_id}`
- `GET /subjects`
- `GET /subjects/{subject_id}`
- `POST /subjects`
- `PUT /subjects/{subject_id}`
- `DELETE /subjects/{subject_id}`
- `POST /recommendations/generate`
- `GET /recommendations`
- `GET /recommendations/{recommendation_id}`
- `PATCH /recommendations/{recommendation_id}/override`
- `DELETE /recommendations/clear`
- `GET /dashboard/summary`
- `GET /export/recommendations.xlsx`
- `GET /export/recommendations.xlsx?status=Need%20Review&placement=unplaced`

## Contoh Request Tambah Siswa

```http
POST /students
Content-Type: application/json
```

## Import Excel Google Form

Endpoint upload:

```http
POST /students/import-excel?sheetName=2026&replace=true
Content-Type: multipart/form-data
```

Field form-data:

- `file`: file `.xlsx`

Import dari command line:

```bash
.venv\Scripts\python.exe import_students_excel.py "C:\Users\User\Downloads\Angket Riasek Minat Program Study (Responses)(AutoRecovered).xlsx" --sheet 2026
```

Import akan:

- Membaca sheet `2026`.
- Normalisasi nama mapel dari format Excel ke format aplikasi.
- Mengisi `strongestSubject` dari `Mata Pelajaran Pilihan 1`.
- Mengisi `backupSubject` dari `Mata Pelajaran Pilihan 3` jika tersedia.
- Reset `recommendations.json`.
- Reset `filled` semua rombel.

```json
{
  "name": "Andi Saputra",
  "nis": "12345",
  "originClass": "X-1",
  "careerGoal": "Dokter",
  "targetMajor": "Kedokteran",
  "prioritySubject1": "Biologi",
  "prioritySubject2": "Kimia",
  "backupSubject": "Bahasa Inggris Tindak Lanjut",
  "strongestSubject": "Biologi",
  "scores": {
    "Biologi": 90,
    "Kimia": 85,
    "Fisika": 70,
    "Matematika Tindak Lanjut": 78,
    "Ekonomi": 65,
    "Sosiologi": 75,
    "Geografi": 70,
    "Bahasa Inggris Tindak Lanjut": 80,
    "Bahasa Arab": 60
  },
  "reason": "Saya ingin menjadi dokter dan suka pelajaran Biologi."
}
```

## Scoring

Sistem menghitung skor setiap siswa terhadap semua kelompok rombel:

- Mapel prioritas 1 cocok dengan mapel kelompok: `+40`
- Mapel prioritas 2 cocok dengan mapel kelompok: `+25`
- Mapel cadangan cocok dengan mapel kelompok: `+10`
- Cita-cita linear dengan kelompok: `+20`
- Mapel paling dikuasai cocok dengan mapel kelompok: `+5`

Skor maksimal adalah `100`.

Jika skor tertinggi kurang dari `50`, status menjadi `Need Review`.

Jika cita-cita tidak linear dengan kelompok skor tertinggi, sistem menambahkan catatan `Cita-cita tidak sepenuhnya linear, perlu validasi BK.`.

Jika selisih skor tertinggi dan kedua kurang dari atau sama dengan `10`, sistem menambahkan catatan `Skor antar kelompok berdekatan, perlu review manual.`.

## Balancing Rombel

Saat generate rekomendasi:

- Sistem mengurutkan kelompok berdasarkan skor tertinggi.
- Sistem memilih rombel aktif dalam kelompok skor tertinggi.
- Jika ada beberapa rombel dalam kelompok yang sama, sistem memilih `filled` paling rendah.
- Jika `filled` sama, sistem memilih berdasarkan urutan alfabet nama rombel.
- Sistem tidak menempatkan siswa ke rombel yang sudah penuh.
- Jika kelompok utama penuh, sistem mencari kelompok skor berikutnya dengan skor minimal `50`.
- Jika tidak ada alternatif dengan skor minimal `50`, status menjadi `Need Review`.
- Jika semua rombel penuh, status menjadi `Quota Full`.
- Setelah generate, `filled` setiap rombel dihitung ulang dari `finalRombel` rekomendasi, bukan dari angka lama.

Catatan: aturan kapasitas di atas hanya berlaku untuk generate otomatis. Pada review manual admin, kapasitas rombel boleh naik otomatis jika admin menempatkan siswa ke rombel yang sudah penuh.

## Override Manual / Review Place

```http
PATCH /recommendations/{recommendation_id}/override
Content-Type: application/json
```

```json
{
  "finalRombel": "B",
  "finalGroup": "Healthy & Medicine",
  "reviewNotes": "Dipindahkan berdasarkan hasil rapat BK.",
  "isOverridden": true
}
```

Saat override, sistem akan:

- Menandai `isOverridden = true`
- Mengubah `status = Manually Overridden`
- Memakai `finalRombel` sebagai hasil akhir
- Tetap menyimpan `recommendedRombel` sebagai rekomendasi awal sistem
- Menghitung ulang `filled` rombel
- Menaikkan `capacity` rombel secara otomatis jika `filled` melebihi kapasitas saat ini

Contoh: jika rombel `H` memiliki `filled = 35` dan `capacity = 35`, lalu admin menempatkan satu siswa lagi ke `H`, backend akan menyimpan `filled = 36` dan menaikkan `capacity = 36`.

## Export Filtered Excel

Export semua rekomendasi:

```http
GET /export/recommendations.xlsx
```

Export siswa `Need Review` yang belum ditempatkan:

```http
GET /export/recommendations.xlsx?status=Need%20Review&placement=unplaced
```

Nilai `placement`:

- `all`
- `placed`
- `unplaced`
