import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Check, Minus, Plus } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedPopup, setAddedPopup] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Product;
          setProduct({ id: docSnap.id, ...data });
          if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
          if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        }
      } catch (error) {
        console.error("Error fetching product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedPopup(true);
    setTimeout(() => setAddedPopup(false), 2000);
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sonoma-sage"></div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-serif">Producto no encontrado</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-sonoma-sage underline">Volver al catálogo</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-500 hover:text-sonoma-sage mb-8 group"
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm uppercase tracking-widest">Volver</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 shadow-sm">
            <img 
              src={product.images[0] || 'https://picsum.photos/seed/product/800/1200'} 
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-sonoma-sage/10 cursor-pointer">
                <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Details Column */}
        <div className="flex flex-col justify-center">
          <p className="text-sonoma-sage text-sm uppercase tracking-[0.3em] font-medium mb-2">
            {product.category}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">{product.name}</h1>
          <p className="text-2xl text-gray-800 mb-8 font-light">${product.price.toFixed(2)}</p>
          
          <div className="prose prose-sm text-gray-500 mb-10 max-w-none">
            {product.description || "Un diseño exclusivo pensado para resaltar tu elegancia natural. Hecho con los más altos estándares de calidad."}
          </div>

          <div className="space-y-8">
            {/* Size Selector */}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">Talla</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all text-sm font-medium ${
                      selectedSize === size 
                        ? 'bg-sonoma-sage border-sonoma-sage text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-sonoma-sage'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">Color</p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full border transition-all text-xs tracking-widest uppercase font-medium ${
                      selectedColor === color 
                        ? 'bg-[#2A2A2A] border-[#2A2A2A] text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-800'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">Cantidad</p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 space-x-6">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1 hover:text-sonoma-sage transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium w-4 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1 hover:text-sonoma-sage transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Stock disponible: {product.stock}
                </p>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-5 rounded-full flex items-center justify-center space-x-3 transition-all ${
                product.stock > 0 
                ? 'bg-sonoma-sage text-white shadow-xl shadow-sonoma-sage/20 hover:scale-[1.02] active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="uppercase tracking-[0.2em] font-bold">
                {product.stock > 0 ? 'Añadir al carrito' : 'Agotado'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addedPopup && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-sonoma-sage/20 px-8 py-4 rounded-full shadow-2xl z-50 flex items-center space-x-4"
          >
            <div className="bg-sonoma-sage p-1 rounded-full text-white">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-700">¡Producto añadido al carrito!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
