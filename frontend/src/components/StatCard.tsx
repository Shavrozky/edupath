type StatCardProps = {
  label: string;
  value: string | number;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
};

const tones = {
  blue: 'border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-blue-100/60',
  green: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white text-emerald-700 shadow-emerald-100/60',
  amber: 'border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-700 shadow-amber-100/60',
  red: 'border-red-100 bg-gradient-to-br from-red-50 to-white text-red-700 shadow-red-100/60',
  slate: 'border-slate-200 bg-white text-slate-800 shadow-slate-100/80',
};

export function StatCard({ label, value, tone = 'slate' }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${tones[tone]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
