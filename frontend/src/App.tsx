import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { RombelsPage } from './pages/RombelsPage';
import { StudentFormPage } from './pages/StudentFormPage';
import { StudentsPage } from './pages/StudentsPage';
import { SubjectsPage } from './pages/SubjectsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="*"
          element={
            <div className="min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/students/new" element={<StudentFormPage />} />
                  <Route path="/students/:id/edit" element={<StudentFormPage />} />
                  <Route path="/rombels" element={<RombelsPage />} />
                  <Route path="/subjects" element={<SubjectsPage />} />
                  <Route path="/recommendations" element={<RecommendationsPage />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
