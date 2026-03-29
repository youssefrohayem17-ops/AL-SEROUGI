/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Home, 
  Store, 
  Phone, 
  Star, 
  ChevronLeft, 
  MapPin, 
  Facebook, 
  Instagram, 
  PhoneCall,
  Plus,
  Armchair,
  Sparkles,
  CheckCircle2,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Settings,
  LogOut,
  LogIn,
  Edit,
  Save,
  Image as ImageIcon,
  Type,
  DollarSign,
  PlusCircle,
  Loader2,
  Banknote
} from 'lucide-react';
import { 
  auth, 
  db, 
  storage,
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  Timestamp,
  handleFirestoreError,
  OperationType,
  ref,
  uploadBytes,
  getDownloadURL
} from './firebase';
import type { User } from './firebase';

// --- Types ---
interface Review {
  id: string;
  name: string;
  car: string;
  text: string;
  stars: number;
  initials: string;
  color: string;
}

interface Product {
  id: string;
  category: string;
  badge?: string;
  name: string;
  description: string;
  price: string;
  image: string;
  images: string[];
  colors: string[];
  createdAt?: any;
}

interface SiteSettings {
  id?: string;
  heroImage: string;
  logoText: string;
  logoSubtext: string;
  facebookUrl: string;
  whatsappNumber: string;
  instagramUrl: string;
  phoneNumber: string;
  location: string;
  locationUrl: string;
  paymentMethods: {
    id: string;
    name: string;
    icon: string;
    label: string;
    active: boolean;
  }[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  heroImage: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=1200',
  logoText: 'ال',
  logoSubtext: 'سروجي',
  facebookUrl: 'https://facebook.com',
  whatsappNumber: '201234567890',
  instagramUrl: 'https://instagram.com',
  phoneNumber: '01234567890',
  location: 'القاهرة، مصر',
  locationUrl: 'https://maps.google.com',
  paymentMethods: [
    { id: 'instapay', name: 'InstaPay', icon: 'instapay', label: 'InstaPay', active: true },
    { id: 'vodafone', name: 'فودافون كاش', icon: 'vodafone', label: 'فودافون كاش', active: true },
    { id: 'cash', name: 'دفع كاش', icon: 'cash', label: 'دفع كاش', active: true }
  ]
};

// --- Constants ---
const INITIAL_REVIEWS: Review[] = [
  {
    id: '1',
    name: 'أحمد مصطفى',
    car: 'تويوتا كامري 2022',
    text: 'شغل ممتاز جداً والخامة عالية جداً، المقاعد أحسن من الأصلي بكتير. ينصح بيه جداً وسعر معقول على الجودة دي.',
    stars: 5,
    initials: 'أح',
    color: '#C0392B'
  },
  {
    id: '2',
    name: 'محمود السيد',
    car: 'كيا سبورتاج 2021',
    text: 'ربنا يبارك في الأيادي، شغلهم نضيف ومتقن والتوصيل في الموعد. هيبقى معي طول عمري عميل عندهم.',
    stars: 5,
    initials: 'مح',
    color: '#8B1A1A'
  },
  {
    id: '3',
    name: 'خالد إبراهيم',
    car: 'هيونداي توسان 2023',
    text: 'أنا مش بشتري من مكان تاني خالص. من أول مرة اتعاملت مع السروجي والشغل بيتكلم عن نفسه. جودة لا مثيل لها.',
    stars: 5,
    initials: 'خا',
    color: '#922B21'
  }
];

const PRODUCTS: Product[] = [
  {
    id: '1',
    category: 'upholstery',
    badge: 'الأكثر طلباً',
    name: 'مقاعد جلد طبيعي',
    description: 'جلد أصلي فاخر، معالجة احترافية ضد التآكل والحرارة، متوفر بألوان كلاسيكية وعصرية.',
    price: '800 ج',
    image: 'https://images.unsplash.com/photo-1598558991659-56604f38e9ef?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1598558991659-56604f38e9ef?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#C0392B', '#8B4513', '#D2B48C']
  },
  {
    id: '2',
    category: 'upholstery',
    badge: 'جديد',
    name: 'مقاعد رياضية (سبورت)',
    description: 'تصميم عصري بخيوط بارزة وتدعيم جانبي لتوفير أقصى درجات الراحة والثبات أثناء القيادة.',
    price: '1200 ج',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#C0392B', '#2E86C1']
  },
  {
    id: '3',
    category: 'upholstery',
    badge: 'متميز',
    name: 'مقاعد مخملية فاخرة',
    description: 'مخمل ناعم وحشو ممتاز لأقصى راحة، مثالي للسيارات العائلية والرحلات الطويلة.',
    price: '950 ج',
    image: 'https://images.unsplash.com/photo-1617814076367-b757c7a72538?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1617814076367-b757c7a72538?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=75&w=600'],
    colors: ['#566573', '#1B2631', '#7B241C']
  },
  {
    id: '4',
    category: 'accessories',
    badge: 'إكسسوارات',
    name: 'سجاد أرضية مخصص',
    description: 'مقطوع بالقياس الدقيق لكل نوع سيارة، مقاوم للماء وسهل التنظيف، يحمي أرضية سيارتك.',
    price: '400 ج',
    image: 'https://images.unsplash.com/photo-1603584173870-7f3ca990466d?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1603584173870-7f3ca990466d?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#566573', '#D2B48C']
  },
  {
    id: '5',
    category: 'accessories',
    badge: 'تجديد',
    name: 'تغطية عجلة القيادة',
    description: 'خياطة يدوية احترافية لعجلة القيادة بجلد طبيعي أو ألكانتارا لملمس فخم وتحكم أفضل.',
    price: '300 ج',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#C0392B', '#8B4513']
  },
  {
    id: '6',
    category: 'upholstery',
    name: 'فرش أبواب جلد',
    description: 'تجديد كامل لأبواب السيارة بجلد فاخر وتطريز متناسق مع مقاعد السيارة.',
    price: '500 ج',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#C0392B', '#D2B48C']
  },
  {
    id: '7',
    category: 'accessories',
    name: 'منظم مقاعد خلفي',
    description: 'منظم عملي للمقاعد الخلفية لحفظ الأغراض والتابلت، مثالي للعائلات.',
    price: '150 ج',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#566573']
  },
  {
    id: '8',
    category: 'accessories',
    name: 'إضاءة داخلية LED',
    description: 'إضاءة محيطية ذكية للسيارة بألوان متعددة وتحكم عن طريق الموبايل.',
    price: '250 ج',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000']
  },
  {
    id: '9',
    category: 'upholstery',
    name: 'فرش سقف شامواه',
    description: 'تغطية سقف السيارة بخامة الشامواه الناعمة لإعطاء مظهر رياضي وفخم للمقصورة.',
    price: '700 ج',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#566573']
  },
  {
    id: '10',
    category: 'accessories',
    name: 'شاحن لاسلكي سريع',
    description: 'شاحن لاسلكي ذكي يثبت في فتحة التهوية أو التابلوه، يدعم الشحن السريع لجميع الموبايلات.',
    price: '450 ج',
    image: 'https://images.unsplash.com/photo-1586810165616-94c631fc2f79?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1586810165616-94c631fc2f79?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000']
  },
  {
    id: '11',
    category: 'upholstery',
    name: 'تجديد تابلوه السيارة',
    description: 'ترميم وتغطية التابلوه بجلد طبيعي أو صناعي عالي الجودة مع خياطة تجميلية.',
    price: '1500 ج',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#8B4513']
  },
  {
    id: '12',
    category: 'accessories',
    name: 'كاميرا داش كام 4K',
    description: 'كاميرا مراقبة أمامية وخلفية بدقة 4K لتسجيل رحلاتك وحماية سيارتك أثناء التوقف.',
    price: '2200 ج',
    image: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000']
  },
  {
    id: '13',
    category: 'upholstery',
    name: 'فرش مقاعد قماش فاخر',
    description: 'قماش عالي الجودة مقاوم للبقع والروائح، متوفر بنقشات متنوعة تناسب جميع الأذواق.',
    price: '600 ج',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=75&w=600'],
    colors: ['#566573', '#2E4053']
  },
  {
    id: '14',
    category: 'upholstery',
    name: 'تجديد مسند اليد',
    description: 'تغطية مسند اليد بجلد طبيعي مع حشوة مريحة لتجربة قيادة أفضل.',
    price: '200 ج',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600'],
    colors: ['#000000', '#8B4513']
  },
  {
    id: '15',
    category: 'accessories',
    name: 'معطر جو فاخر',
    description: 'معطر جو بتصميم أنيق وروائح فرنسية تدوم طويلاً داخل السيارة.',
    price: '80 ج',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=75&w=600',
    images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=75&w=600'],
    colors: ['#D4AC0D', '#7D3C98']
  },
  {
    id: '16',
    category: 'accessories',
    name: 'ستائر نوافذ مغناطيسية',
    description: 'ستائر تفصيل حسب نوع السيارة، سهلة التركيب والفك، تحمي من الشمس والخصوصية.',
    price: '350 ج',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    colors: ['#000000']
  }
];

