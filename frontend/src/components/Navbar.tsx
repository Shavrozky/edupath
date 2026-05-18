import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BackendStatus } from './BackendStatus';

const links = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/students', label: 'Students', icon: '◉' },
  { to: '/students/new', label: 'Add Student', icon: '+' },
  { to: '/rombels', label: 'Rombels', icon: '▤' },
  { to: '/subjects', label: 'Subjects', icon: '◇' },
  { to: '/recommendations', label: 'Recommendations', icon: '✓' },
];

export function Navbar() {
  const { logout, user } = useAuth();

  return (
    <aside className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="px-4 py-3 lg:px-5 lg:py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-200 lg:h-11 lg:w-11">EP</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">EduPath</p>
            <h1 className="text-lg font-bold text-slate-950 lg:text-xl">Rombel Planner</h1>
          </div>
        </div>
        <p className="mt-3 hidden text-sm leading-6 text-slate-500 lg:block">Rule-based placement untuk kelas XI/XII.</p>
      </div>
      <nav className="flex snap-x gap-2 overflow-x-auto px-4 pb-3 lg:flex-col lg:overflow-visible lg:pb-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                'group flex snap-start whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition lg:items-center lg:gap-3',
                isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')
            }
          >
            <span className="hidden h-6 w-6 place-items-center rounded-lg bg-white/15 text-xs lg:grid">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="hidden lg:block">
        <BackendStatus />
      </div>
      <div className="px-4 pb-4">
        {user && (
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
            <p className="font-bold text-slate-900">{user.username}</p>
            <p className="capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
