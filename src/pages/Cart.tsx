import React from 'react';
import { useCart } from '../CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <h1 className="text-3xl font-serif mb-8 italic">Tu Selección de Estilo</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-sonoma-sage/30">
          <ShoppingBag className="w-16 h-16 text-sonoma-sage/20 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-gray-500 mb-6">Tu carrito está vacío</h2>
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 bg-sonoma-sage text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-transform hover:scale-105"
          >
            <span>Explorar Colección</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-6">
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div 
                  key={`${item.productId}-${item.size}-${item.color}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex bg-white p-4 rounded-2xl shadow-sm border border-sonoma-sage/10 relative"
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-24 h-32 object-cover rounded-xl"
                  />
                  <div className="ml-6 flex-1 pr-10">
                    <h3 className="font-serif text-lg leading-tight mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                      {item.size} • {item.color}
                    </p>
                    <div className="flex justify-between items-end">
                      <p className="text-sonoma-sage font-medium">${item.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary Column */}
          <div className="md:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-sonoma-sage/20 sticky top-24">
              <h3 className="font-serif text-xl mb-6 italic">Resumen</h3>
              <div className="space-y-4 text-sm mb-8">
                <div className="flex justify-between text-gray-500">
                  <span>Prendas ({totalItems})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 italic">
                  <span>Delivery</span>
                  <span>Calculado al pagar</span>
                </div>
                <div className="pt-4 border-t border-sonoma-sage/20 flex justify-between font-bold text-lg">
                  <span>Subtotal</span>
                  <span className="text-sonoma-sage">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-sonoma-sage text-white py-5 rounded-full flex items-center justify-center space-x-3 shadow-xl shadow-sonoma-sage/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="uppercase tracking-[0.2em] font-bold">Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center">
                <div className="flex space-x-4 grayscale opacity-50">
                  <span className="text-[10px] border border-gray-300 px-2 rounded tracking-tighter">BINANCE</span>
                  <span className="text-[10px] border border-gray-300 px-2 rounded tracking-tighter">ZELLE</span>
                  <span className="text-[10px] border border-gray-300 px-2 rounded tracking-tighter">PAGO MOVIL</span>
                </div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-4">Transacciones Seguras</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
