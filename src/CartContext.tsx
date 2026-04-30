import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('hemma-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hemma-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, size: string, color: string, quantity: number) => {
    setCart(prev => {
      // Check if item already exists with same size/color
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.size === size && item.color === color
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      }

      return [...prev, {
        productId: product.id,
        name: product.name,
        size,
        color,
        quantity,
        price: product.price,
        image: product.images[0] || 'https://picsum.photos/seed/hemma/400/600'
      }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
