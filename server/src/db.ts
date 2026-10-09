import fs from 'fs';
import path from 'path';
const dir = path.join(__dirname, '..', 'data');
const file = path.join(dir, 'db.json');
fs.mkdirSync(dir, { recursive: true });
export const db: any = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf8'))
  : { seq: {}, items: [], boms: [], orders: [], users: [] };
export const save = () => fs.writeFileSync(file, JSON.stringify(db, null, 2));
export const nextId = (t: string): number => (db.seq[t] = (db.seq[t] || 0) + 1);
