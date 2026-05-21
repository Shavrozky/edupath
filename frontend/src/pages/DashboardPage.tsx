import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { StatCard } from '../components/StatCard';
import type { DashboardSummary } from '../types';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardSummary>('/dashboard/summary')
      .then((response) => setSummary(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Memuat dashboard...</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!summary) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="animate-slide-up rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-slate-500">Ringkasan placement dan distribusi rombel.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Siswa" value={summary.totalStudents} tone="blue" />
        <StatCard label="Total Kapasitas" value={summary.totalCapacity} tone="blue" />
        <StatCard label="Sudah Ditempatkan" value={summary.totalPlaced} tone="green" />
        <StatCard label="Belum Ditempatkan" value={summary.totalUnplaced} tone="amber" />
        <StatCard label="Need Review" value={summary.totalNeedReview} tone="amber" />
        <StatCard label="Quota Full" value={summary.totalQuotaFull} tone="red" />
        <div className="sm:col-span-2 lg:col-span-3">
          <StatCard label="Override Manual" value={summary.totalManualOverrides ?? summary.totalOverridden} tone="blue" />
        </div>
      </div>
      {summary.totalOverCapacityRombels > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-bold">Rombel melebihi kapasitas karena manual override.</p>
          <p className="mt-1">{summary.overCapacityRombels.map((item) => `${item.name}: ${item.filled}/${item.capacity}`).join(', ')}</p>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryList title="Distribusi Rombel" items={summary.rombelDistribution} />
        <SummaryList title="Distribusi Kelompok" items={summary.groupDistribution} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SummaryList title="Sisa Kuota Rombel" items={summary.remainingCapacityByRombel ?? {}} />
        <SummaryList title="Placement Basis" items={summary.placementBasisCount ?? {}} />
      </div>
      <SummaryList title="Demand Mapel" items={summary.subjectDemand} />
    </div>
  );
}

function SummaryList({ title, items = {} }: { title: string; items?: Record<string, number> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-2">
        {Object.keys(items).length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada data.</p>
        ) : (
          Object.entries(items).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-blue-50">
              <span className="font-medium text-slate-700">{key}</span>
              <span className="font-bold text-slate-950">{value}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
