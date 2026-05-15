import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import { StudentForm } from '../components/StudentForm';
import type { Student, StudentPayload } from '../types';

export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | undefined>();
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get<Student>(`/students/${id}`)
      .then((response) => setStudent(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload: StudentPayload) {
    try {
      if (id) {
        await api.put(`/students/${id}`, payload);
      } else {
        await api.post('/students', payload);
      }
      navigate('/students');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) return <p className="text-slate-500">Memuat form...</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{id ? 'Edit Student' : 'Add Student'}</h1>
        <p className="mt-1 text-slate-500">Lengkapi pilihan mapel, cita-cita, nilai, dan alasan siswa.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <StudentForm initialValue={student} onSubmit={handleSubmit} submitLabel={id ? 'Update Student' : 'Save Student'} />
    </div>
  );
}
