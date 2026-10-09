import { useEffect, useState } from 'react';
import { Package, Layers, ClipboardList, AlertTriangle } from 'lucide-react';
import { api } from '../api';

const status: Record<string, string> = { Rencana: 'bg-amber-50 text-amber-600', Proses: 'bg-sky-50 text-sky-600' };

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([api('/items'), api('/boms'), api('/orders'), api('/mrp')])
      .then(([items, boms, orders, mrp]) => setD({ items, boms, orders, mrp }))
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="text-red-600">{err}</p>;
  if (!d) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />;
  const open = d.orders.filter((o: any) => o.status !== 'Selesai');
  const short = d.mrp.filter((m: any) => m.shortage > 0).length;
  const low = [...d.items].filter((i: any) => i.type === 'Bahan Baku').sort((a: any, b: any) => a.stock - b.stock).slice(0, 5);
  const cards = [
    { l: 'Total Barang', v: d.items.length, h: 'Terdaftar di master', i: Package, c: 'bg-indigo-50 text-indigo-600' },
    { l: 'Bill of Materials', v: d.boms.length, h: 'Resep produksi', i: Layers, c: 'bg-violet-50 text-violet-600' },
    { l: 'Order Aktif', v: open.length, h: 'Belum selesai', i: ClipboardList, c: 'bg-sky-50 text-sky-600' },
    { l: 'Bahan Kurang', v: short, h: short ? 'Perlu pembelian' : 'Semua aman', i: AlertTriangle, c: short ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600' },
  ];
  const prod = (id: number) => d.items.find((i: any) => i.id === id)?.name || '-';
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Halo, {localStorage.getItem('name')} 👋</h2><p className="text-sm text-slate-500">Ringkasan produksi dan kebutuhan material hari ini.</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ l, v, h, i: Icon, c }) => (
          <div key={l} className="card flex items-start justify-between p-5">
            <div><p className="text-sm text-slate-500">{l}</p><p className="mt-1 text-3xl font-bold">{v}</p><p className="mt-1 text-xs text-slate-400">{h}</p></div>
            <div className={`rounded-xl p-2.5 ${c}`}><Icon size={20} /></div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-x-auto lg:col-span-2">
          <div className="border-b border-slate-100 p-5"><h3 className="font-semibold">Perencanaan Kebutuhan Material (MRP)</h3><p className="text-xs text-slate-400">Dihitung dari semua order aktif sampai level bahan baku</p></div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr><th className="px-5 py-3">Material</th><th>Kebutuhan</th><th className="w-40">Ketersediaan</th><th className="pr-5">Status</th></tr></thead>
            <tbody>
              {d.mrp.map((m: any) => {
                const pct = Math.min(100, Math.round((m.stock / m.required) * 100));
                return (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-5 py-3"><p className="font-medium">{m.name}</p><p className="text-xs text-slate-400">{m.code}</p></td>
                    <td>{m.required} {m.unit}</td>
                    <td><div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${m.shortage ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: pct + '%' }} /></div><p className="mt-1 text-xs text-slate-400">stok {m.stock} ({pct}%)</p></td>
                    <td className="pr-5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.shortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{m.shortage ? `Beli ${m.shortage}` : 'Aman'}</span></td>
                  </tr>
                );
              })}
              {!d.mrp.length && <tr><td colSpan={4} className="py-10 text-center text-slate-400">Belum ada order aktif dengan BOM</td></tr>}
            </tbody>
          </table>
        </section>
        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="mb-4 font-semibold">Order Aktif</h3>
            <div className="space-y-2">
              {open.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                  <div><p className="text-sm font-medium">{o.orderNo}</p><p className="text-xs text-slate-400">{prod(o.productId)} · {o.qty} · {o.dueDate}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status[o.status] || ''}`}>{o.status}</span>
                </div>
              ))}
              {!open.length && <p className="text-sm text-slate-400">Tidak ada order aktif</p>}
            </div>
          </section>
          <section className="card p-5">
            <h3 className="mb-4 font-semibold">Stok Bahan Terendah</h3>
            <div className="space-y-3">
              {low.map((i: any) => <div key={i.id} className="flex justify-between text-sm"><span>{i.name}</span><span className="font-semibold">{i.stock} {i.unit}</span></div>)}
              {!low.length && <p className="text-sm text-slate-400">Belum ada bahan baku</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
