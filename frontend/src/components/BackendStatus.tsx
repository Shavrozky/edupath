import { useEffect, useState } from 'react';
import { API_BASE_URL, api } from '../api/client';

type HealthState = 'checking' | 'online' | 'offline';

export function BackendStatus() {
  const [state, setState] = useState<HealthState>('checking');

  useEffect(() => {
    api
      .get<{ status: string }>('/health')
      .then((response) => setState(response.data.status === 'OK' ? 'online' : 'offline'))
      .catch(() => setState('offline'));
  }, []);

  const color = state === 'online' ? 'bg-emerald-500' : state === 'offline' ? 'bg-red-500' : 'bg-amber-500';
  const label = state === 'online' ? 'Backend Online' : state === 'offline' ? 'Backend Offline' : 'Checking Backend';

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </div>
      <p className="mt-2 break-all text-slate-500">{API_BASE_URL}</p>
    </div>
  );
}
