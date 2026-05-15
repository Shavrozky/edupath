import type { RecommendationStatus } from '../types';

type Props = {
  status: RecommendationStatus | string;
};

const styles: Record<string, string> = {
  Recommended: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  'Need Review': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Quota Full': 'bg-red-100 text-red-800 ring-red-200',
  'Not Linear': 'bg-orange-100 text-orange-800 ring-orange-200',
  'Manually Overridden': 'bg-violet-100 text-violet-800 ring-violet-200',
};

export function RecommendationBadge({ status }: Props) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] ?? styles['Need Review']}`}>
      {status}
    </span>
  );
}
