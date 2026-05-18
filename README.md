# EduPath Rombel Planner

EduPath Rombel Planner adalah aplikasi fullstack untuk membantu sekolah menentukan rombel kelas XI/XII berdasarkan pilihan mata pelajaran siswa kelas X. MVP ini memakai rule-based recommendation engine, JSON file storage, dan autentikasi role-based sederhana.

Role aplikasi:

- `superadmin`: bisa melihat dan mengubah semua data, import Excel, generate rekomendasi, review/place, dan export.
- `viewer`: hanya bisa melihat data dan export, tidak bisa mengubah data.

Data disimpan dalam file JSON agar mudah dipahami dan mudah dimigrasikan ke PostgreSQL pada tahap berikutnya.

## Tech Stack

Backend:

- Python
- FastAPI
- Pydantic
- Uvicorn
- JSON file storage
- OpenPyXL untuk export Excel

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

## Struktur Project

```text
edupath-rombel-planner/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── storage.py
│   │   ├── scoring.py
│   │   ├── export_excel.py
│   │   ├── data/
│   │   │   ├── students.json
│   │   │   ├── rombels.json
│   │   │   ├── subjects.json
│   │   │   └── recommendations.json
│   │   └── routers/
│   │       ├── students.py
│   │       ├── rombels.py
│   │       ├── subjects.py
│   │       ├── recommendations.py
│   │       └── dashboard.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   ├── package.json
│   ├── .env.example
│   └── README.md
└── README.md
```

## Setup Backend

```bash
cd edupath-rombel-planner/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Jalankan backend:

```bash
uvicorn app.main:app --reload
```

Backend berjalan di:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```http
GET /health
```

Response:

```json
{
  "status": "OK"
}
```

## Setup Frontend

```bash
cd edupath-rombel-planner/frontend
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend berjalan di URL yang ditampilkan Vite, biasanya:

```text
http://127.0.0.1:5173
```

Default API URL frontend:

```text
http://127.0.0.1:8000
```

Untuk mengganti API URL, buat file `.env` di folder `frontend`:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Template tersedia di `frontend/.env.example`.

## Cara Menjalankan Aplikasi

Terminal 1:

```bash
cd edupath-rombel-planner/backend
uvicorn app.main:app --reload
```

Terminal 2:

```bash
cd edupath-rombel-planner/frontend
npm run dev
```

Buka frontend:

```text
http://127.0.0.1:5173
```

Jika backend aktif, sidebar frontend akan menampilkan status `Backend Online`.

## Storage JSON

Backend menyimpan data di:

- `backend/app/data/students.json`
- `backend/app/data/rombels.json`
- `backend/app/data/subjects.json`
- `backend/app/data/recommendations.json`

Jika file JSON belum ada, backend akan membuat file kosong otomatis melalui helper `read_json` dan `write_json` di `storage.py`.

## Endpoint Backend

Health:

- `GET /health`

Auth:

- `POST /auth/login`
- `GET /auth/me`

Students:

- `GET /students`
- `GET /students/{student_id}`
- `POST /students`
- `POST /students/import-excel`
- `PUT /students/{student_id}`
- `DELETE /students/{student_id}`

Rombels:

- `GET /rombels`
- `GET /rombels/{rombel_id}`
- `POST /rombels`
- `PUT /rombels/{rombel_id}`
- `DELETE /rombels/{rombel_id}`

Subjects:

- `GET /subjects`
- `GET /subjects/{subject_id}`
- `POST /subjects`
- `PUT /subjects/{subject_id}`
- `DELETE /subjects/{subject_id}`

Recommendations:

- `POST /recommendations/generate`
- `GET /recommendations`
- `GET /recommendations/{recommendation_id}`
- `PATCH /recommendations/{recommendation_id}/override`
- `DELETE /recommendations/clear`

Dashboard:

- `GET /dashboard/summary`

Export:

- `GET /export/recommendations.xlsx`
- `GET /export/recommendations.xlsx?status=Need%20Review&placement=unplaced`

## Halaman Frontend

- `/` Dashboard
- `/students` Students
- `/students/new` Add Student
- `/students/:id/edit` Edit Student
- `/rombels` Rombels
- `/subjects` Subjects
- `/recommendations` Recommendations

## Contoh Request Tambah Siswa

```http
POST /students
Content-Type: application/json
```

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

## Flow Penggunaan MVP

1. Jalankan backend.
2. Jalankan frontend.
3. Buka halaman Dashboard dan pastikan sidebar menampilkan `Backend Online`.
4. Tambahkan siswa melalui menu Add Student atau import Excel melalui halaman Students.
5. Lihat data siswa di halaman Students.
6. Lihat konfigurasi rombel di halaman Rombels.
7. Lihat data mapel di halaman Subjects.
8. Buka Recommendations.
9. Klik `Generate Recommendation`.
10. Review hasil rekomendasi, status, skor, dan catatan.
11. Jika perlu, klik `Review / Place` untuk menentukan final rombel secara manual.
12. Klik `Export Excel` untuk mengunduh hasil rekomendasi. Export mengikuti filter status dan placement yang aktif.