const CATEGORIES = [
  { id: 'upholstery', label: 'فرش السيارة', icon: Armchair },
  { id: 'accessories', label: 'كماليات وإكسسوارات', icon: Sparkles }
];

const MARQUEE_ITEMS = [
  "مقاعد جلد فاخر", "سجاد مخملي", "خياطة يدوية", "تشطيب احترافي", "ضمان الجودة", "AL-SEROUGI"
];

// --- Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center p-6 text-center rtl" dir="rtl">
          <div className="max-w-md w-full bg-brand-dark p-8 rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={40} className="text-brand-red" />
            </div>
            <h2 className="text-2xl font-display font-black mb-4">عذراً، حدث خطأ ما!</h2>
            <p className="text-brand-muted text-sm mb-8 leading-relaxed">
              واجه التطبيق مشكلة تقنية غير متوقعة. يرجى محاولة إعادة تحميل الصفحة.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
            >
              إعادة تحميل الصفحة
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-black/50 rounded-lg text-left text-[10px] text-brand-red overflow-auto max-h-40">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: -20, x: '-50%' }}
      exit={{ opacity: 0, y: 50, x: '-50%' }}
      className={`fixed bottom-10 left-1/2 z-[3000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border backdrop-blur-md min-w-[300px] max-w-[90vw] ${
        type === 'success' ? 'bg-green-600/90 border-green-400/20 text-white' : 
        type === 'error' ? 'bg-brand-red/90 border-brand-red/20 text-white' : 
        'bg-brand-dark/90 border-white/10 text-white'
      }`}
    >
      {type === 'success' && <CheckCircle2 size={20} />}
      {type === 'error' && <X size={20} />}
      {type === 'info' && <Sparkles size={20} />}
      <span className="text-sm">{message}</span>
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-brand-black z-[5000] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-white/5 rounded-full"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-t-brand-red rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-black text-brand-red text-xl">S</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-display text-2xl font-black tracking-widest">السروجي</h2>
        <div className="flex gap-1">
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-brand-red rounded-full"></motion.div>
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-red rounded-full"></motion.div>
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-red rounded-full"></motion.div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activePage, setActivePage] = useState<'home' | 'about' | 'contact' | 'admin'>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCartFeedback, setShowCartFeedback] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const cartCount = cartItems.length;

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Check if user is admin (hardcoded for now as per instructions)
      if (u && u.email === 'youssefrohayem17@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const prods = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(prods);
      }
      setLoading(false);
      
      // If products are empty and user is admin, seed them automatically
      if (snapshot.empty && isAdmin) {
        seedInitialData();
      }
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Settings Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ id: snapshot.id, ...snapshot.data() } as SiteSettings);
      } else if (isAdmin) {
        // Initialize settings if admin is logged in and they don't exist
        setDoc(doc(db, 'settings', 'site'), DEFAULT_SETTINGS);
      }
    }, (error) => {
      console.error("Settings error:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const seedInitialData = async () => {
    const initialProds = [
      {
        id: 'p1',
        category: 'upholstery',
        badge: 'الأكثر طلباً',
        name: 'مقاعد جلد طبيعي',
        description: 'جلد أصلي فاخر، معالجة احترافية ضد التآكل والحرارة، متوفر بألوان كلاسيكية وعصرية.',
        price: '800 ج',
        image: 'https://images.unsplash.com/photo-1598558991659-56604f38e9ef?auto=format&fit=crop&q=75&w=600',
        images: ['https://images.unsplash.com/photo-1598558991659-56604f38e9ef?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=75&w=600'],
        colors: ['#000000', '#C0392B', '#8B4513', '#D2B48C'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p2',
        category: 'upholstery',
        badge: 'جديد',
        name: 'مقاعد رياضية (سبورت)',
        description: 'تصميم عصري بخيوط بارزة وتدعيم جانبي لتوفير أقصى درجات الراحة والثبات أثناء القيادة.',
        price: '1200 ج',
        image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=600',
        images: ['https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=75&w=600'],
        colors: ['#000000', '#C0392B', '#2E86C1'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p3',
        category: 'upholstery',
        badge: 'متميز',
        name: 'مقاعد مخملية فاخرة',
        description: 'مخمل ناعم وحشو ممتاز لأقصى راحة، مثالي للسيارات العائلية والرحلات الطويلة.',
        price: '950 ج',
        image: 'https://images.unsplash.com/photo-1617814076367-b757c7a72538?auto=format&fit=crop&q=75&w=600',
        images: ['https://images.unsplash.com/photo-1617814076367-b757c7a72538?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=75&w=600'],
        colors: ['#566573', '#1B2631', '#7B241C'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p4',
        category: 'accessories',
        badge: 'إكسسوارات',
        name: 'سجاد أرضية مخصص',
        description: 'مقطوع بالقياس الدقيق لكل نوع سيارة، مقاوم للماء وسهل التنظيف، يحمي أرضية سيارتك.',
        price: '400 ج',
        image: 'https://images.unsplash.com/photo-1603584173870-7f3ca990466d?auto=format&fit=crop&q=75&w=600',
        images: ['https://images.unsplash.com/photo-1603584173870-7f3ca990466d?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=75&w=600'],
        colors: ['#000000', '#566573', '#D2B48C'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p5',
        category: 'accessories',
        badge: 'تجديد',
        name: 'تغطية عجلة القيادة',
        description: 'خياطة يدوية احترافية لعجلة القيادة بجلد طبيعي أو ألكانتارا لملمس فخم وتحكم أفضل.',
        price: '300 ج',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600',
        images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=600', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=75&w=600'],
        colors: ['#000000', '#C0392B', '#8B4513'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p6',
        category: 'upholstery',
        name: 'فرش أبواب جلد',
        description: 'تجديد كامل لأبواب السيارة بجلد فاخر وتطريز متناسق مع مقاعد السيارة.',
        price: '500 ج',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000', '#C0392B', '#D2B48C'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p7',
        category: 'accessories',
        name: 'منظم مقاعد خلفي',
        description: 'منظم عملي للمقاعد الخلفية لحفظ الأغراض والتابلت، مثالي للعائلات.',
        price: '150 ج',
        image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000', '#566573'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p8',
        category: 'accessories',
        name: 'إضاءة داخلية LED',
        description: 'إضاءة محيطية ذكية للسيارة بألوان متعددة وتحكم عن طريق الموبايل.',
        price: '250 ج',
        image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p9',
        category: 'upholstery',
        name: 'فرش سقف شامواه',
        description: 'تغطية سقف السيارة بخامة الشامواه الناعمة لإعطاء مظهر رياضي وفخم للمقصورة.',
        price: '700 ج',
        image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000', '#566573'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p10',
        category: 'accessories',
        name: 'شاحن لاسلكي سريع',
        description: 'شاحن لاسلكي ذكي يثبت في فتحة التهوية أو التابلوه، يدعم الشحن السريع لجميع الموبايلات.',
        price: '450 ج',
        image: 'https://images.unsplash.com/photo-1586810165616-94c631fc2f79?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1586810165616-94c631fc2f79?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p11',
        category: 'upholstery',
        name: 'تجديد تابلوه السيارة',
        description: 'ترميم وتغطية التابلوه بجلد طبيعي أو صناعي عالي الجودة مع خياطة تجميلية.',
        price: '1500 ج',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000', '#8B4513'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p12',
        category: 'accessories',
        name: 'كاميرا داش كام 4K',
        description: 'كاميرا مراقبة أمامية وخلفية بدقة 4K لتسجيل رحلاتك وحماية سيارتك أثناء التوقف.',
        price: '2200 ج',
        image: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p13',
        category: 'upholstery',
        name: 'فرش مقاعد قماش فاخر',
        description: 'قماش عالي الجودة مقاوم للبقع والروائح، متوفر بنقشات متنوعة تناسب جميع الأذواق.',
        price: '600 ج',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
        colors: ['#566573', '#2E4053'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p14',
        category: 'upholstery',
        name: 'تجديد مسند اليد',
        description: 'تغطية مسند اليد بجلد طبيعي مع حشوة مريحة لتجربة قيادة أفضل.',
        price: '200 ج',
        image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000', '#8B4513'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p15',
        category: 'accessories',
        name: 'معطر جو فاخر',
        description: 'معطر جو بتصميم أنيق وروائح فرنسية تدوم طويلاً داخل السيارة.',
        price: '80 ج',
        image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800'],
        colors: ['#D4AC0D', '#7D3C98'],
        createdAt: Timestamp.now()
      },
      {
        id: 'p16',
        category: 'accessories',
        name: 'ستائر نوافذ مغناطيسية',
        description: 'ستائر تفصيل حسب نوع السيارة، سهلة التركيب والفك، تحمي من الشمس والخصوصية.',
        price: '350 ج',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
        images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
        colors: ['#000000'],
        createdAt: Timestamp.now()
      }
    ];

    try {
      for (const p of initialProds) {
        const { id, ...data } = p;
        await setDoc(doc(db, 'products', id), data);
      }
      // Feedback is handled by the dashboard's status message if triggered from there
      // or we can just log it. The dashboard will refresh via onSnapshot.
    } catch (e) {
      console.error("Error seeding data", e);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      if (userEmail === 'youssefrohayem17@gmail.com') {
        setToast({ message: "تم تسجيل الدخول كمسؤول بنجاح. يمكنك الآن رؤية لوحة التحكم في القائمة الجانبية وفي أسفل الصفحة.", type: 'success' });
      } else {
        setToast({ message: `تم تسجيل الدخول بحساب: ${userEmail}. هذا الحساب ليس لديه صلاحيات الإدارة.`, type: 'info' });
      }
    } catch (e) {
      console.error("Login failed", e);
      setToast({ message: "فشل تسجيل الدخول. تأكد من اتصال الإنترنت.", type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (activePage === 'admin') setActivePage('home');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  const handleShowPage = (page: 'home' | 'about' | 'contact' | 'admin') => {
    setActivePage(page);
    setIsDrawerOpen(false);
  };

  const addReview = (newReview: Omit<Review, 'id' | 'initials' | 'color'>) => {
    const reds = ['#C0392B', '#8B1A1A', '#922B21'];
    const color = reds[Math.floor(Math.random() * reds.length)];
    const initials = newReview.name.slice(0, 2);
    
    const review: Review = {
      ...newReview,
      id: Date.now().toString(),
      initials,
      color
    };
    
    setReviews([review, ...reviews]);
    setIsModalOpen(false);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => [...prev, product]);
    setSelectedProduct(null);
    setIsCartOpen(true); // Open cart immediately
    setShowCartFeedback(true);
    setTimeout(() => setShowCartFeedback(false), 3000);
  };

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen rtl" dir="rtl">
      {loading && <LoadingScreen />}
      
      {/* Toast System */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Cart Feedback Toast */}
      <AnimatePresence>
        {showCartFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-brand-red text-white px-6 py-3 rounded-full shadow-2xl z-[2001] flex items-center gap-2 font-bold"
          >
            <CheckCircle2 size={18} />
            تمت الإضافة للسلة بنجاح!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[var(--nav-h)] bg-brand-black/95 border-b border-white/5 backdrop-blur-xl z-[1000] flex items-center justify-between px-4">
        <button 
          className={`w-10 h-10 border border-brand-red/35 text-brand-white rounded-md flex flex-col items-center justify-center gap-1.5 transition-all active:bg-brand-red/12 ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          <span className={`block w-[18px] h-[1.5px] bg-brand-white rounded-sm transition-all duration-350 origin-center ${isDrawerOpen ? 'translate-y-[7.5px] rotate-45' : ''}`}></span>
          <span className={`block w-[18px] h-[1.5px] bg-brand-white rounded-sm transition-all duration-350 origin-center ${isDrawerOpen ? 'opacity-0 scale-x-0' : ''}`}></span>
          <span className={`block w-[18px] h-[1.5px] bg-brand-white rounded-sm transition-all duration-350 origin-center ${isDrawerOpen ? '-translate-y-[7.5px] -rotate-45' : ''}`}></span>
        </button>

        <button 
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none"
          onClick={() => handleShowPage('home')}
        >
          <span className="font-display text-xl font-black text-brand-white">
            {settings.logoText}<span className="text-brand-red">{settings.logoSubtext}</span>
          </span>
        </button>

        <button 
          className="relative bg-transparent border-none text-brand-white text-xl p-1.5 flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart size={24} />
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-brand-red text-white text-[10px] font-extrabold font-display w-4 h-4 rounded-full flex items-center justify-center border-1.5 border-brand-black"
              >
                {cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[998] backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div 
        className="fixed top-0 right-0 w-[min(78vw,290px)] h-full bg-brand-dark border-l border-white/5 z-[999] flex flex-col overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: isDrawerOpen ? 0 : '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between min-h-[var(--nav-h)]">
          <div className="font-display text-lg font-black">{settings.logoText}<span className="text-brand-red">{settings.logoSubtext}</span></div>
          <button className="bg-transparent border-none text-brand-muted text-xl cursor-pointer w-8 h-8 flex items-center justify-center" onClick={() => setIsDrawerOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="py-3 flex-1">
          <DrawerLink 
            active={activePage === 'home'} 
            onClick={() => handleShowPage('home')} 
            icon={<Home size={18} />} 
            label="الرئيسية" 
          />
          <div className="h-px bg-white/5 mx-6 my-1"></div>
          <DrawerLink 
            active={activePage === 'about'} 
            onClick={() => handleShowPage('about')} 
            icon={<Store size={18} />} 
            label="من نحن" 
          />
          <div className="h-px bg-white/5 mx-6 my-1"></div>
          <DrawerLink 
            active={activePage === 'contact'} 
            onClick={() => handleShowPage('contact')} 
            icon={<Phone size={18} />} 
            label="تواصل معنا" 
          />
          {isAdmin && (
            <>
              <div className="h-px bg-white/5 mx-6 my-1"></div>
              <DrawerLink 
                active={activePage === 'admin'} 
                onClick={() => handleShowPage('admin')} 
                icon={<Settings size={18} />} 
                label="لوحة التحكم" 
              />
            </>
          )}
        </nav>
        <div className="p-5 border-t border-white/5 text-[11px] text-brand-muted text-center leading-relaxed">
          السروجي · AL-SEROUGI<br />مفروشات السيارات الفاخرة
        </div>
      </motion.div>

      {isAdmin && activePage !== 'admin' && (
        <div className="fixed top-[var(--nav-h)] left-0 w-full bg-brand-red text-white text-[10px] font-bold py-1 px-4 z-[90] flex justify-between items-center shadow-lg">
          <span>وضع المسؤول نشط</span>
          <button onClick={() => handleShowPage('admin')} className="underline">فتح لوحة التحكم</button>
        </div>
      )}

      {/* Main Content */}
      <main className={`pt-[var(--nav-h)] min-h-screen ${isAdmin && activePage !== 'admin' ? 'mt-6' : ''}`}>
        {activePage === 'home' && <HomePage onNavigate={handleShowPage} onSelectProduct={setSelectedProduct} products={products} loading={loading} settings={settings} />}
        {activePage === 'about' && <AboutPage onOpenModal={() => setIsModalOpen(true)} reviews={reviews} settings={settings} />}
        {activePage === 'contact' && <ContactPage settings={settings} />}
        {activePage === 'admin' && isAdmin && <AdminDashboard products={products} settings={settings} onSeed={seedInitialData} />}
        
        <PaymentMethods user={user} isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} onNavigate={handleShowPage} settings={settings} />
      </main>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAddToCart={() => handleAddToCart(selectedProduct)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer 
            items={cartItems} 
            onClose={() => setIsCartOpen(false)} 
            onRemove={removeFromCart} 
            settings={settings}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ReviewModal 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={addReview} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function DrawerLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      className={`flex items-center gap-3.5 px-6 py-4 w-full text-right font-display font-bold transition-all border-r-3 ${active ? 'bg-brand-red/10 border-brand-red text-brand-red' : 'bg-transparent border-transparent text-brand-white'}`}
      onClick={onClick}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}

function HomePage({ onNavigate, onSelectProduct, products, loading, settings }: { onNavigate: (page: 'home' | 'about' | 'contact' | 'admin') => void, onSelectProduct: (p: Product) => void, products: Product[], loading: boolean, settings: SiteSettings }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : products;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page active"
    >
      <section className="hero min-h-[45vh] relative overflow-hidden flex flex-col justify-center bg-brand-black">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={settings.heroImage} 
            className="w-full h-full object-cover opacity-60" 
            alt="Hero" 
            referrerPolicy="no-referrer"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-black/40 via-brand-black/60 to-brand-black"></div>
        </div>
        <div className="relative z-10 px-6 py-12">
          <div className="mb-6">
            <h1 className="font-display text-6xl font-black text-white tracking-tighter">
              {settings.logoText}<span className="text-brand-red">{settings.logoSubtext}</span>
            </h1>
            <div className="h-1 w-20 bg-brand-red mt-2"></div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl inline-block max-w-[320px] shadow-2xl">
            <p className="text-sm text-brand-white/90 leading-relaxed font-sans">
              نقدم أرقى خامات الجلد وأحدث تصميمات، بحرفية عالية وضمان طويل الأمد.
            </p>
            <div className="flex gap-3 mt-6">
              <button className="bg-brand-red text-white px-6 py-2 text-sm font-bold rounded-full active:scale-95 transition-all" onClick={() => onNavigate('about')}>
                اعرف أكتر
              </button>
              <button className="border border-white/10 text-white px-6 py-2 text-sm font-bold rounded-full active:bg-white/5 transition-all" onClick={() => onNavigate('contact')}>
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="px-5 py-4">
        <BeforeAfterSlider />
      </div>

      <div className="h-0.5 bg-brand-gradient w-full opacity-80 shadow-[0_0_10px_rgba(192,57,43,0.3)]"></div>

      {/* Featured Section (Always visible) */}
      <section className="p-5">
        <div className="flex flex-col items-center mb-12">
          <div className="h-px w-16 bg-brand-red/40 mb-4"></div>
          <h2 className="font-display font-black text-5xl text-brand-white tracking-widest uppercase text-center">المنتجات</h2>
          <div className="text-[10px] text-brand-red font-bold tracking-[0.4em] uppercase mt-3">Our Collection</div>
          <div className="h-px w-16 bg-brand-red/40 mt-4"></div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="animate-spin text-brand-red" size={40} />
            <p className="font-bold">جاري تحميل المنتجات...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {products.slice(0, 5).map(prod => (
              <ProductCard key={prod.id} product={prod} onClick={() => onSelectProduct(prod)} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Filter Section */}
      <section className="p-5 pt-0">
        <div className="flex flex-col gap-6 mb-10">
          <div className="font-display text-sm font-bold tracking-[0.2em] uppercase text-brand-red/60 text-center">تصفح الأقسام</div>
          
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.id ? null : cat.id)}
                className={`group relative flex flex-col items-center justify-center p-8 rounded-3xl transition-all duration-500 overflow-hidden ${
                  selectedCategory === cat.id 
                    ? 'bg-brand-red text-white shadow-[0_20px_40px_rgba(192,57,43,0.2)]' 
                    : 'bg-brand-dark border border-white/5 text-brand-white hover:border-brand-red/30'
                }`}
              >
                {/* Decorative background circle */}
                <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full transition-all duration-500 ${
                  selectedCategory === cat.id ? 'bg-white/10 scale-150' : 'bg-brand-red/5 group-hover:bg-brand-red/10'
                }`}></div>

                <span className={`mb-3 transition-transform duration-500 group-hover:scale-110 ${
                  selectedCategory === cat.id ? 'text-white' : 'text-brand-red'
                }`}>
                   {React.createElement(cat.icon as any, { size: 32, strokeWidth: 1.2 })}
                </span>
                <span className="text-xs font-black tracking-widest uppercase">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory || 'all'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            {filteredProducts.map(prod => (
              <motion.div 
                layout
                key={prod.id} 
                className="bg-brand-dark border border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.96] h-full shadow-lg hover:border-brand-red/20"
                onClick={() => onSelectProduct(prod)}
                whileTap={{ scale: 0.96 }}
              >
                  <div className="aspect-[4/5] w-full relative">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {prod.badge && (
                      <div className="absolute top-3 right-3 bg-brand-red text-white text-[9px] font-black px-2 py-1 rounded-md shadow-xl backdrop-blur-md">
                        {prod.badge}
                      </div>
                    )}
                  </div>
                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-display font-bold mb-1 text-[13px] leading-tight">{prod.name}</h3>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-brand-red font-display font-black text-sm">{prod.price}</div>
                        <div className="w-6 h-6 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                          <Plus size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                </motion.div>
              ))}
            </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );
}

const ProductCard: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
  return (
    <motion.div 
      className="bg-brand-dark border border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.98] shadow-2xl group"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className="h-56 w-full relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent opacity-60"></div>
        {product.badge && (
          <div className="absolute top-4 right-4 bg-brand-red text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md">
            {product.badge}
          </div>
        )}
      </div>
      <div className="p-5 flex justify-between items-end">
        <div className="flex-1">
          <h3 className="font-display text-xl font-black mb-1.5">{product.name}</h3>
          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed max-w-[80%]">{product.description}</p>
        </div>
        <div className="text-left">
          <div className="text-brand-red font-display text-lg font-black">{product.price}</div>
          <div className="text-[10px] text-brand-muted font-bold mt-1">عرض التفاصيل</div>
        </div>
      </div>
    </motion.div>
  );
};

function CartDrawer({ items, onClose, onRemove, settings }: { items: Product[], onClose: () => void, onRemove: (i: number) => void, settings: SiteSettings }) {
  const total = items.length;

  const handleCheckout = () => {
    const phone = settings.whatsappNumber;
    const message = `مرحباً ${settings.logoText}${settings.logoSubtext}، أود طلب المنتجات التالية:\n${items.map((item, i) => `${i + 1}- ${item.name} (${item.price})`).join('\n')}\n\nالإجمالي: ${items.length} منتجات`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex justify-end backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        className="bg-brand-dark w-full max-w-[400px] h-full border-r border-white/10 flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-brand-red" size={24} />
            <h2 className="font-display text-xl font-black">سلة التسوق</h2>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
              <ShoppingBag size={64} strokeWidth={1} />
              <p className="font-display font-bold">السلة فارغة حالياً</p>
              <button 
                className="text-brand-red text-sm font-bold underline underline-offset-4"
                onClick={onClose}
              >
                ابدأ التسوق الآن
              </button>
            </div>
          ) : (
            items.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={`${item.id}-${i}`} 
                className="bg-brand-dark2 border border-white/5 p-3 rounded-xl flex gap-4 items-center"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{item.name}</h4>
                  <div className="text-brand-red font-black text-xs mt-1">{item.price}</div>
                </div>
                <button 
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center active:bg-red-500/20"
                  onClick={() => onRemove(i)}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-brand-black/50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-brand-muted font-bold">عدد المنتجات</span>
              <span className="font-display font-black text-xl">{total}</span>
            </div>
            <button 
              className="w-full bg-brand-red text-white font-display font-black py-4 rounded-xl shadow-xl shadow-brand-red/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              onClick={handleCheckout}
            >
              إتمام الطلب عبر واتساب
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Stat({ n, l }: { n: string, l: string }) {
  return (
    <div className="flex-1 text-center border-l border-white/7 last:border-l-0">
      <div className="font-display text-2xl font-black text-brand-red leading-none">{n}</div>
      <div className="text-[11px] text-brand-muted mt-1">{l}</div>
    </div>
  );
}

function AboutPage({ onOpenModal, reviews, settings }: { onOpenModal: () => void, reviews: Review[], settings: SiteSettings }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page"
    >
      <div className="p-5 pb-4 bg-gradient-to-b from-brand-red-dark/8 to-transparent border-b border-brand-red/12">
        <div className="inline-block bg-brand-red/12 border border-brand-red/25 text-brand-red text-[11px] tracking-[0.2em] uppercase px-2.5 py-1 mb-3">من نحن</div>
        <h2 className="font-display text-3xl font-black leading-tight mb-4">{settings.logoText}<br /><span className="text-brand-red">{settings.logoSubtext}</span> بيتكلم عن نفسه</h2>
        <p className="text-sm text-brand-white/88 leading-loose">في السروجي، الخبرة هي اللي بتتكلم. مش مجرد مكان لفرش السيارات، إحنا وجهتك الأولى لما تدور على أعلى جودة وأدق تقفيل.</p>
      </div>

      <div className="flex flex-col gap-px bg-brand-dark3">
        <AboutFeature n="01" t="خبرة سنين" p="فاهمين احتياج كل صاحب عربية وبنقدم له اللي يعيش معاه." />
        <AboutFeature n="02" t="جودة حقيقية" p="بنختار خاماتنا بعناية عشان نضمن لك الرفاهية والحماية الكاملة." />
        <AboutFeature n="03" t="ثقة متبادلة" p="اسمنا ارتبط بالأمانة في الشغل، وده اللي بيخلي عملائنا دايمًا يختارونا." />
      </div>

      <p className="p-5 text-sm text-brand-white/75 leading-loose italic border-y border-white/5 bg-brand-red/3">
        باختصار.. إحنا بنهتم بعربيتك كأنها عربيتنا، وبنقدم لك النتيجة اللي تليق بذوقك وتعيش معاك.
      </p>

      <div className="p-6 pb-3.5 flex justify-between items-center">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-brand-red mb-1">آراء العملاء</div>
          <div className="font-display text-2xl font-black leading-tight">قالوا عنا</div>
        </div>
        <button 
          className="flex items-center gap-1.5 bg-brand-red/10 border border-brand-red/28 text-brand-red font-sans text-xs font-bold px-3.5 py-1.5 cursor-pointer rounded-sm transition-all active:bg-brand-red/20"
          onClick={onOpenModal}
        >
          <Plus size={16} strokeWidth={3} /> أضف رأيك
        </button>
      </div>

      <div className="flex flex-col gap-px bg-brand-dark3">
        {reviews.map(rv => (
          <div key={rv.id} className="bg-brand-dark p-5 relative odd:bg-brand-dark2">
            <div className="absolute top-3.5 left-4 text-5xl text-brand-red/8 font-serif leading-none pointer-events-none">"</div>
            <div className="text-brand-red text-sm tracking-widest mb-2.5">{'★'.repeat(rv.stars)}</div>
            <p className="text-sm text-brand-white/82 leading-relaxed mb-3.5 italic">{rv.text}</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-extrabold flex-shrink-0 text-white" style={{ backgroundColor: rv.color }}>
                {rv.initials}
              </div>
              <div>
                <div className="text-[13px] font-bold">{rv.name}</div>
                <div className="text-[11px] text-brand-muted mt-0.5">{rv.car}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AboutFeature({ n, t, p }: { n: string, t: string, p: string }) {
  return (
    <div className="bg-brand-dark p-5 flex gap-3.5 items-start odd:bg-brand-dark2">
      <div className="font-display text-2xl font-black text-brand-red/20 leading-none flex-shrink-0 w-7">{n}</div>
      <div>
        <div className="font-display text-base font-extrabold mb-1">{t}</div>
        <div className="text-[13px] text-brand-muted leading-relaxed">{p}</div>
      </div>
    </div>
  );
}

function ContactPage({ settings }: { settings: SiteSettings }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page p-5 pb-12"
    >
      <div className="text-[11px] tracking-[0.22em] uppercase text-brand-red mb-1">تواصل معنا</div>
      <h2 className="font-display text-3xl font-black mb-1">كلمنا على<br /><span className="text-brand-red">طول</span></h2>
      <p className="text-sm text-brand-muted leading-relaxed mb-7">عايز تعرف أكتر أو تعمل طلب؟ إحنا هنا عشانك على كل المنصات.</p>

      <div className="flex flex-col gap-px bg-brand-dark3 mb-8">
        <ContactLink 
          href={settings.facebookUrl} 
          icon={<Facebook size={22} color="#1877F2" />} 
          name="فيسبوك" 
          val={`${settings.logoText}${settings.logoSubtext} - Facebook`} 
          className="fb"
          iconBg="bg-[#1877F2]/15"
        />
        <ContactLink 
          href={settings.instagramUrl} 
          icon={<Instagram size={22} color="#E4405F" />} 
          name="إنستجرام" 
          val={`${settings.logoText}${settings.logoSubtext} - Instagram`} 
          className="ig"
          iconBg="bg-[#E4405F]/15"
        />
        <ContactLink 
          href={`https://wa.me/${settings.whatsappNumber}`} 
          icon={<div className="text-[#25D366] text-xl">💬</div>} 
          name="واتساب" 
          val={settings.whatsappNumber} 
          className="wa"
          iconBg="bg-[#25D366]/15"
        />
        <ContactLink 
          href={`tel:${settings.phoneNumber}`} 
          icon={<PhoneCall size={20} color="#C0392B" />} 
          name="اتصل بنا" 
          val={settings.phoneNumber} 
          className="ph"
          iconBg="bg-brand-red/15"
        />
      </div>

      <div className="text-[11px] tracking-[0.22em] uppercase text-brand-red mb-2">موقعنا</div>
      <a 
        href={settings.locationUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full h-[140px] bg-brand-dark2 border border-white/7 rounded-lg flex flex-col items-center justify-center gap-1.5 text-brand-muted text-sm active:bg-brand-dark transition-colors"
      >
        <MapPin size={30} className="text-brand-red" />
        <div className="font-bold text-brand-white">{settings.location}</div>
        <div className="text-[11px]">اضغط لفتح الخريطة</div>
      </a>
    </motion.div>
  );
}

function ContactLink({ href, icon, name, val, className, iconBg }: { href: string, icon: React.ReactNode, name: string, val: string, className: string, iconBg: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`bg-brand-dark flex items-center gap-3.5 p-4.5 transition-all active:brightness-110 odd:bg-brand-dark2 ${className}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className="font-display text-base font-extrabold mb-0.5">{name}</div>
        <div className="text-xs text-brand-muted">{val}</div>
      </div>
      <ChevronLeft size={18} className="mr-auto text-brand-muted" />
    </a>
  );
}

function ReviewModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (review: { name: string, car: string, text: string, stars: number }) => void }) {
  const [name, setName] = useState('');
  const [car, setCar] = useState('');
  const [text, setText] = useState('');
  const [stars, setStars] = useState(5);

  const handleSubmit = () => {
    if (!name.trim() || !text.trim()) {
      // We can't use alert here, so we'll just return. 
      // Ideally the UI should show validation errors.
      return;
    }
    onSubmit({ name, car, text, stars });
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[2000] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        className="bg-brand-dark w-full max-w-[500px] rounded-t-[18px] border-t border-white/10 p-5 pb-11"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-5"></div>
        <div className="font-display text-lg font-black mb-5">أضف <span className="text-brand-red">رأيك</span> 🌟</div>

        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-brand-muted mb-1.5 tracking-wider">اسمك</label>
          <input 
            type="text" 
            className="w-full bg-brand-dark2 border border-white/8 text-brand-white font-sans text-sm p-2.5 rounded outline-none focus:border-brand-red/50 transition-all text-right" 
            placeholder="مثال: أحمد محمد"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-brand-muted mb-1.5 tracking-wider">نوع عربيتك (اختياري)</label>
          <input 
            type="text" 
            className="w-full bg-brand-dark2 border border-white/8 text-brand-white font-sans text-sm p-2.5 rounded outline-none focus:border-brand-red/50 transition-all text-right" 
            placeholder="مثال: تويوتا كورولا 2023"
            value={car}
            onChange={e => setCar(e.target.value)}
          />
        </div>

        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-brand-muted mb-1.5 tracking-wider">تقييمك</label>
          <div className="flex gap-1 flex-row-reverse justify-end">
            {[5, 4, 3, 2, 1].map(v => (
              <button 
                key={v}
                className={`bg-transparent border-none text-2xl cursor-pointer transition-all active:scale-125 p-0.5 ${v <= stars ? 'text-brand-red' : 'text-brand-gray'}`}
                onClick={() => setStars(v)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-brand-muted mb-1.5 tracking-wider">رأيك في السروجي</label>
          <textarea 
            className="w-full bg-brand-dark2 border border-white/8 text-brand-white font-sans text-sm p-2.5 rounded outline-none focus:border-brand-red/50 transition-all text-right min-h-[85px] resize-y" 
            placeholder="اكتب تجربتك معنا..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        <button 
          className="w-full bg-brand-red text-white border-none p-3.5 font-display text-base font-black cursor-pointer rounded mt-1 transition-all active:bg-[#a93226] active:scale-[0.98]"
          onClick={handleSubmit}
        >
          نشر الرأي ✓
        </button>
      </motion.div>
    </div>
  );
}

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, position)));
  };

  return (
    <div className="relative group p-1 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden max-w-xl mx-auto">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[16/7] rounded-[1.8rem] overflow-hidden cursor-ew-resize select-none"
        onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
        onTouchMove={handleMove}
        onMouseDown={handleMove}
      >
        {/* After State (New/Clean) */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=75&w=800" 
            alt="بعد التجديد" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white border border-white/10">
            بعد التجديد
          </div>
        </div>

        {/* Before State (Old/Worn) */}
        <div 
          className="absolute inset-0 z-10"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img 
            src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=75&w=800" 
            alt="قبل التجديد" 
            className="w-full h-full object-cover grayscale brightness-75"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-white border border-white/10">
            قبل التجديد
          </div>
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white z-20 flex items-center justify-center transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-10 h-10 bg-white backdrop-blur-xl rounded-full shadow-[0_0_30px_rgba(0,0,0,0.3)] flex items-center justify-center -ml-0.5 border-4 border-brand-black/20">
            <div className="flex gap-1">
              <div className="w-0.5 h-4 bg-brand-black/40 rounded-full"></div>
              <div className="w-0.5 h-4 bg-brand-black/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethods({ user, isAdmin, onLogin, onLogout, onNavigate, settings }: { user: any, isAdmin: boolean, onLogin: () => void, onLogout: () => void, onNavigate: (page: any) => void, settings: SiteSettings }) {
  const activeMethods = settings.paymentMethods.filter(pm => pm.active);

  return (
    <div className="p-8 border-t border-white/5 bg-brand-black flex flex-col items-center gap-4">
      <div className="text-[10px] tracking-[0.2em] uppercase text-brand-muted font-bold">طرق الدفع</div>
      <div className="flex items-center gap-6">
        {activeMethods.map(pm => (
          <div key={pm.id} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center p-1.5 shadow-lg ${
              pm.id === 'instapay' ? 'bg-white shadow-white/5' : 
              pm.id === 'vodafone' ? 'bg-[#E60000] shadow-red-600/20' : 
              'bg-[#27AE60] shadow-green-600/20'
            }`}>
              {pm.id === 'instapay' && <img src="https://www.instapay.eg/assets/images/logo.png" alt="InstaPay" className="w-full object-contain" referrerPolicy="no-referrer" />}
              {pm.id === 'vodafone' && <div className="text-white font-black text-[8px] text-center leading-tight">VODAFONE<br/>CASH</div>}
              {pm.id === 'cash' && <Banknote className="text-white" size={24} />}
            </div>
            <span className="text-[8px] font-bold text-white/50">{pm.label}</span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="text-[9px] text-brand-muted">© {new Date().getFullYear()} {settings.logoText}{settings.logoSubtext} للفرش الفاخر. جميع الحقوق محفوظة.</div>
        
        <div className="flex gap-4">
          {user ? (
            <>
              {isAdmin && (
                <button onClick={() => onNavigate('admin')} className="text-[10px] text-brand-red font-bold hover:underline transition-all">فتح لوحة التحكم</button>
              )}
              <button onClick={onLogout} className="text-[8px] text-white/10 hover:text-brand-red transition-colors">تسجيل خروج ({user.email})</button>
            </>
          ) : (
            <button onClick={onLogin} className="text-[8px] text-white/10 hover:text-brand-red transition-colors">دخول الإدارة</button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ products, settings, onSeed }: { products: Product[], settings: SiteSettings, onSeed: () => void }) {
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: '',
    image: '',
    description: '',
    category: 'upholstery',
    badge: ''
  });

  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData(p);
    setIsAdding(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'product' | 'hero' = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `${target === 'product' ? 'products' : 'site'}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      if (target === 'product') {
        setFormData(prev => ({ ...prev, image: url }));
      } else {
        setSettingsForm(prev => ({ ...prev, heroImage: url }));
      }
    } catch (error) {
      console.error("Upload failed", error);
      setStatusMessage({ text: "فشل رفع الصورة. حاول مرة أخرى.", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          ...formData,
          images: [formData.image || ''] // Sync main image to gallery for simplicity
        });
        setEditingId(null);
        setStatusMessage({ text: 'تم تحديث المنتج بنجاح', type: 'success' });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          images: [formData.image || ''],
          colors: ['#000000'],
          createdAt: Timestamp.now()
        });
        setIsAdding(false);
        setStatusMessage({ text: 'تم إضافة المنتج بنجاح', type: 'success' });
      }
      setFormData({ name: '', price: '', image: '', description: '', category: 'upholstery', badge: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'products');
      setStatusMessage({ text: 'فشل في حفظ المنتج', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setStatusMessage({ text: 'تم حذف المنتج بنجاح', type: 'success' });
      setShowDeleteConfirm(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'products');
      setStatusMessage({ text: 'فشل في حذف المنتج', type: 'error' });
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), settingsForm);
      setStatusMessage({ text: 'تم حفظ الإعدادات بنجاح', type: 'success' });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings');
      setStatusMessage({ text: 'فشل في حفظ الإعدادات', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const togglePaymentMethod = (id: string) => {
    setSettingsForm(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(pm => 
        pm.id === id ? { ...pm, active: !pm.active } : pm
      )
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page p-5 pb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-black">لوحة <span className="text-brand-red">التحكم</span></h2>
          <p className="text-xs text-brand-muted mt-1">إدارة المنتجات وإعدادات الموقع</p>
        </div>
      </div>

      {statusMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 text-xs font-bold text-center ${statusMessage.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-brand-red/20 text-brand-red border border-brand-red/30'}`}
        >
          {statusMessage.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-brand-dark p-1 rounded-xl border border-white/5">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-brand-red text-white shadow-lg' : 'text-brand-muted hover:text-white'}`}
        >
          المنتجات
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-red text-white shadow-lg' : 'text-brand-muted hover:text-white'}`}
        >
          الإعدادات
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-brand-muted uppercase tracking-widest">إدارة المنتجات</h3>
            <div className="flex gap-2">
              <button 
                onClick={onSeed}
                className="bg-brand-muted/10 text-brand-muted p-3 rounded-xl hover:bg-brand-muted/20 transition-all flex items-center gap-2 text-[10px] font-bold"
                title="استعادة الـ 16 منتجاً الأصلية"
              >
                <PlusCircle size={16} />
                استعادة الأصلي
              </button>
              <button 
                onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', price: '', image: '', description: '', category: 'upholstery', badge: '' }); }}
                className="bg-brand-red text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                <PlusCircle size={24} />
              </button>
            </div>
          </div>

          {(isAdding || editingId) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-dark2 border border-brand-red/30 p-6 rounded-2xl mb-10 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-6 text-brand-red">
                {editingId ? <Edit size={20} /> : <PlusCircle size={20} />}
                <h3 className="font-bold">{editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-brand-muted">اسم المنتج</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-brand-dark border border-white/10 p-3 pl-10 rounded-xl outline-none focus:border-brand-red transition-all"
                      placeholder="مثال: مقاعد جلد فاخر"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">السعر</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                      <input 
                        type="text" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-brand-dark border border-white/10 p-3 pl-10 rounded-xl outline-none focus:border-brand-red transition-all"
                        placeholder="800 ج"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted">القسم</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all appearance-none"
                    >
                      <option value="upholstery">فرش السيارة</option>
                      <option value="accessories">كماليات</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-brand-muted">صورة المنتج</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                      <input 
                        type="text" 
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        className="w-full bg-brand-dark border border-white/10 p-3 pl-10 rounded-xl outline-none focus:border-brand-red transition-all text-xs"
                        placeholder="رابط الصورة (URL)"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'product')}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label 
                        htmlFor="product-image-upload"
                        className={`w-full bg-white/5 border border-dashed border-white/20 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all text-xs font-bold ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            جاري الرفع...
                          </>
                        ) : (
                          <>
                            <PlusCircle size={16} />
                            رفع صورة من الجهاز
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-2 h-24 w-24 rounded-lg overflow-hidden border border-white/10 relative group">
                      <img src={formData.image} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setFormData({...formData, image: ''})}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-brand-muted">الوصف</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all min-h-[80px]"
                    placeholder="تفاصيل المنتج..."
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-brand-red text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Save size={18} />
                    حفظ التعديلات
                  </button>
                  <button 
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="flex-1 bg-white/5 text-white py-4 rounded-xl font-bold active:bg-white/10 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4">قائمة المنتجات الحالية ({products.length})</h3>
            {products.map(p => (
              <div key={p.id} className="bg-brand-dark border border-white/5 p-3 rounded-2xl flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={p.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{p.name}</h4>
                  <p className="text-[10px] text-brand-muted">{p.price}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(p)}
                    className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center active:bg-blue-500/20"
                  >
                    <Edit size={16} />
                  </button>
                  {showDeleteConfirm === p.id ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="px-3 h-9 rounded-lg bg-red-500 text-white text-[10px] font-bold active:scale-95"
                      >
                        تأكيد
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 h-9 rounded-lg bg-white/10 text-white text-[10px] font-bold active:scale-95"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm(p.id)}
                      className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center active:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="bg-brand-dark2 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-brand-red mb-6 flex items-center gap-2">
              <ImageIcon size={20} />
              إعدادات الواجهة
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">صورة الهيرو (الرئيسية)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={settingsForm.heroImage}
                    onChange={e => setSettingsForm({...settingsForm, heroImage: e.target.value})}
                    className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all text-xs"
                    placeholder="رابط الصورة"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'hero')}
                      className="hidden"
                      id="hero-image-upload"
                    />
                    <label 
                      htmlFor="hero-image-upload"
                      className="w-full bg-white/5 border border-dashed border-white/20 p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all text-xs font-bold"
                    >
                      <PlusCircle size={16} />
                      رفع صورة جديدة
                    </label>
                  </div>
                </div>
                <div className="mt-2 aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/10">
                  <img src={settingsForm.heroImage} className="w-full h-full object-cover" alt="Hero Preview" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-brand-muted">نص اللوجو (1)</label>
                  <input 
                    type="text" 
                    value={settingsForm.logoText}
                    onChange={e => setSettingsForm({...settingsForm, logoText: e.target.value})}
                    className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-brand-muted">نص اللوجو (2)</label>
                  <input 
                    type="text" 
                    value={settingsForm.logoSubtext}
                    onChange={e => setSettingsForm({...settingsForm, logoSubtext: e.target.value})}
                    className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-dark2 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-brand-red mb-6 flex items-center gap-2">
              <Phone size={20} />
              روابط التواصل
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">رابط فيسبوك</label>
                <input 
                  type="text" 
                  value={settingsForm.facebookUrl}
                  onChange={e => setSettingsForm({...settingsForm, facebookUrl: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">رابط إنستجرام</label>
                <input 
                  type="text" 
                  value={settingsForm.instagramUrl}
                  onChange={e => setSettingsForm({...settingsForm, instagramUrl: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">رقم الواتساب (بدون +)</label>
                <input 
                  type="text" 
                  value={settingsForm.whatsappNumber}
                  onChange={e => setSettingsForm({...settingsForm, whatsappNumber: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">رقم الهاتف</label>
                <input 
                  type="text" 
                  value={settingsForm.phoneNumber}
                  onChange={e => setSettingsForm({...settingsForm, phoneNumber: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">العنوان (نص)</label>
                <input 
                  type="text" 
                  value={settingsForm.location}
                  onChange={e => setSettingsForm({...settingsForm, location: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-brand-muted">رابط الخريطة (Google Maps)</label>
                <input 
                  type="text" 
                  value={settingsForm.locationUrl}
                  onChange={e => setSettingsForm({...settingsForm, locationUrl: e.target.value})}
                  className="w-full bg-brand-dark border border-white/10 p-3 rounded-xl outline-none focus:border-brand-red transition-all text-xs"
                />
              </div>
            </div>
          </div>

          <div className="bg-brand-dark2 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="font-bold text-brand-red mb-6 flex items-center gap-2">
              <Banknote size={20} />
              طرق الدفع المتاحة
            </h3>
            
            <div className="space-y-4">
              {settingsForm.paymentMethods.map(pm => (
                <div key={pm.id} className="flex items-center justify-between p-4 bg-brand-dark rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-red">
                      {pm.id === 'cash' ? <Banknote size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <span className="font-bold text-sm">{pm.label}</span>
                  </div>
                  <button 
                    onClick={() => togglePaymentMethod(pm.id)}
                    className={`w-12 h-6 rounded-full transition-all relative ${pm.active ? 'bg-brand-red' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pm.active ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="w-full bg-brand-red text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-brand-red/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSavingSettings ? <Loader2 className="animate-spin" /> : <Save size={24} />}
            حفظ جميع الإعدادات
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function ProductDetails({ product, onClose, onAddToCart }: { product: Product, onClose: () => void, onAddToCart: () => void }) {
  const [activeImg, setActiveImg] = useState(0);

  return (
    <motion.div 
      className="fixed inset-0 bg-brand-black z-[2000] flex flex-col overflow-y-auto no-scrollbar"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header / Close Button */}
      <div className="sticky top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-brand-black via-brand-black/80 to-transparent backdrop-blur-sm">
        <button 
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all" 
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="font-display font-black text-lg">تفاصيل <span className="text-brand-red">المنتج</span></div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="flex flex-col lg:flex-row min-h-full">
        {/* Image Gallery Section */}
        <div className="lg:w-1/2 relative bg-brand-dark">
          <div className="aspect-[4/5] lg:aspect-square w-full relative">
            <motion.img 
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={product.images[activeImg]} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/40 to-transparent"></div>
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-4">
            {product.images.map((img, i) => (
              <button 
                key={i}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeImg === i ? 'border-brand-red scale-110 shadow-lg shadow-brand-red/40' : 'border-white/20 opacity-60'}`}
                onClick={() => setActiveImg(i)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-brand-red/10 text-brand-red text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-brand-red/20">
                {product.category === 'upholstery' ? 'فرش السيارة' : 'كماليات وإكسسوارات'}
              </span>
              {product.badge && (
                <span className="bg-white/5 text-brand-white/60 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                  {product.badge}
                </span>
              )}
            </div>

            <h2 className="text-5xl font-display font-black mb-6 leading-tight tracking-tight">{product.name}</h2>
            
            <div className="h-px w-20 bg-brand-red mb-8"></div>

            <p className="text-brand-white/70 text-lg leading-relaxed mb-10 font-sans">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <div className="text-[11px] text-brand-muted font-bold uppercase tracking-[0.2em] mb-3">السعر</div>
                <div className="text-5xl font-display font-black text-brand-red">{product.price}</div>
              </div>
              
              <div>
                <div className="text-[11px] text-brand-muted font-bold uppercase tracking-[0.2em] mb-3">الألوان المتاحة</div>
                <div className="flex gap-3">
                  {product.colors.map((color, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-white/10 shadow-2xl transition-transform hover:scale-110 cursor-pointer" 
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                className="flex-1 bg-brand-red text-white font-display font-black py-5 rounded-2xl active:scale-95 transition-all shadow-2xl shadow-brand-red/30 flex items-center justify-center gap-3 text-xl group"
                onClick={onAddToCart}
              >
                <span>إضافة إلى السلة</span>
                <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              </button>
              
              <button 
                className="flex-1 bg-white/5 text-white font-display font-black py-5 rounded-2xl active:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-3 text-xl"
                onClick={onClose}
              >
                العودة للمتجر
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
