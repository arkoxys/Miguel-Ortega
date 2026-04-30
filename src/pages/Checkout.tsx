import React, { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, handleFirestoreError, OperationType, auth, loginWithGoogle } from '../services/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { Check, ArrowRight, Wallet, MapPin, Truck, Phone, Gift, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from '../types';

const ZONES = [
  { name: 'Zona A (Cerca de boutique)', cost: 2 },
  { name: 'Zona B (Municipio Norte)', cost: 4 },
  { name: 'Zona C (Municipio Sur)', cost: 5 },
  { name: 'Zona D (Área Metropolitana)', cost: 7 },
  { name: 'Pick-up en Tienda', cost: 0 },
];

const PAYMENT_METHODS = [
  { id: 'binance', name: 'Binance Pay (ID/QR)', icon: <Wallet className="w-5 h-5" /> },
  { id: 'pagomovil', name: 'Pago Móvil', icon: <Phone className="w-5 h-5" /> },
  { id: 'transferencia', name: 'Transferencia Bancaria', icon: <ArrowRight className="w-5 h-5" /> },
];

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    zone: ZONES[0].name,
    paymentMethod: 'binance'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        if (userSnap.exists()) {
          const profile = userSnap.data() as UserProfile;
          setCurrentUser(profile);
          // Pre-fill name if logged in and not manually typed
          setForm(prev => ({ ...prev, name: prev.name || profile.displayName }));
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingUser(false);
    });
    return unsub;
  }, []);

  const isEligibleForDiscount = currentUser && !currentUser.hasPurchased && subtotal >= 50;
  const discountAmount = isEligibleForDiscount ? subtotal * 0.10 : 0;
  const selectedZone = ZONES.find(z => z.name === form.zone) || ZONES[0];
  const deliveryCost = selectedZone.cost;
  const total = subtotal - discountAmount + deliveryCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const orderData = {
      userId: auth.currentUser?.uid || null,
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      customerZone: form.zone,
      items: cart,
      subtotal,
      discount: discountAmount,
      deliveryCost,
      total,
      paymentMethod: form.paymentMethod,
      status: 'pending',
      createdAt: serverTimestamp(),
      isFirstPurchase: isEligibleForDiscount
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      
      // Update user hasPurchased status if logged in
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          hasPurchased: true
        });
      }
      
      // WhatsApp Message Generation
      const itemsText = cart.map(item => `- ${item.name} (${item.size}/${item.color}) x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`).join('%0A');
      const discountText = isEligibleForDiscount ? `%0A*DESCUENTO 10% (1ra Compra):* -$${discountAmount.toFixed(2)}` : '';
      
      const message = `*NUEVO PEDIDO HEMMA*%0A%0A` +
        `*Cliente:* ${form.name}%0A` +
        `*Teléfono:* ${form.phone}%0A` +
        `*Dirección:* ${form.address} (${form.zone})%0A%0A` +
        `*Resumen:*%0A${itemsText}%0A${discountText}%0A%0A` +
        `*Subtotal:* $${subtotal.toFixed(2)}%0A` +
        `*Delivery:* $${deliveryCost.toFixed(2)}%0A` +
        `*TOTAL:* $${total.toFixed(2)}%0A%0A` +
        `*Método de Pago:* ${form.paymentMethod.toUpperCase()}%0A%0A` +
        `_Adjunto comprobante a continuación._`;

      const whatsappUrl = `https://wa.me/584120000000?text=${message}`;
      
      setOrderConfirmed(true);
      window.open(whatsappUrl, '_blank');
      clearCart();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-sonoma-sage rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-sonoma-sage/30">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-serif mb-4 italic text-sonoma-sage">¡Pedido Confirmado!</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
          Hemos enviado los detalles a WhatsApp. Por favor, adjunta tu comprobante de pago en el chat para procesar el envío.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-sonoma-sage text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest shadow-lg hover:opacity-90"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-5xl"
    >
      <h1 className="text-3xl font-serif mb-12 italic text-center">Checkout</h1>

      {!auth.currentUser && !loadingUser && (
        <div className="mb-12 bg-cream p-8 rounded-3xl border border-sonoma-sage/20 text-center">
          <Star className="w-8 h-8 text-sonoma-sage mx-auto mb-4" />
          <h3 className="font-serif text-xl mb-2 italic">Ahorra en tu primera compra</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Inicia sesión antes de pagar para recibir un <span className="text-sonoma-sage font-bold">10% de DESCUENTO</span> en compras mayores a $50.</p>
          <button 
            type="button"
            onClick={loginWithGoogle}
            className="flex items-center mx-auto space-x-3 bg-white border border-sonoma-sage/30 hover:border-sonoma-sage px-8 py-3 rounded-xl transition-all"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            <span className="text-sm font-bold uppercase tracking-widest">Iniciar Sesión</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Personal Details */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-serif mb-6 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-sonoma-sage" />
              <span>Información de Entrega</span>
            </h2>
            <div className="space-y-4">
              <input 
                required
                placeholder="Nombre Completo"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-sonoma-sage transition-colors shadow-sm"
              />
              <input 
                required
                type="tel"
                placeholder="Teléfono de Contacto"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-sonoma-sage transition-colors shadow-sm"
              />
              <textarea 
                required
                placeholder="Dirección Exacta (Punto de referencia)"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-sonoma-sage transition-colors shadow-sm h-32"
              />
              <div className="relative">
                <select 
                  value={form.zone}
                  onChange={e => setForm({...form, zone: e.target.value})}
                  className="w-full bg-white border-2 border-sonoma-sage/20 rounded-2xl px-6 py-4 outline-none focus:border-sonoma-sage transition-colors shadow-sm appearance-none cursor-pointer text-gray-700"
                >
                  {ZONES.map(z => (
                    <option key={z.name} value={z.name} className="bg-white text-gray-700">{z.name} - ${z.cost}</option>
                  ))}
                </select>
                <Truck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 pointer-events-none" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-serif mb-6 flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-sonoma-sage" />
              <span>Método de Pago Manual</span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({...form, paymentMethod: m.id})}
                  className={`flex items-center space-x-4 p-4 rounded-2xl border transition-all text-left ${
                    form.paymentMethod === m.id 
                    ? 'border-sonoma-sage bg-sonoma-sage/5 text-sonoma-sage shadow-md' 
                    : 'border-gray-100 bg-white text-gray-500 hover:border-sonoma-sage/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${form.paymentMethod === m.id ? 'bg-sonoma-sage text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {m.icon}
                  </div>
                  <span className="font-medium tracking-tight uppercase text-xs">{m.name}</span>
                </button>
              ))}
            </div>

            {/* Sub-panels for instructions */}
            <div className="mt-6 bg-cream border border-sonoma-sage/10 p-6 rounded-2xl text-sm">
              {form.paymentMethod === 'binance' && (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-center font-medium">Binance Pay ID: <span className="text-sonoma-sage">123456789</span></p>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG value="https://binance.com/pay?id=123456789" size={120} />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center px-4 uppercase tracking-widest">Escanea o usa el ID para realizar el pago</p>
                </div>
              )}
              {form.paymentMethod === 'pagomovil' && (
                <div className="space-y-2">
                  <p><strong>Banco:</strong> Banesco (0134)</p>
                  <p><strong>Cédula:</strong> V-12.345.678</p>
                  <p><strong>Teléfono:</strong> 0412-1234567</p>
                </div>
              )}
              {form.paymentMethod === 'transferencia' && (
                <div className="space-y-2">
                  <p><strong>Banco:</strong> Banesco (0134)</p>
                  <p><strong>Cuenta:</strong> 0134-0000-00-0000000000</p>
                  <p><strong>Nombre:</strong> Hemma Boutique C.A.</p>
                  <p><strong>RIF:</strong> J-12345678-9</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-sonoma-sage/10 sticky top-24">
            <h3 className="font-serif text-2xl mb-8 italic text-center">Tu Pedido</h3>
            <div className="space-y-4 mb-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.size} • {item.color} x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {isEligibleForDiscount && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-sm text-sonoma-sage font-bold bg-sonoma-sage/10 p-3 rounded-xl border border-sonoma-sage/20"
                >
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4" />
                    <span>Promo 1ra Compra</span>
                  </div>
                  <span>-${discountAmount.toFixed(2)}</span>
                </motion.div>
              )}

              <div className="flex justify-between text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <span>Delivery ({form.zone})</span>
                </span>
                <span>${deliveryCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-serif pt-4 border-t-2 border-sonoma-sage/20 font-bold text-sonoma-sage">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full mt-10 bg-sonoma-sage text-white py-6 rounded-full flex items-center justify-center space-x-3 shadow-2xl shadow-sonoma-sage/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="uppercase tracking-[0.3em] font-bold">
                {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
              </span>
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-[0.2em] px-4">
              Al confirmar, serás redirigido a WhatsApp para enviar el comprobante de pago.
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