## Import Excel Google Form

Aplikasi mendukung import file Excel hasil Google Form seperti `Angket Riasek Minat Program Study (Responses)(AutoRecovered).xlsx`.

Import dari frontend:

1. Buka halaman `Students`.
2. Klik `Import Excel`.
3. Pilih file `.xlsx`.
4. Sistem membaca sheet `2026`.
5. Data lama siswa diganti dengan data import baru.
6. Rekomendasi lama dikosongkan dan `filled` rombel direset.

Import dari backend CLI:

```bash
cd edupath-rombel-planner/backend
.venv\Scripts\python.exe import_students_excel.py "C:\Users\User\Downloads\Angket Riasek Minat Program Study (Responses)(AutoRecovered).xlsx" --sheet 2026
```

Mapping kolom Excel ke model aplikasi:

- `No..` -> `nis`
- `Nama Lengkap ` -> `name`
- `Kelas` -> `originClass`
- `Apa profesi yang kamu cita-citakan?...` -> `careerGoal`
- `Apa Kira-kira yang akan kamu rencanakan setelah lulus SMA...` -> `targetMajor`
- `Mata Pelajaran Pilihan 1` -> `prioritySubject1`
- `Mata Pelajaran Pilihan 2` -> `prioritySubject2`
- `Mata Pelajaran Pilihan 3` -> `backupSubject`
- `Mata Pelajaran Pilihan 1` -> `strongestSubject`
- Pilihan mapel 4 dan 5 disimpan di `reason`

Normalisasi nama mapel:

- `FISIKA` -> `Fisika`
- `KIMIA` -> `Kimia`
- `BIOLOGI` -> `Biologi`
- `SOSIOLOGI` -> `Sosiologi`
- `EKONOMI` -> `Ekonomi`
- `GEOGRAFI` -> `Geografi`
- `MATEMATIKA TL` -> `Matematika Tindak Lanjut`
- `BAHASA INGGRIS` -> `Bahasa Inggris Tindak Lanjut`
- `BAHASA ARAB` -> `Bahasa Arab`

Catatan: file Excel yang diuji memiliki 291 siswa valid dari sheet `2026`. Satu baris dilewati karena tidak memiliki pilihan mapel valid.

## Rule Scoring

Sistem menghitung skor siswa terhadap semua kelompok rombel.

Bobot scoring:

- Mapel prioritas 1 cocok dengan mapel kelompok rombel: `+40`
- Mapel prioritas 2 cocok dengan mapel kelompok rombel: `+25`
- Mapel cadangan cocok dengan mapel kelompok rombel: `+10`
- Cita-cita linear dengan kelompok rombel: `+20`
- Mapel paling dikuasai cocok dengan mapel kelompok rombel: `+5`

Total maksimal skor adalah `100`.

Contoh:

- Cita-cita: `Dokter`
- Priority Subject 1: `Biologi`
- Priority Subject 2: `Kimia`
- Backup Subject: `Bahasa Inggris Tindak Lanjut`
- Strongest Subject: `Biologi`

Skor untuk `Healthy & Medicine` menjadi `100` karena:

- Biologi cocok: `+40`
- Kimia cocok: `+25`
- Bahasa Inggris Tindak Lanjut cocok: `+10`
- Dokter linear: `+20`
- Biologi sebagai strongest subject cocok: `+5`

## Rule Penentuan Rombel Saat Generate

1. Sistem menghitung skor siswa terhadap semua kelompok.
2. Sistem mengurutkan kelompok berdasarkan skor tertinggi.
3. Kelompok skor tertinggi menjadi `recommendedGroup`.
4. Sistem mencari rombel aktif dalam kelompok tersebut.
5. Sistem memilih rombel dengan `filled` paling rendah.
6. Jika `filled` sama, sistem memilih berdasarkan urutan alfabet nama rombel.
7. Saat generate otomatis, sistem tidak menempatkan siswa ke rombel yang sudah penuh.
8. Jika rombel dalam kelompok utama penuh, sistem mencari kelompok skor berikutnya.
9. Alternatif hanya dipilih jika skor alternatif minimal `50`.
10. Jika tidak ada alternatif dengan skor minimal `50`, status menjadi `Need Review`.
11. Jika semua rombel penuh saat generate, status menjadi `Quota Full`.
12. Jika skor tertinggi kurang dari `50`, status menjadi `Need Review`.

Catatan: batas kapasitas saat generate otomatis berbeda dengan review manual. Saat admin melakukan `Review / Place`, admin boleh memilih rombel yang sudah penuh. Backend akan menaikkan kapasitas rombel tersebut agar placement tetap tersimpan.

## Rule Balancing

