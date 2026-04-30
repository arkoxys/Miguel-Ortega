import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Product, Category } from '../types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'Todo', icon: null },
  { id: Category.CASUAL, name: 'Casual', img: 'https://picsum.photos/seed/casual/400/600' },
  { id: Category.ELEGANCIA, name: 'Elegancia', img: 'https://picsum.photos/seed/luxury/400/600' },
  { id: Category.ACCESORIOS, name: 'Accesorios', img: 'https://picsum.photos/seed/acc/400/600' },
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = activeCategory === 'all' 
          ? query(collection(db, 'products'), orderBy('createdAt', 'desc'))
          : query(collection(db, 'products'), where('category', '==', activeCategory), orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetched);
      } catch (error) {
        // Only show error if it's not because collection is empty
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Hero Section */}
      <section className="mb-12 relative h-[60vh] rounded-3xl overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" 
          alt="Boutique" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center p-6">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-serif mb-4 italic"
          >
            Lujo Consciente
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg uppercase tracking-[0.3em] font-light"
          >
            Nueva Colección Verano 2024
          </motion.p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mb-12">
        <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-8 py-3 rounded-full border transition-all shadow-sm ${
                activeCategory === cat.id 
                  ? 'bg-sonoma-sage border-sonoma-sage text-white shadow-sonoma-sage/20' 
                  : 'bg-white border-sonoma-sage/40 text-gray-700 hover:border-sonoma-sage'
              }`}
            >
              <span className="text-sm uppercase tracking-widest font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-sonoma-sage/30">
            <ShoppingBag className="w-12 h-12 text-sonoma-sage/30 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-500 italic">No hay prendas disponibles en esta categoría</h3>
            <p className="text-sm text-gray-400 mt-2">Estamos preparando lo mejor para ti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
            {products.map(product => (
              <Link 
                key={product.id} 
                to={`/product/${product.id}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-4 bg-gray-100 shadow-sm transition-all group-hover:shadow-md">
                  <img 
                    src={product.images[0] || 'https://picsum.photos/seed/product/800/1200'} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 h-8 px-3 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] uppercase tracking-widest font-bold shadow-sm">
                    {product.category}
                  </div>
                </div>
                <h3 className="font-serif text-lg text-gray-800 group-hover:text-sonoma-sage transition-colors">{product.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sonoma-sage font-medium">${product.price.toFixed(2)}</p>
                  <p className="text-[10px] uppercase text-gray-400 tracking-tighter">Stock: {product.stock}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Quote */}
      <section className="mt-24 py-16 border-t border-sonoma-sage/10 text-center">
        <p className="font-serif italic text-2xl text-sonoma-sage max-w-2xl mx-auto">
          "La elegancia no es darse a notar, sino ser recordado."
        </p>
      </section>
    </motion.div>
  );
}
