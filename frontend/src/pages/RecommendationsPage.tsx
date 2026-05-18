import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { DataTable } from '../components/DataTable';
import { RecommendationBadge } from '../components/RecommendationBadge';
import { GROUP_NAMES, type Recommendation, type Rombel } from '../types';

type OverrideForm = {
  recommendationId: string;
  finalRombel: string;
  finalGroup: string;
  reviewNotes: string;
};

function rombelRemaining(rombel: Rombel) {
  return Math.max(rombel.capacity - rombel.filled, 0);
}

export function RecommendationsPage() {
  const { isSuperadmin } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [overrideForm, setOverrideForm] = useState<OverrideForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [placementFilter, setPlacementFilter] = useState<'all' | 'placed' | 'unplaced'>('all');

  const reviewCounts = useMemo(
    () => ({
      all: recommendations.length,
      needReview: recommendations.filter((item) => item.status === 'Need Review').length,
      placed: recommendations.filter((item) => Boolean(item.finalRombel)).length,
      unplaced: recommendations.filter((item) => !item.finalRombel).length,
    }),
    [recommendations],
  );

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recommendations.filter((recommendation) => {
      const matchesStatus = statusFilter === 'All' || recommendation.status === statusFilter;
      const matchesPlacement =
        placementFilter === 'all' ||
        (placementFilter === 'placed' && Boolean(recommendation.finalRombel)) ||
        (placementFilter === 'unplaced' && !recommendation.finalRombel);
      const matchesSearch =
        !query ||
        [
          recommendation.studentName,
          recommendation.nis,
          recommendation.originClass,
          recommendation.recommendedGroup,
          recommendation.recommendedRombel ?? '',
          recommendation.finalRombel ?? '',
          recommendation.status,
          recommendation.reviewNotes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesPlacement && matchesSearch;
    });
  }, [placementFilter, recommendations, search, statusFilter]);

  const selectedRecommendation = useMemo(
    () => recommendations.find((item) => item.id === overrideForm?.recommendationId) ?? null,
    [overrideForm?.recommendationId, recommendations],
  );

  const selectedRombel = useMemo(
    () => rombels.find((item) => item.name === overrideForm?.finalRombel) ?? null,
    [overrideForm?.finalRombel, rombels],
  );

  async function loadData() {
    setLoading(true);
    try {
      const [recommendationsResponse, rombelsResponse] = await Promise.all([api.get<Recommendation[]>('/recommendations'), api.get<Rombel[]>('/rombels')]);
      setRecommendations(recommendationsResponse.data);
      setRombels(rombelsResponse.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function generateRecommendations() {
    setWorking(true);
    try {
      const response = await api.post<Recommendation[]>('/recommendations/generate');
      setRecommendations(response.data);
      const rombelsResponse = await api.get<Rombel[]>('/rombels');
      setRombels(rombelsResponse.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function exportExcel() {
    const params = new URLSearchParams();
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (placementFilter !== 'all') params.set('placement', placementFilter);
    const query = params.toString();
    try {
      const response = await api.get(`/export/recommendations.xlsx${query ? `?${query}` : ''}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const disposition = response.headers['content-disposition'];
      const filenameMatch = typeof disposition === 'string' ? disposition.match(/filename="?([^";]+)"?/) : null;
      link.href = url;
      link.download = filenameMatch?.[1] ?? 'recommendations.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitOverride(event: FormEvent) {
    event.preventDefault();
    if (!overrideForm) return;
    setWorking(true);
    try {
      await api.patch(`/recommendations/${overrideForm.recommendationId}/override`, {
        finalRombel: overrideForm.finalRombel || null,
        finalGroup: overrideForm.finalGroup || null,
        reviewNotes: overrideForm.reviewNotes,
        isOverridden: true,
      });
      setOverrideForm(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur xl:flex-row xl:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Recommendations</h1>
          <p className="mt-1 text-slate-500">Generate, review, override, dan export hasil rekomendasi. Total tampil: {filteredRecommendations.length} dari {recommendations.length} data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {['All', 'Recommended', 'Need Review', 'Quota Full', 'Not Linear', 'Manually Overridden'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" value={placementFilter} onChange={(event) => setPlacementFilter(event.target.value as 'all' | 'placed' | 'unplaced')}>
            <option value="all">Semua Placement</option>
            <option value="unplaced">Belum Ditempatkan</option>
            <option value="placed">Sudah Ditempatkan</option>
          </select>
          {isSuperadmin && (
            <button disabled={working} onClick={() => void generateRecommendations()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-60">
              {working ? 'Memproses...' : 'Generate Recommendation'}
            </button>
          )}
          <button onClick={() => void exportExcel()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
            Export Excel
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button onClick={() => { setStatusFilter('All'); setPlacementFilter('all'); }} className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Semua Data</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{reviewCounts.all}</p>
        </button>
        <button onClick={() => { setStatusFilter('Need Review'); setPlacementFilter('all'); }} className="rounded-2xl border border-amber-100 bg-amber-50/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Need Review</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{reviewCounts.needReview}</p>
        </button>
        <button onClick={() => { setStatusFilter('All'); setPlacementFilter('unplaced'); }} className="rounded-2xl border border-red-100 bg-red-50/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Belum Ditempatkan</p>
          <p className="mt-2 text-2xl font-bold text-red-800">{reviewCounts.unplaced}</p>
        </button>
        <button onClick={() => { setStatusFilter('All'); setPlacementFilter('placed'); }} className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sudah Ditempatkan</p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">{reviewCounts.placed}</p>
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {isSuperadmin && overrideForm && selectedRecommendation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm md:items-center md:p-6">
          <form onSubmit={submitOverride} className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl md:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Review Placement</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedRecommendation.studentName}</h2>
                <p className="mt-1 text-sm text-slate-500">NIS {selectedRecommendation.nis} · {selectedRecommendation.originClass}</p>
              </div>
              <button type="button" onClick={() => setOverrideForm(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Close
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.1fr]">
              <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">Skor Kelompok</h3>
                  <div className="mt-3 space-y-2">
                    {GROUP_NAMES.map((group) => (
                      <div key={group} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{group}</span>
                        <span className="font-bold text-slate-950">{selectedRecommendation.scoresByGroup[group] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <h3 className="font-semibold text-slate-950">Rekomendasi Sistem</h3>
                  <div className="mt-3 space-y-2 text-slate-600">
                    <p><span className="font-semibold text-slate-800">Group:</span> {selectedRecommendation.recommendedGroup}</p>
                    <p><span className="font-semibold text-slate-800">Rombel:</span> {selectedRecommendation.recommendedRombel ?? '-'}</p>
                    <p><span className="font-semibold text-slate-800">Alternatif:</span> {selectedRecommendation.alternativeRombels.length ? selectedRecommendation.alternativeRombels.join(', ') : '-'}</p>
                    <p><span className="font-semibold text-slate-800">Status:</span> <RecommendationBadge status={selectedRecommendation.status} /></p>
                    <p><span className="font-semibold text-slate-800">Catatan:</span> {selectedRecommendation.reviewNotes || '-'}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-semibold text-slate-950">Pilih Final Rombel</h3>
                  <p className="mt-1 text-sm text-slate-600">Jika rombel sudah penuh, sistem akan menaikkan kapasitas rombel tersebut setelah admin menyimpan placement.</p>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Final Rombel
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      value={overrideForm.finalRombel}
                      onChange={(event) => {
                        const rombel = rombels.find((item) => item.name === event.target.value);
                        setOverrideForm({ ...overrideForm, finalRombel: event.target.value, finalGroup: rombel?.group ?? '' });
                      }}
                    >
                      <option value="">Tidak ditempatkan</option>
                      {rombels.map((rombel) => {
                        const remaining = rombelRemaining(rombel);
                        return (
                          <option key={rombel.id} value={rombel.name}>
                            {rombel.name} - {rombel.group} - filled {rombel.filled}/{rombel.capacity} - sisa {remaining}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Final Group
                    <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" value={overrideForm.finalGroup} onChange={(event) => setOverrideForm({ ...overrideForm, finalGroup: event.target.value })}>
                      <option value="">Tidak ada</option>
                      {GROUP_NAMES.map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedRombel && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                    <h3 className="font-semibold text-slate-950">Rombel Capacity Helper</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Info label="Rombel" value={selectedRombel.name} />
                      <Info label="Group" value={selectedRombel.group} />
                      <Info label="Filled" value={selectedRombel.filled} />
                      <Info label="Capacity" value={selectedRombel.capacity} />
                      <Info label="Sisa Saat Ini" value={rombelRemaining(selectedRombel)} />
                      <Info label="Status Setelah Save" value={selectedRombel.filled >= selectedRombel.capacity ? `Capacity naik ke ${selectedRombel.filled + 1}` : 'Masih dalam kapasitas'} />
                    </div>
                    <p className="mt-3 text-slate-600"><span className="font-semibold text-slate-800">Mapel:</span> {selectedRombel.subjects.join(', ')}</p>
                  </div>
                )}

                <label className="block text-sm font-medium text-slate-700">
                  Review Notes
                  <textarea className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={overrideForm.reviewNotes} onChange={(event) => setOverrideForm({ ...overrideForm, reviewNotes: event.target.value })} />
                </label>
              </section>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setOverrideForm(null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button disabled={working} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">Save Placement</button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <p className="text-slate-500">Memuat rekomendasi...</p>
      ) : (
        <DataTable
          data={filteredRecommendations}
          paginated
          searchable
          showRowNumber
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama, NIS, rombel, status, atau catatan..."
          initialPageSize={25}
          columns={[
            { key: 'studentName', header: 'Nama Siswa', render: (row) => row.studentName },
            { key: 'nis', header: 'NIS', render: (row) => row.nis },
            { key: 'originClass', header: 'Kelas Asal', render: (row) => row.originClass },
            ...GROUP_NAMES.map((group) => ({ key: group, header: `Skor ${group}`, render: (row: Recommendation) => row.scoresByGroup[group] ?? 0 })),
            { key: 'recommendedGroup', header: 'Recommended Group', render: (row) => row.recommendedGroup },
            { key: 'recommendedRombel', header: 'Recommended Rombel', render: (row) => row.recommendedRombel ?? '-' },
            { key: 'finalRombel', header: 'Final Rombel', render: (row) => row.finalRombel ?? '-' },
            { key: 'status', header: 'Status', render: (row) => <RecommendationBadge status={row.status} /> },
            { key: 'reviewNotes', header: 'Review Notes', render: (row) => row.reviewNotes || '-' },
            ...(isSuperadmin
              ? [
                  {
                    key: 'actions',
                    header: 'Override',
                    render: (row: Recommendation) => (
                      <button className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-100" onClick={() => setOverrideForm({ recommendationId: row.id, finalRombel: row.finalRombel ?? '', finalGroup: row.finalGroup ?? '', reviewNotes: row.reviewNotes })}>
                        Review / Place
                      </button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}