- Kapasitas default setiap rombel adalah `35` siswa.
- Total rombel default adalah `8` rombel: A, B, C, D, E, F, G, H.
- Tidak ada batas total kapasitas global. Kapasitas setiap rombel dapat naik ketika admin melakukan placement manual.
- Jika lebih dari satu rombel dalam kelompok yang sama, sistem memilih rombel dengan `filled` paling rendah.
- Jika `filled` sama, sistem memilih berdasarkan urutan alfabet.
- Saat generate otomatis, sistem tidak menambahkan siswa ke rombel yang sudah penuh.
- Saat admin melakukan review manual, kapasitas rombel dapat naik otomatis jika `filled` melebihi `capacity`.
- Setelah generate recommendation, `filled` setiap rombel dihitung ulang dari `finalRombel` rekomendasi, bukan dari angka lama.

## Alur Review / Place Manual

Gunakan alur ini untuk siswa `Need Review` atau `Belum Ditempatkan`.

1. Buka halaman `Recommendations`.
2. Klik quick filter `Need Review` atau `Belum Ditempatkan`.
3. Cari siswa menggunakan search jika diperlukan.
4. Klik tombol `Review / Place` pada baris siswa.
5. Modal review akan menampilkan skor setiap kelompok rombel.
6. Modal juga menampilkan rekomendasi sistem, rombel alternatif, status, dan catatan review.
7. Pilih `Final Rombel`.
8. Perhatikan `Rombel Capacity Helper`.
9. Jika rombel sudah penuh, helper akan memberi tahu bahwa kapasitas akan naik setelah disimpan.
10. Isi `Review Notes` dengan alasan penempatan.
11. Klik `Save Placement`.
12. Status siswa berubah menjadi `Manually Overridden`.
13. `finalRombel` dan `finalGroup` menjadi hasil akhir yang dipakai dashboard dan export.

Contoh catatan review:

- `Ditempatkan ke C karena minat teknik dan pilihan Fisika/Matematika TL masih relevan.`
- `Validasi BK: cita-cita belum linear, tetapi siswa memilih jalur Engineering.`
- `Ditempatkan manual untuk pemerataan rombel berdasarkan keputusan admin.`

## Rombel Capacity Helper

Saat admin memilih rombel di modal review, sistem menampilkan informasi:

- Rombel
- Group
- Filled
- Capacity
- Sisa saat ini
- Status setelah save
- Daftar mapel rombel

Jika `filled` sudah sama dengan `capacity`, helper akan menampilkan pesan seperti:

```text
Capacity naik ke 36
```

Artinya ketika admin menyimpan placement, backend akan menaikkan kapasitas rombel tersebut agar data tetap konsisten.

## Status Recommendation

- `Recommended`
- `Need Review`
- `Quota Full`
- `Not Linear`
- `Manually Overridden`

Catatan review otomatis:

- Jika cita-cita tidak linear dengan kelompok skor tertinggi, sistem menambahkan catatan `Cita-cita tidak sepenuhnya linear, perlu validasi BK.`.
- Jika skor tertinggi dan kedua memiliki selisih kurang dari atau sama dengan `10`, sistem menambahkan catatan `Skor antar kelompok berdekatan, perlu review manual.`.

## Override Manual

Admin bisa mengubah hasil akhir rekomendasi melalui halaman Recommendations.

Field override:

- `finalRombel`
- `finalGroup`
- `reviewNotes`
- `isOverridden`

Saat override atau `Review / Place`:

- `isOverridden` menjadi `true`
- `status` menjadi `Manually Overridden`
- `finalRombel` dipakai sebagai hasil akhir
- `recommendedRombel` tetap disimpan sebagai rekomendasi awal sistem
- `filled` rombel dihitung ulang
- Jika kapasitas rombel terlampaui, backend menaikkan kapasitas rombel tersebut secara otomatis

Contoh request:

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

## Dashboard Summary

Endpoint `GET /dashboard/summary` mengembalikan:

- `totalStudents`
- `totalPlaced`
- `totalUnplaced`
- `totalNeedReview`
- `totalQuotaFull`
- `totalOverridden`
- `rombelDistribution`
- `groupDistribution`
- `subjectDemand`
- `remainingCapacityByRombel`

## Export Excel

Hasil rekomendasi bisa diexport melalui:

```http
GET /export/recommendations.xlsx
```

Di frontend, tombol tersedia di halaman Recommendations dengan label `Export Excel`.

Export mengikuti filter aktif di halaman `Recommendations`.

Contoh export semua rekomendasi:

```http
GET /export/recommendations.xlsx
```

Contoh export siswa `Need Review` yang belum ditempatkan:

```http
GET /export/recommendations.xlsx?status=Need%20Review&placement=unplaced
```

Nilai `placement` yang tersedia:

- `all`
- `placed`
- `unplaced`

## Verifikasi Build

Backend compile check:

```bash
cd edupath-rombel-planner/backend
python -m compileall app
```

Frontend build check:

```bash
cd edupath-rombel-planner/frontend
npm run build
```

## Catatan MVP

- Belum memakai database.
- Belum memakai authentication.
- Belum memakai AI/LLM.
- Recommendation engine masih rule-based.
- Storage JSON cocok untuk MVP dan testing awal, tetapi untuk penggunaan produksi sebaiknya dimigrasikan ke PostgreSQL.
