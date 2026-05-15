import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { Subject } from '../types';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Subject[]>('/subjects')
      .then((response) => setSubjects(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-950">Subjects</h1>
        <p className="mt-1 text-slate-500">Daftar mata pelajaran, kuota rombel, dan bidang linear.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Memuat mapel...</p>
      ) : (
        <DataTable
          data={subjects}
          showRowNumber
          columns={[
            { key: 'name', header: 'Nama Mapel', render: (row) => <span className="font-semibold text-slate-950">{row.name}</span> },
            { key: 'quotaRombel', header: 'Kuota Rombel', render: (row) => row.quotaRombel },
            { key: 'linearFields', header: 'Bidang Linear', render: (row) => row.linearFields.join(', ') },
          ]}
        />
      )}
    </div>
  );
}
