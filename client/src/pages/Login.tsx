import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, User, Lock, Boxes, BarChart3, ClipboardCheck } from 'lucide-react';
import { api } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState('admin');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await api('/auth/login', { method: 'POST', body: { username: u, password: p } });
      localStorage.setItem('token', r.token);
      localStorage.setItem('name', r.name);
      nav('/');
    } catch (x: any) { setErr(x.message); }
  };
  const feats = [[Boxes, 'Kelola stok & master barang'], [ClipboardCheck, 'Order produksi terintegrasi'], [BarChart3, 'Perencanaan material otomatis (MRP)']] as const;
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="flex items-center gap-3 text-xl font-bold"><Factory /> MRP ERP</div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Rencanakan produksi,<br />tanpa kehabisan bahan.</h2>
          {feats.map(([Icon, t]) => <p key={t} className="flex items-center gap-3 text-indigo-100"><Icon size={20} />{t}</p>)}
        </div>
        <p className="text-sm text-indigo-200">© MRP ERP Manufacturing Suite</p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={submit} className="pop w-full max-w-sm space-y-5">
          <div><h1 className="text-3xl font-bold">Selamat datang 👋</h1><p className="mt-1 text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard.</p></div>
          {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{err}</p>}
          <div className="relative"><User size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><input className="inp !pl-10" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} /></div>
          <div className="relative"><Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" /><input className="inp !pl-10" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <button className="btn w-full">Masuk</button>
          <p className="text-center text-xs text-slate-400">Default: admin / admin123</p>
        </form>
      </div>
    </div>
  );
}
