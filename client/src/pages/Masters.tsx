import Crud from '../components/Crud';

export const Items = () => (
  <Crud title="Master Barang" path="items" fields={[
    { key: 'code', label: 'Kode', type: 'text' },
    { key: 'name', label: 'Nama', type: 'text' },
    { key: 'type', label: 'Tipe', type: 'select', options: ['Bahan Baku', 'Setengah Jadi', 'Barang Jadi'] },
    { key: 'unit', label: 'Satuan', type: 'text' },
    { key: 'stock', label: 'Stok', type: 'number' },
    { key: 'cost', label: 'Harga/Biaya', type: 'number' },
  ]} />
);
export const Boms = () => (
  <Crud title="Bill of Materials" path="boms" fields={[
    { key: 'productId', label: 'Produk', type: 'ref' },
    { key: 'lines', label: 'Komponen', type: 'lines' },
  ]} />
);
export const Orders = () => (
  <Crud title="Order Produksi" path="orders" fields={[
    { key: 'orderNo', label: 'No. Order', type: 'text' },
    { key: 'productId', label: 'Produk', type: 'ref' },
    { key: 'qty', label: 'Qty', type: 'number' },
    { key: 'dueDate', label: 'Jatuh Tempo', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['Rencana', 'Proses', 'Selesai'] },
  ]} />
);
