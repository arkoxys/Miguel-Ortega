import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
import { db, auth, loginWithGoogle, handleFirestoreError, OperationType } from '../services/firebase';
import { Product, Category, Order as OrderType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, ListOrdered, Plus, LogOut, Edit, Trash2, Save, X, Image as ImageIcon, Check, User as UserIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserProfile } from '../types';

// --- Admin Components ---

function AdminSidebar({ user }: { user: FirebaseUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard /> },
    { name: 'Productos', path: '/admin/products', icon: <ShoppingBag /> },
    { name: 'Pedidos', path: '/admin/orders', icon: <ListOrdered /> },
    { name: 'Clientes', path: '/admin/customers', icon: <Users /> },
  ];

  return (
    <div className="w-64 bg-[#2A2A2A] text-white min-h-screen p-6 hidden md:flex flex-col">
      <div className="mb-10 px-4">
        <h2 className="font-serif text-2xl italic">Admin Hemma</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Panel de Gestión</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path 
                ? 'bg-sonoma-sage text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center space-x-3 mb-6 px-4">
          <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" alt="User" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">{user.displayName}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-400 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product?: Product, onClose: () => void, onSave: () => void }) {
  const [form, setForm] = useState<Partial<Product>>(product || {
    name: '',
    description: '',
    price: 0,
    category: Category.CASUAL,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Negro', 'Blanco'],
    images: [],
    stock: 0
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (product?.id) {
        await updateDoc(doc(db, 'products', product.id), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'products'), { ...form, createdAt: serverTimestamp() });
      }
      onSave();
      onClose();
    } catch (error) {
      handleFirestoreError(error, product?.id ? OperationType.UPDATE : OperationType.CREATE, 'products');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif italic text-sonoma-sage">{product ? 'Editar Prenda' : 'Nueva Prenda'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Nombre</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Precio ($)</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Stock</label>
                  <input required type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Categoría</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as Category})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage">
                  <option value={Category.CASUAL}>Casual</option>
                  <option value={Category.ELEGANCIA}>Elegancia</option>
                  <option value={Category.ACCESORIOS}>Accesorios</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">URL de Imagen</label>
                <input placeholder="https://..." value={form.images?.[0] || ''} onChange={e => setForm({...form, images: [e.target.value]})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Tallas (Separadas por coma)</label>
                <input value={form.sizes?.join(', ')} onChange={e => setForm({...form, sizes: e.target.value.split(',').map(s => s.trim())})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Colores (Separados por coma)</label>
                <input value={form.colors?.join(', ')} onChange={e => setForm({...form, colors: e.target.value.split(',').map(s => s.trim())})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-2 px-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-sonoma-sage h-24" />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-sonoma-sage text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-sonoma-sage/20 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <><Save className="w-5 h-5" /> <span>Guardar Prenda</span></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  
  const fetchProducts = async () => {
    const snapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await deleteDoc(doc(db, 'products', id));
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif italic text-sonoma-sage">Gestión de Inventario</h1>
          <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mt-1">Controla precios, tallas y stock</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
          className="bg-sonoma-sage text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-sonoma-sage/20 font-medium transition-transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Prenda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center shadow-sm border border-gray-100 group">
            <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex-none mr-4">
              <img src={p.images[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{p.category} | Stock: <span className={p.stock <= 5 ? 'text-red-500 font-bold' : ''}>{p.stock}</span></p>
            </div>
            <div className="text-right mr-8">
              <p className="font-bold text-sonoma-sage">${p.price.toFixed(2)}</p>
            </div>
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                className="p-2 text-gray-400 hover:text-sonoma-sage hover:bg-sonoma-sage/5 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(p.id)}
                className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSave={fetchProducts} 
        />
      )}
    </div>
  );
}

function OrdersManager() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  
  const fetchOrders = async () => {
    const snapshot = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderType)));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', id), { status: newStatus });
    fetchOrders();
  };

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-serif italic text-sonoma-sage">Pedidos Recientes</h1>
        <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mt-1">Gestión de entregas y estatus</p>
      </div>

      <div className="space-y-6">
        {orders.map(o => (
          <div key={o.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-50">
              <div>
                <h3 className="font-serif text-xl mb-1">{o.customerName}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest">{format(o.createdAt?.toDate() || new Date(), "d 'de' MMMM, HH:mm", { locale: es })}</p>
              </div>
              <div className="flex items-center space-x-3">
                <select 
                  value={o.status} 
                  onChange={e => updateStatus(o.id!, e.target.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                    o.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    o.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    o.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-300 mb-2">Detalles del Envío</p>
                <p className="text-sm"><strong>Ref/Tel:</strong> {o.customerPhone}</p>
                <p className="text-sm"><strong>Dir:</strong> {o.customerAddress} ({o.customerZone})</p>
                <p className="text-sm mt-2 font-medium text-sonoma-sage">Método: {o.paymentMethod.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-300 mb-2">Prendas</p>
                <div className="space-y-1">
                  {o.items.map((item, i) => (
                    <p key={i} className="text-xs text-gray-600">{item.name} ({item.size}) x{item.quantity}</p>
                  ))}
                </div>
                <p className="text-lg font-bold text-sonoma-sage mt-4">${o.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-serif italic text-sonoma-sage">Comunidad Hemma</h1>
        <p className="text-sm text-gray-400 uppercase tracking-[0.2em] mt-1">Directorio de clientes registrados</p>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-left font-sans">
          <thead className="bg-gray-50 border-b border-gray-100 font-bold uppercase text-[10px] text-gray-400 tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">Usuario</th>
              <th className="px-8 py-4">Correo</th>
              <th className="px-8 py-4">Registro</th>
              <th className="px-8 py-4">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center overflow-hidden border border-sonoma-sage/10">
                    {u.photoURL ? <img src={u.photoURL} alt="" /> : <UserIcon className="w-5 h-5 text-sonoma-sage/40" />}
                  </div>
                  <span className="font-medium text-gray-700">{u.displayName}</span>
                </td>
                <td className="px-8 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-8 py-4 text-[10px] text-gray-400 uppercase font-mono">
                  {u.createdAt ? format(u.createdAt.toDate(), 'dd/MM/yyyy') : '-'}
                </td>
                <td className="px-8 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.hasPurchased ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                    {u.hasPurchased ? 'Comprador' : 'Visitante'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="py-20 text-center text-gray-300 font-serif italic">Aún no hay clientes registrados.</div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [wasSeeded, setWasSeeded] = useState(false);
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [prodSnap, orderSnap, userSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'users'))
      ]);
      setStats({
        products: prodSnap.size,
        orders: orderSnap.size,
        users: userSnap.size
      });
    };
    fetchStats();
  }, []);

  const seedData = async () => {
    setIsSeeding(true);
    try {
      const sampleProducts = [
        {
          name: 'Vestido Lino Sonoma',
          description: 'Vestido de lino premium en color salvia, corte minimalista y elegante.',
          price: 85.00,
          category: Category.ELEGANCIA,
          sizes: ['S', 'M', 'L'],
          colors: ['Verde Sage', 'Crema'],
          images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'],
          stock: 12,
          createdAt: serverTimestamp()
        },
        {
          name: 'Blusa Seda Minimal',
          description: 'Blusa de seda 100% natural, ideal para ocasiones casuales de lujo.',
          price: 45.00,
          category: Category.CASUAL,
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['Blanco', 'Negro'],
          images: ['https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800'],
          stock: 8,
          createdAt: serverTimestamp()
        },
        {
          name: 'Bolso Cuero Hemma',
          description: 'Bolso de mano en cuero genuino, hecho artesanalmente.',
          price: 120.00,
          category: Category.ACCESORIOS,
          sizes: ['Única'],
          colors: ['Marrón', 'Negro'],
          images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800'],
          stock: 5,
          createdAt: serverTimestamp()
        }
      ];

      for (const p of sampleProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      setWasSeeded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif italic text-sonoma-sage mb-8">Buenas tardes, Administrador</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="p-4 bg-sonoma-sage/10 text-sonoma-sage rounded-2xl">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-3xl font-serif font-bold">{stats.products}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Prendas Activas</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl">
            <ListOrdered className="w-8 h-8" />
          </div>
          <div>
            <p className="text-3xl font-serif font-bold">{stats.orders}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Pedidos Totales</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-3xl font-serif font-bold">{stats.users}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Clientes Reg.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-dashed border-sonoma-sage/20 text-center">
        <h3 className="font-serif italic text-xl mb-4">Configuración Inicial</h3>
        <p className="text-gray-400 text-sm mb-6">Si es la primera vez que entras, puedes cargar productos de ejemplo.</p>
        <button 
          onClick={seedData}
          disabled={isSeeding || wasSeeded}
          className="bg-sonoma-sage text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:scale-105"
        >
          {isSeeding ? 'Cargando...' : wasSeeded ? '¡Datos Cargados!' : 'Cargar Productos de Ejemplo'}
        </button>
      </div>
    </div>
  );
}

// --- Main Admin Wrapper ---

export default function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Simple admin check: developer email or check /admins collection
        const isDev = u.email === 'Arkoxys.spark@gmail.com';
        if (isDev) {
          setIsAdmin(true);
        } else {
          // Check firestore for admin record
          try {
            const adminDoc = await getDoc(doc(db, 'admins', u.uid));
            setIsAdmin(adminDoc.exists());
          } catch (e) {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sonoma-sage"></div>
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="bg-white p-12 rounded-[32px] shadow-2xl border border-sonoma-sage/10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-8">
            <UserIcon className="w-8 h-8 text-sonoma-sage" />
          </div>
          <h2 className="text-3xl font-serif italic mb-2">Panel Ejecutivo</h2>
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-10">Solo personal autorizado</p>
          
          <button 
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-100 hover:border-sonoma-sage py-4 rounded-xl transition-all shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            <span className="text-sm font-bold tracking-tight">Acceder con Google</span>
          </button>
          
          {user && !isAdmin && (
            <p className="mt-6 text-xs text-red-400 font-medium bg-red-50 p-4 rounded-lg">
              Lo sentimos, tu cuenta no tiene permisos de administrador.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <AdminSidebar user={user} />
      <div className="flex-1 overflow-y-auto h-screen">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/products" element={<ProductsManager />} />
          <Route path="/orders" element={<OrdersManager />} />
          <Route path="/customers" element={<CustomersManager />} />
        </Routes>
      </div>
    </div>
  );
}
