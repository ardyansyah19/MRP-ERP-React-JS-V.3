import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, ClipboardList, LogOut, Factory, PanelLeft } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Items, Boms, Orders } from './pages/Masters';

const groups = [
  { t: 'Ringkasan', m: [{ to: '/', label: 'Dashboard & MRP', icon: LayoutDashboard }] },
  { t: 'Data Master', m: [{ to: '/items', label: 'Master Barang', icon: Package }, { to: '/boms', label: 'Bill of Materials', icon: Layers }] },
  { t: 'Produksi', m: [{ to: '/orders', label: 'Order Produksi', icon: ClipboardList }] },
];
const flat = groups.flatMap((g) => g.m);

function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [col, setCol] = useState(false);
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  const name = localStorage.getItem('name') || 'User';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-slate-900 p-4 transition-all duration-300 md:flex ${col ? 'w-[76px]' : 'w-64'}`}>
        <div className={`mb-6 flex items-center gap-3 px-1 ${col ? 'justify-center' : ''}`}>
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 p-2.5 text-white"><Factory size={20} /></div>
          {!col && <div><h1 className="font-bold leading-tight text-white">MRP ERP</h1><p className="text-[11px] text-slate-400">Manufacturing Suite</p></div>}
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.t}>
              {!col && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.t}</p>}
              <div className="space-y-1">
                {g.m.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end title={label} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${col ? 'justify-center' : ''} ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <Icon size={18} />{!col && label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button onClick={() => { localStorage.clear(); nav('/login'); }} title="Keluar" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white ${col ? 'justify-center' : ''}`}>
          <LogOut size={18} />{!col && 'Keluar'}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setCol(!col)} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:block"><PanelLeft size={18} /></button>
            <div><p className="text-xs text-slate-400">MRP ERP / Menu</p><h1 className="text-sm font-semibold leading-tight">{flat.find((x) => x.to === pathname)?.label}</h1></div>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-slate-500 sm:block">{today}</p>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{name[0]}</span>
              <span className="text-sm font-medium">{name}</span>
            </div>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-white p-2 md:hidden">
          {flat.map(({ to, label }) => <NavLink key={to} to={to} end className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{label}</NavLink>)}
        </nav>
        <main className="pop mx-auto w-full max-w-6xl flex-1 p-4 md:p-8"><Outlet /></main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">MRP ERP v3.0 · Manufacturing Suite</footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<Items />} />
          <Route path="/boms" element={<Boms />} />
          <Route path="/orders" element={<Orders />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
