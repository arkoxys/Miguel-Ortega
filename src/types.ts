export enum Category {
  CASUAL = 'casual',
  ELEGANCIA = 'elegancia',
  ACCESORIOS = 'accesorios'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  createdAt?: any;
}

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerZone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: any;
  isFirstPurchase?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  hasPurchased: boolean;
  createdAt: any;
}

export interface Zone {
  name: string;
  cost: number;
}
