# EduPath Rombel Planner Frontend

Frontend React + TypeScript + Vite untuk MVP EduPath Rombel Planner.

## Setup

```bash
cd edupath-rombel-planner/frontend
npm install
```

## Menjalankan Backend dan Frontend

Jalankan backend terlebih dahulu:

```bash
cd ../backend
uvicorn app.main:app --reload
```

Backend berjalan di `http://127.0.0.1:8000`.

Jalankan frontend di terminal lain:

```bash
npm run dev
```

Frontend berjalan di `http://127.0.0.1:5173` atau URL yang ditampilkan Vite.

## API URL

Default API URL adalah:

```text
http://127.0.0.1:8000
```

Jika ingin mengganti, buat file `.env`:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Template tersedia di `.env.example`.

Sidebar akan menampilkan indikator `Backend Online` jika `GET /health` berhasil.

## Login

Frontend memiliki halaman `/login`.

Alur:

1. User membuka aplikasi.
2. Jika belum login, user diarahkan ke `/login`.
3. Frontend mengirim username/password ke `POST /auth/login`.
4. Token disimpan di `localStorage`.
5. Axios otomatis mengirim `Authorization: Bearer <token>`.
6. Tombol `Logout` di sidebar menghapus token.
7. Jika backend mengembalikan `401`, frontend logout otomatis.

## Pages

- `/` Dashboard summary
- `/login` halaman login admin
- `/students` tabel siswa
- `/students/new` tambah siswa
- `/students/:id/edit` edit siswa
- `/rombels` daftar rombel
- `/subjects` daftar mapel
- `/recommendations` generate, override, dan export rekomendasi

## Alur Admin di Frontend

1. Pastikan sidebar menampilkan `Backend Online`.
2. Buka `Students` dan import Excel atau tambah siswa manual.
3. Buka `Recommendations`.
4. Klik `Generate Recommendation`.
5. Gunakan quick filter `Need Review`, `Belum Ditempatkan`, atau `Sudah Ditempatkan`.
6. Klik `Review / Place` untuk siswa yang perlu validasi admin/BK.
7. Di modal review, lihat skor kelompok, rekomendasi sistem, alternatif, dan status.
8. Pilih `Final Rombel`.
9. Lihat `Rombel Capacity Helper` untuk mengetahui filled, capacity, sisa, dan status setelah save.
10. Isi `Review Notes`.
11. Klik `Save Placement`.
12. Klik `Export Excel` jika ingin mengunduh hasil. Export mengikuti filter aktif.

## Review / Place

Modal `Review / Place` digunakan untuk memvalidasi siswa `Need Review` atau `Belum Ditempatkan`.

Informasi yang tampil:

- Nama siswa, NIS, dan kelas asal.
- Skor semua kelompok rombel.
- Recommended group dan recommended rombel dari sistem.
- Alternative rombels.
- Status dan review notes.
- Dropdown final rombel.
- Rombel capacity helper.
- Textarea review notes.

Jika admin memilih rombel yang sudah penuh, backend akan menaikkan kapasitas rombel setelah `Save Placement`.

## Build

```bash
npm run build
```

## Fitur MVP

- React Router untuk routing.
- Axios API client.
- Tailwind CSS untuk styling.
- Loading state dan error state.
- Form input/edit siswa lengkap.
- Import Excel Google Form dari halaman Students.
- Tabel siswa dengan edit/delete.
- Tabel rombel dan subject.
- Dashboard summary.
- Generate recommendation.
- Filter `Need Review`, `Belum Ditempatkan`, dan `Sudah Ditempatkan`.
- Export Excel sesuai filter aktif.
- Review / Place manual hasil rekomendasi.
- Badge warna status rekomendasi.
