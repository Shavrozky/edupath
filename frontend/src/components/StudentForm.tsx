import { FormEvent, useState } from 'react';
import { SUBJECT_NAMES, type Student, type StudentPayload } from '../types';

type Props = {
  initialValue?: Student;
  onSubmit: (payload: StudentPayload) => Promise<void>;
  submitLabel: string;
};

const emptyPayload: StudentPayload = {
  name: '',
  nis: '',
  originClass: '',
  careerGoal: '',
  targetMajor: '',
  prioritySubject1: SUBJECT_NAMES[0],
  prioritySubject2: SUBJECT_NAMES[1],
  backupSubject: SUBJECT_NAMES[7],
  strongestSubject: SUBJECT_NAMES[0],
  scores: Object.fromEntries(SUBJECT_NAMES.map((subject) => [subject, 0])),
  reason: '',
};

export function StudentForm({ initialValue, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<StudentPayload>(initialValue ?? emptyPayload);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nama
          <input required className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          NIS
          <input required className={inputClass} value={form.nis} onChange={(event) => setForm({ ...form, nis: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Kelas Asal
          <input required className={inputClass} value={form.originClass} onChange={(event) => setForm({ ...form, originClass: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Cita-cita
          <input required className={inputClass} value={form.careerGoal} onChange={(event) => setForm({ ...form, careerGoal: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Jurusan Kuliah
          <input required className={inputClass} value={form.targetMajor} onChange={(event) => setForm({ ...form, targetMajor: event.target.value })} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['prioritySubject1', 'Mapel Prioritas 1'],
          ['prioritySubject2', 'Mapel Prioritas 2'],
          ['backupSubject', 'Mapel Cadangan'],
          ['strongestSubject', 'Mapel Paling Dikuasai'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            <select className={inputClass} value={form[key as keyof StudentPayload] as string} onChange={(event) => setForm({ ...form, [key]: event.target.value })}>
              {SUBJECT_NAMES.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-slate-950">Nilai Mapel</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {SUBJECT_NAMES.map((subject) => (
            <label key={subject} className="text-sm font-medium text-slate-700">
              {subject}
              <input
                className={inputClass}
                min={0}
                max={100}
                type="number"
                value={form.scores[subject] ?? 0}
                onChange={(event) => setForm({ ...form, scores: { ...form.scores, [subject]: Number(event.target.value) } })}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Alasan Memilih
        <textarea className={`${inputClass} min-h-28`} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
      </label>

      <button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Menyimpan...' : submitLabel}
      </button>
    </form>
  );
}
