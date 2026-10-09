import { useEffect, useState, FormEvent } from 'react';
import { Plus, Search, Pencil, Trash2, X, CheckCircle2, Inbox } from 'lucide-react';
import { api } from '../api';

const PER = 8;
const badge: Record<string, string> = {
  Rencana: 'bg-amber-50 text-amber-600', Proses: 'bg-sky-50 text-sky-600', Selesai: 'bg-emerald-50 text-emerald-600',
  'Bahan Baku': 'bg-orange-50 text-orange-600', 'Setengah Jadi': 'bg-violet-50 text-violet-600', 'Barang Jadi': 'bg-emerald-50 text-emerald-600',
};

export type Field = { key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'ref' | 'lines'; options?: string[] };
type Props = { title: string; path: string; fields: Field[] };

export default function Crud({ title, path, fields }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [ok, setOk] = useState('');
  const [pg, setPg] = useState(0);
  const toast = (m: string) => { setOk(m); setTimeout(() => setOk(''), 2500); };

  const load = async () => {
    try { setRows(await api(`/${path}`)); setItems(await api('/items')); } catch (e: any) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [path]);

  const label = (id: number) => { const i = items.find((x) => x.id === id); return i ? `${i.code} - ${i.name}` : '-'; };
  const cell = (r: any, f: Field) =>
    f.type === 'select' ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[r[f.key]] || 'bg-slate-100'}`}>{r[f.key]}</span>
    : f.type === 'lines' ? <div className="flex flex-wrap gap-1">{(r.lines || []).map((l: any, i: number) => <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{label(l.itemId)} ×{l.qty}</span>)}</div>
    : f.type === 'ref' ? label(r[f.key]) : f.type === 'number' && f.key === 'cost' ? 'Rp ' + Number(r[f.key] || 0).toLocaleString('id-ID') : r[f.key] ?? '-';
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const body = { ...form };
    fields.forEach((f) => { if (f.type === 'number' || f.type === 'ref') body[f.key] = Number(body[f.key] || 0); });
    if (body.lines) body.lines = body.lines.map((l: any) => ({ itemId: Number(l.itemId), qty: Number(l.qty) }));
    try {
      await api(`/${path}${form.id ? '/' + form.id : ''}`, { method: form.id ? 'PUT' : 'POST', body });
      setForm(null);
      toast('Data berhasil disimpan');
      load();
    } catch (x: any) { setErr(x.message); }
  };
  const del = async (id: number) => {
    if (!confirm('Hapus data ini?')) return;
    try { await api(`/${path}/${id}`, { method: 'DELETE' }); setErr(''); toast('Data dihapus'); load(); } catch (x: any) { setErr(x.message); }
  };
  const shown = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">{title}</h2><p className="text-sm text-slate-500">{rows.length} data tersimpan</p></div>
        <div className="flex gap-2">
          <div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="inp !w-56 !pl-9" placeholder="Cari..." value={q} onChange={(e) => { setQ(e.target.value); setPg(0); }} /></div>
          <button className="btn" onClick={() => { setErr(''); setForm(path === 'orders' ? { status: 'Rencana', qty: 1 } : { lines: [] }); }}><Plus size={16} />Tambah</button>
        </div>
      </div>
      {err && !form && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{err}</p>}
      {ok && <div className="pop fixed bottom-6 right-6 z-20 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><CheckCircle2 size={18} className="text-emerald-400" />{ok}</div>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400"><tr>{fields.map((f) => <th key={f.key} className="p-4">{f.label}</th>)}<th className="p-4">Aksi</th></tr></thead>
          <tbody>
            {shown.slice(pg * PER, (pg + 1) * PER).map((r) => (
              <tr key={r.id} className="border-t border-slate-100 transition hover:bg-indigo-50/40">
                {fields.map((f) => <td key={f.key} className="p-4">{cell(r, f)}</td>)}
                <td className="space-x-2 whitespace-nowrap p-4">
                  <button className="btn-o" onClick={() => { setErr(''); setForm({ ...r }); }}><Pencil size={13} />Edit</button>
                  <button className="btn-o !text-red-600" onClick={() => del(r.id)}><Trash2 size={13} />Hapus</button>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={fields.length + 1} className="p-10 text-center text-slate-400"><Inbox className="mx-auto mb-2" />Tidak ada data</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>Menampilkan {shown.length ? pg * PER + 1 : 0}–{Math.min((pg + 1) * PER, shown.length)} dari {shown.length}</span>
          <div className="flex gap-2">
            <button className="btn-o" disabled={pg === 0} onClick={() => setPg(pg - 1)}>Sebelumnya</button>
            <button className="btn-o" disabled={(pg + 1) * PER >= shown.length} onClick={() => setPg(pg + 1)}>Berikutnya</button>
          </div>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="pop max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{form.id ? 'Edit' : 'Tambah'} {title}</h3><button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button></div>
            {err && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={`block text-sm ${f.type === 'lines' ? 'sm:col-span-2' : ''}`}>
                <span className="mb-1.5 block font-medium text-slate-600">{f.label}</span>
                {f.type === 'select' ? (
                  <select className="inp" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                    <option value="">-- pilih --</option>{f.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === 'ref' ? (
                  <select className="inp" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                    <option value="">-- pilih --</option>{items.map((i) => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                  </select>
                ) : f.type === 'lines' ? (
                  <div className="space-y-2">
                    {(form.lines || []).map((l: any, i: number) => (
                      <div key={i} className="flex gap-2">
                        <select className="inp" value={l.itemId ?? ''} onChange={(e) => set('lines', form.lines.map((x: any, j: number) => (j === i ? { ...x, itemId: e.target.value } : x)))}>
                          <option value="">-- komponen --</option>{items.map((it) => <option key={it.id} value={it.id}>{it.code} - {it.name}</option>)}
                        </select>
                        <input className="inp !w-24" type="number" min="0" step="any" value={l.qty} onChange={(e) => set('lines', form.lines.map((x: any, j: number) => (j === i ? { ...x, qty: e.target.value } : x)))} />
                        <button type="button" className="btn-o" onClick={() => set('lines', form.lines.filter((_: any, j: number) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="btn-o" onClick={() => set('lines', [...(form.lines || []), { itemId: '', qty: 1 }])}>+ Komponen</button>
                  </div>
                ) : (
                  <input className="inp" type={f.type} min={f.type === 'number' ? 0 : undefined} step="any" value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </label>
            ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" className="btn-o" onClick={() => setForm(null)}>Batal</button>
              <button className="btn">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
