import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { DataTable } from '../components/DataTable';
import type { Student } from '../types';

export function StudentsPage() {
  const { isSuperadmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [student.name, student.nis, student.originClass, student.careerGoal, student.prioritySubject1, student.prioritySubject2, student.backupSubject, student.strongestSubject]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [search, students]);

  async function loadStudents() {
    setLoading(true);
    try {
      const response = await api.get<Student[]>('/students');
      setStudents(response.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent(id: string) {
    try {
      await api.delete(`/students/${id}`);
      setDeleteTarget(null);
      await loadStudents();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function importExcel(file: File | null) {
    if (!file) return;
    setImporting(true);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<{ imported: number; totalStudents: number; warningCount: number }>(
        '/students/import-excel?sheetName=2026&replace=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setMessage(`Import berhasil: ${response.data.imported} siswa. Total data: ${response.data.totalStudents}. Warning: ${response.data.warningCount}.`);
      await loadStudents();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Students</h1>
          <p className="mt-1 text-slate-500">Data pilihan mapel siswa kelas X. Total tampil: {filteredStudents.length} dari {students.length} siswa.</p>
        </div>
        {isSuperadmin && (
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
              {importing ? 'Importing...' : 'Import Excel'}
              <input disabled={importing} type="file" accept=".xlsx" className="hidden" onChange={(event) => void importExcel(event.target.files?.[0] ?? null)} />
            </label>
            <Link className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md" to="/students/new">
              Add Student
            </Link>
          </div>
        )}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 p-4 text-emerald-700">{message}</p>}
      {loading ? (
        <p className="text-slate-500">Memuat siswa...</p>
      ) : (
        <DataTable
          data={filteredStudents}
          paginated
          searchable
          showRowNumber
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama, NIS, kelas, cita-cita, atau mapel..."
          initialPageSize={25}
          columns={[
            { key: 'name', header: 'Nama', render: (row) => row.name },
            { key: 'nis', header: 'NIS', render: (row) => row.nis },
            { key: 'originClass', header: 'Kelas Asal', render: (row) => row.originClass },
            { key: 'careerGoal', header: 'Cita-cita', render: (row) => row.careerGoal },
            { key: 'prioritySubject1', header: 'Prioritas 1', render: (row) => row.prioritySubject1 },
            { key: 'prioritySubject2', header: 'Prioritas 2', render: (row) => row.prioritySubject2 },
            { key: 'backupSubject', header: 'Cadangan', render: (row) => row.backupSubject },
            { key: 'strongestSubject', header: 'Dikuasai', render: (row) => row.strongestSubject },
            ...(isSuperadmin
              ? [
                  {
                    key: 'actions',
                    header: 'Action',
                    render: (row: Student) => (
                      <div className="flex min-w-36 flex-wrap gap-2">
                        <Link className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm" to={`/students/${row.id}/edit`}>
                          Edit
                        </Link>
                        <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-100 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm" onClick={() => setDeleteTarget(row)}>
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="animate-scale-in w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-xl font-bold text-red-600 ring-1 ring-red-100">!</div>
            <h2 className="mt-4 text-center text-xl font-bold text-slate-950">Hapus data siswa?</h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Data <span className="font-semibold text-slate-800">{deleteTarget.name}</span> akan dihapus dari daftar siswa. Tindakan ini tidak otomatis menghapus rekomendasi lama sampai generate ulang.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md" onClick={() => void deleteStudent(deleteTarget.id)}>
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
