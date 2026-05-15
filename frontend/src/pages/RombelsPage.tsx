import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import type { Rombel } from '../types';

export function RombelsPage() {
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Rombel[]>('/rombels')
      .then((response) => setRombels(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-950">Rombels</h1>
        <p className="mt-1 text-slate-500">Kapasitas, kelompok, mapel, dan status aktif rombel.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-slate-500">Memuat rombel...</p>
      ) : (
        <DataTable
          data={rombels}
          showRowNumber
          columns={[
            { key: 'name', header: 'Rombel', render: (row) => <span className="font-bold text-slate-950">{row.name}</span> },
            { key: 'group', header: 'Kelompok', render: (row) => row.group },
            { key: 'subjects', header: 'Mapel', render: (row) => row.subjects.join(', ') },
            { key: 'capacity', header: 'Kapasitas', render: (row) => row.capacity },
            { key: 'filled', header: 'Filled', render: (row) => row.filled },
            { key: 'remaining', header: 'Sisa Kuota', render: (row) => Math.max(row.capacity - row.filled, 0) },
            {
              key: 'active',
              header: 'Status',
              render: (row) => (
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {row.active ? 'Aktif' : 'Nonaktif'}
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
