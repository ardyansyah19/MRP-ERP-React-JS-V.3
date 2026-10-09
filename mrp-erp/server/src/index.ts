import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, save, nextId } from './db';

const SECRET = process.env.JWT_SECRET || 'ganti-rahasia-ini';
const app = express();
app.use(cors());
app.use(express.json());

// ---- seed ----
if (!db.users.length) {
  db.users.push({ id: nextId('users'), username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'Administrator' });
  const add = (t: string, o: any) => db[t].push({ ...o, id: nextId(t) });
  add('items', { code: 'RM-001', name: 'Kayu Jati', type: 'Bahan Baku', unit: 'pcs', stock: 100, cost: 50000 });
  add('items', { code: 'RM-002', name: 'Paku', type: 'Bahan Baku', unit: 'pcs', stock: 500, cost: 200 });
  add('items', { code: 'FG-001', name: 'Meja Kayu', type: 'Barang Jadi', unit: 'unit', stock: 0, cost: 0 });
  add('boms', { productId: 3, lines: [{ itemId: 1, qty: 4 }, { itemId: 2, qty: 20 }] });
  add('orders', { orderNo: 'MO-001', productId: 3, qty: 30, dueDate: '2026-11-01', status: 'Rencana' });
  save();
}

// ---- auth ----
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = db.users.find((x: any) => x.username === username);
  if (!u || !bcrypt.compareSync(String(password || ''), u.password))
    return res.status(401).json({ error: 'Username atau password salah' });
  res.json({ token: jwt.sign({ id: u.id, name: u.name }, SECRET, { expiresIn: '8h' }), name: u.name });
});
const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    (req as any).user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesi berakhir, silakan login ulang' });
  }
};
app.use('/api', auth);

// ---- validasi ----
const required: Record<string, string[]> = {
  items: ['code', 'name', 'type', 'unit'],
  boms: ['productId'],
  orders: ['orderNo', 'productId', 'dueDate', 'status'],
};
function check(t: string, b: any, id = 0): string | null {
  for (const k of required[t]) if (b[k] === undefined || b[k] === '' || b[k] === 0) return `Field "${k}" wajib diisi`;
  if (t === 'items' && db.items.some((x: any) => x.code === b.code && x.id !== id)) return 'Kode barang sudah ada';
  if (t === 'items' && (b.stock < 0 || b.cost < 0)) return 'Stok/harga tidak boleh negatif';
  if (t === 'orders' && !(b.qty > 0)) return 'Qty harus lebih dari 0';
  if (t === 'orders' && db.orders.some((x: any) => x.orderNo === b.orderNo && x.id !== id)) return 'No. order sudah ada';
  if (t === 'boms') {
    if (!Array.isArray(b.lines) || !b.lines.length) return 'Tambahkan minimal 1 komponen';
    if (b.lines.some((l: any) => !l.itemId || !(l.qty > 0))) return 'Komponen/qty tidak valid';
    if (b.lines.some((l: any) => l.itemId === b.productId)) return 'Produk tidak boleh menjadi komponen dirinya sendiri';
    if (db.boms.some((x: any) => x.productId === b.productId && x.id !== id)) return 'BOM untuk produk ini sudah ada';
  }
  return null;
}
function finish(o: any): string | null {
  const bom = db.boms.find((b: any) => b.productId === o.productId);
  const find = (id: number) => db.items.find((i: any) => i.id === id);
  for (const l of bom?.lines || []) if ((find(l.itemId)?.stock || 0) < l.qty * o.qty) return `Stok ${find(l.itemId)?.name} tidak cukup`;
  for (const l of bom?.lines || []) find(l.itemId).stock -= l.qty * o.qty;
  const p = find(o.productId);
  if (p) p.stock = (p.stock || 0) + o.qty;
  return null;
}
const inUse = (t: string, id: number) =>
  t === 'items' &&
  (db.boms.some((b: any) => b.productId === id || b.lines.some((l: any) => l.itemId === id)) ||
    db.orders.some((o: any) => o.productId === id));

// ---- CRUD generik ----
for (const t of Object.keys(required)) {
  app.get(`/api/${t}`, (_q, r) => r.json(db[t]));
  app.post(`/api/${t}`, (q, r) => {
    const e = check(t, q.body);
    if (e) return r.status(400).json({ error: e });
    const row = { ...q.body, id: nextId(t) };
    db[t].push(row);
    save();
    r.status(201).json(row);
  });
  app.put(`/api/${t}/:id`, (q, r) => {
    const i = db[t].findIndex((x: any) => x.id === +q.params.id);
    if (i < 0) return r.status(404).json({ error: 'Data tidak ditemukan' });
    const e = check(t, q.body, +q.params.id);
    if (e) return r.status(400).json({ error: e });
    const row = { ...q.body, id: +q.params.id };
    if (t === 'orders' && db.orders[i].status !== 'Selesai' && row.status === 'Selesai') {
      const fe = finish(row);
      if (fe) return r.status(400).json({ error: fe });
    }
    db[t][i] = row;
    save();
    r.json(row);
  });
  app.delete(`/api/${t}/:id`, (q, r) => {
    const id = +q.params.id;
    if (inUse(t, id)) return r.status(409).json({ error: 'Barang masih dipakai di BOM/Order' });
    db[t] = db[t].filter((x: any) => x.id !== id);
    save();
    r.json({ ok: true });
  });
}

// ---- MRP: ledakkan BOM (multi-level) untuk semua order belum selesai ----
function explode(pid: number, qty: number, acc: Record<number, number>, d = 0): boolean {
  const b = db.boms.find((x: any) => x.productId === pid);
  if (!b || d > 10) return false;
  for (const l of b.lines) if (!explode(l.itemId, qty * l.qty, acc, d + 1)) acc[l.itemId] = (acc[l.itemId] || 0) + qty * l.qty;
  return true;
}
app.get('/api/mrp', (_q, r) => {
  const acc: Record<number, number> = {};
  db.orders.filter((o: any) => o.status !== 'Selesai').forEach((o: any) => explode(o.productId, o.qty, acc));
  r.json(
    Object.entries(acc).map(([id, required]) => {
      const it = db.items.find((x: any) => x.id === +id) || {};
      const stock = it.stock || 0;
      return { id: +id, code: it.code, name: it.name, unit: it.unit, required, stock, shortage: Math.max(0, required - stock) };
    })
  );
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`API berjalan di http://localhost:${PORT}`));
