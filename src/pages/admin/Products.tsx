import React, { useEffect, useState, useMemo } from 'react'
import {
  collection, getDocs, updateDoc, deleteDoc,
  doc, setDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { invalidateProductsCache } from '../../lib/firestore'
import AdminLayout from '../../components/AdminLayout'
import { ProductDoc } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'
import { Plus, Search, Edit2, Trash2, Printer, Package, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Dairy', 'Fruits', 'Vegetables', 'Staples', 'Snacks', 'Household', 'Other']

const EMPTY: Omit<ProductDoc, 'createdAt'> = {
  barcode: '', name: '', category: 'Other', price: 0, mrp: 0,
  unit: '', stock: 0, emoji: '🛒', active: true, sortOrder: 0,
}

type SortDir = 'asc' | 'desc'

export default function AdminProducts() {
  const [products, setProducts] = useState<(ProductDoc & { id: string })[]>([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<ProductDoc, 'createdAt'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const load = async () => {
    const snap = await getDocs(collection(db, 'products'))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() as ProductDoc }))
    setProducts(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Next sort order = max existing + 1 (or 1 if no products yet)
  const nextSortOrder = useMemo(() => {
    if (products.length === 0) return 1
    const max = Math.max(...products.map((p) => p.sortOrder ?? 0))
    return max + 1
  }, [products])

  const filtered = useMemo(() => {
    let list = products
    if (cat !== 'All') list = list.filter((p) => p.category === cat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || p.barcode.includes(q)
      )
    }
    // Sort by sortOrder asc or desc
    list = [...list].sort((a, b) => {
      const aOrder = a.sortOrder ?? 0
      const bOrder = b.sortOrder ?? 0
      return sortDir === 'asc' ? aOrder - bOrder : bOrder - aOrder
    })
    return list
  }, [products, search, cat, sortDir])

  const handleSave = async () => {
    if (!form.barcode || !form.name) { toast.error('Barcode and name required'); return }
    setSaving(true)
    try {
      if (modal === 'add') {
        const orderToUse = form.sortOrder > 0 ? form.sortOrder : nextSortOrder
        await setDoc(doc(db, 'products', form.barcode), {
          ...form,
          sortOrder: orderToUse,
          createdAt: serverTimestamp(),
        })
        toast.success(`Product added (#${orderToUse})`)
      } else {
        await updateDoc(doc(db, 'products', form.barcode), { ...form })
        toast.success('Product updated')
      }
      invalidateProductsCache()
      setModal(null)
      setForm(EMPTY)
      await load()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (barcode: string) => {
    if (!confirm('Delete this product?')) return
    await deleteDoc(doc(db, 'products', barcode))
    invalidateProductsCache()
    toast.success('Deleted')
    await load()
  }

  const openAdd = () => {
    setForm({ ...EMPTY, sortOrder: nextSortOrder })
    setModal('add')
  }

  const openEdit = (p: ProductDoc & { id: string }) => {
    setForm({
      barcode: p.barcode, name: p.name, category: p.category,
      price: p.price, mrp: p.mrp, unit: p.unit, stock: p.stock,
      emoji: p.emoji, active: p.active, sortOrder: p.sortOrder ?? 0,
    })
    setModal('edit')
  }

  const printLabels = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const items = filtered.slice(0, 20)
    win.document.write(`<html><head><title>Barcode Labels</title></head><body>
      <style>body{font-family:sans-serif}div{display:inline-block;margin:8px;padding:8px;border:1px solid #ccc;text-align:center;width:120px}
      svg{max-width:100%}h4{margin:4px 0;font-size:12px}p{margin:2px 0;font-size:10px;color:#666}</style>`)
    for (const p of items) {
      win.document.write(`<div><h4>${p.emoji} ${p.name}</h4><p>${p.barcode}</p><p>${formatCurrency(p.price)}</p></div>`)
    }
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Products</h2>
        <div className="flex gap-2">
          <button onClick={printLabels} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Printer size={16} /> Labels
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or barcode..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 outline-none"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none">
          <option>All</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* Sort order column with toggle */}
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1 text-gray-500 font-medium hover:text-green-600 transition-colors"
                      title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
                    >
                      #
                      {sortDir === 'asc'
                        ? <ArrowUp size={13} className="text-green-600" />
                        : <ArrowDown size={13} className="text-green-600" />
                      }
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Barcode</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Price</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">MRP</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Stock</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.barcode} className="border-t border-gray-100 hover:bg-gray-50">
                    {/* Sort order badge */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                        {p.sortOrder ?? '–'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.category} · {p.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.barcode}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(p.mrp)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${
                        p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-gray-900'
                      }`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>{p.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-green-600">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p.barcode)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h3>
            <div className="space-y-3">
              {/* Sort Order field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sort Order #
                  <span className="ml-1 text-gray-400 font-normal">(unique position in list)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none bg-indigo-50"
                />
              </div>
              {[
                { label: 'Barcode', key: 'barcode', type: 'text', disabled: modal === 'edit' },
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Emoji', key: 'emoji', type: 'text' },
                { label: 'Unit', key: 'unit', type: 'text' },
                { label: 'Price (₹)', key: 'price', type: 'number' },
                { label: 'MRP (₹)', key: 'mrp', type: 'number' },
                { label: 'Stock', key: 'stock', type: 'number' },
              ].map(({ label, key, type, disabled }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    disabled={disabled}
                    value={(form as Record<string, string | number | boolean>)[key] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none disabled:bg-gray-50"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setModal(null); setForm(EMPTY) }}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
