/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Home, Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider, useCart } from './CartContext';
import { auth, loginWithGoogle } from './services/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

// Lazy load pages for performance
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/Admin'));

function Navbar() {
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-sonoma-sage/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button onClick={() => setIsMenuOpen(true)} className="p-2 md:hidden">
          <Menu className="w-6 h-6" />
        </button>

        <Link to="/" className="text-2xl font-serif tracking-widest text-sonoma-sage font-bold">
          HEMMA
        </Link>

        <div className="hidden md:flex items-center space-x-12 text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">
          <Link to="/" className="hover:text-sonoma-sage transition-colors">Catálogo</Link>
          <Link to="/cart" className="hover:text-sonoma-sage transition-colors">Bolsa</Link>
          <Link to="/admin" className="hover:text-sonoma-sage transition-colors">Admin</Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="hidden md:flex items-center space-x-3 mr-2">
              <img src={user.photoURL || ''} className="w-7 h-7 rounded-full border border-sonoma-sage/10" alt="" />
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="hidden md:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-sonoma-sage mr-2 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          )}

          <Link to="/admin" className="hidden md:block">
            <LayoutDashboard className="w-5 h-5 text-gray-400 hover:text-sonoma-sage transition-colors" />
          </Link>
          <Link to="/cart" className="relative p-2">
            <ShoppingBag className="w-6 h-6 text-gray-600 hover:text-sonoma-sage" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-sonoma-sage text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 z-[60]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[70] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
                <span className="font-serif text-xl font-bold text-sonoma-sage">HEMMA</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X /></button>
              </div>

              {user ? (
                <div className="flex items-center space-x-3 mb-8 bg-cream/30 p-4 rounded-2xl border border-sonoma-sage/10">
                  <img src={user.photoURL || ''} className="w-10 h-10 rounded-full shadow-sm" alt="" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{user.displayName}</p>
                    <button onClick={() => auth.signOut()} className="text-[10px] text-sonoma-sage font-bold uppercase tracking-widest mt-1">Cerrar Sesión</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { loginWithGoogle(); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center space-x-3 bg-cream/30 p-4 rounded-2xl border border-sonoma-sage/10 mb-8 hover:bg-sonoma-sage/5 transition-colors"
                >
                  <User className="w-5 h-5 text-sonoma-sage" />
                  <span className="text-sm font-bold uppercase tracking-widest">Iniciar Sesión</span>
                </button>
              )}

              <div className="flex flex-col space-y-2 text-lg">
                <Link 
                  to="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-sonoma-sage/5 transition-colors flex items-center space-x-3"
                >
                  <Home className="w-5 h-5 text-sonoma-sage/40" />
                  <span>Catálogo</span>
                </Link>
                <Link 
                  to="/cart" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-sonoma-sage/5 transition-colors flex items-center space-x-3"
                >
                  <ShoppingBag className="w-5 h-5 text-sonoma-sage/40" />
                  <span>Mi Carrito</span>
                </Link>
                <Link 
                  to="/admin" 
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-sonoma-sage/5 transition-colors flex items-center space-x-3"
                >
                  <LayoutDashboard className="w-5 h-5 text-sonoma-sage/40" />
                  <span>Administración</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <main className="pt-16 min-h-screen">
      <Suspense fallback={
        <div className="h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sonoma-sage"></div>
        </div>
      }>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/*" element={<Admin />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen">
          <Navbar />
          <AnimatedRoutes />
          <footer className="bg-white border-t border-sonoma-sage/10 py-12 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-2xl font-serif text-sonoma-sage mb-4 italic">Hemma Boutique</h2>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Lujo Asequible • Calidad • Estilo</p>
              <div className="mt-8 text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Hemma. Todos los derechos reservados.
              </div>
            </div>
          </footer>
        </div>
      </CartProvider>
    </Router>
  );
}
