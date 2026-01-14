import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../header';
import { getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';
import { getImageUrl } from '../../utils/imageUrl';



const ProductCard = ({ product, cart, addToCart, removeFromCart }) => {
  const qty = cart?.[product.id] || 0;
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(getImageUrl(product.product_image));

  useEffect(() => {
    setImgSrc(getImageUrl(product.product_image));
  }, [product.product_image]);

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-3 hover:shadow-hover hover:border-primary/20 transition-all duration-500 flex flex-col h-full relative group shadow-premium">
      {/* Ad Tag or Discount Tag */}
      {product.product_discount_price > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-accent text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-accent/20 uppercase tracking-widest">
          Save ₹{product.product_price - product.product_discount_price}
        </div>
      )}

      <div
        className="aspect-square rounded-[1.5rem] bg-gray-50/50 mb-4 relative overflow-hidden flex items-center justify-center p-6 cursor-pointer group-hover:bg-white transition-colors duration-500"
        onClick={() => navigate(`/product/${slugify(product.product_name)}`)}
      >
        <img
          src={imgSrc}
          alt={product.product_name}
          className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
        />
      </div>

      <div className="flex-1 flex flex-col px-1">
        <h3
          className="font-bold text-gray-800 text-sm leading-tight mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2 h-10"
          onClick={() => navigate(`/product/${slugify(product.product_name)}`)}
        >
          {product.product_name}
        </h3>
        <div className="flex items-center gap-1.5 mb-4">
          <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{product.estimated_time || '24 hrs'}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {product.product_discount_price > 0 && (
              <span className="text-[10px] text-gray-400 line-through font-medium">₹{product.product_price}</span>
            )}
            <span className="font-black text-gray-900 text-lg tracking-tight">
              ₹{product.product_discount_price > 0 ? product.product_discount_price : product.product_price}
            </span>
          </div>

          <div className="w-24">
            {qty === 0 ? (
              <button
                onClick={() => addToCart(product.id)}
                className="w-full py-2 rounded-xl border-2 border-primary/10 text-primary font-black text-[11px] bg-primary/5 hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 uppercase tracking-widest"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center w-full bg-primary text-white rounded-xl h-9 shadow-lg shadow-primary/20 overflow-hidden">
                <button onClick={() => removeFromCart(product.id)} className="w-8 h-full flex items-center justify-center hover:bg-primary-dark transition-colors font-black text-lg">-</button>
                <span className="flex-1 text-center font-black text-xs">{qty}</span>
                <button onClick={() => addToCart(product.id)} className="w-8 h-full flex items-center justify-center hover:bg-primary-dark transition-colors font-black text-lg">+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Homepage({ onProductClick, cart, addToCart, removeFromCart, onCartClick }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching homepage products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const cartTotalItems = Object.values(cart || {}).reduce((a, b) => a + b, 0);

  // Derive unique categories for the grid
  const categories = Array.from(new Set(products.map(p => p.category_name))).map(name => ({
    name,
    icon: products.find(p => p.category_name === name)?.product_image,
    emoji: '🧪' // Fallback
  }));

  const sections = [
    { title: 'Bestsellers', filter: (p) => p.product_price < 500 },
    { title: 'New on Hommlie', filter: (p) => p.id > 10 },
    { title: 'Instant Protection', filter: (p) => p.product_price > 100 },
  ];

  const bannerSlides = [
    {
      title: "Premium Pest Control",
      subtitle: "Professional-grade solutions for a pest-free home. Delivered in 24 hours.",
      cta: "Explore Solutions",
      tag: "⚡ Local Inventory",

      image: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=1600&q=80",
      accent: "from-accent to-emerald-300",
      bg: "bg-indigo-950"
    },
    {
      title: "Luxury Home Hygiene",
      subtitle: "Elevate your sanctuary with our premium selection of cleaning essentials.",
      cta: "View Collection",
      accent: "from-cyan-300 via-blue-100 to-indigo-100",
      bg: "bg-slate-900",
      image: "https://images.unsplash.com/photo-1527515545081-5db817172677?w=1600&q=80"
    },
    {
      title: "Expert Home Care",
      subtitle: "Verified professional products for absolute peace of mind and safety.",
      cta: "Shop Premium",
      tag: "🛡️ Certified Quality",

      image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=1600&q=80",
      accent: "from-emerald-400 to-teal-300",
      bg: "bg-emerald-950"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Loading Premium Experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-gray-900 font-sans pb-20 md:pb-0">
      <Header
        cartCount={cartTotalItems}
        onCartClick={onCartClick}
        selectedCategory="All"
        isTransparent={true}
      />

      <div className="max-w-[1600px] mx-auto px-2 md:px-4 relative">
        <main className="space-y-12 md:space-y-16">
          {/* Hero Banner Slider - Ultra Premium */}
          <div className="relative h-[420px] md:h-[550px] rounded-lg md:rounded-xl overflow-hidden shadow-2xl">
            {bannerSlides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
                  } ${slide.bg}`}
              >
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
                  {/* Left Side: Content */}
                  <div className="lg:col-span-7 p-6 md:p-10 lg:p-24 text-white flex flex-col justify-center relative z-20 pt-24 md:pt-44 -ml-0 md:-ml-10">
                    <div className="max-w-4xl drop-shadow-2xl">
                      <div className="flex items-center gap-3 mb-8">

                      </div>

                      <h1 className={`text-2xl md:text-3xl lg:text-5xl font-black mb-4 md:mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r overflow-visible ${slide.accent}`}>
                        {slide.title}
                      </h1>

                      <p className="text-white/70 text-sm md:text-lg lg:text-xl mb-8 md:mb-12 font-medium leading-relaxed max-w-md">
                        {slide.subtitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 md:gap-6">
                        <button
                          onClick={() => navigate('/category/All')}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black hover:bg-white/10 active:scale-95 transition-all shadow-2xl text-xs md:text-sm group inline-flex items-center gap-2 md:gap-3"
                        >
                          {slide.cta}
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Visual */}
                  <div className="lg:col-span-5 relative hidden lg:block overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-inherit via-transparent to-transparent z-10"></div>
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-[10s]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Slide Indicators */}
            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 lg:left-24 z-20 flex gap-2 md:gap-3">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-12 bg-accent shadow-lg shadow-accent/50' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="absolute bottom-6 md:bottom-10 right-6 md:right-10 z-20 flex gap-3 md:gap-4">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Quick Grid */}
          <section className="mb-12 md:mb-16">
            <div className="flex items-center justify-between mb-5 md:mb-8 px-2">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Shop by Category</h2>
                <div className="h-1 w-8 bg-primary rounded-full mt-2"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5 px-2">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => navigate(`/category/${cat.name}`)}
                  className="group cursor-pointer flex flex-col items-center gap-2.5 md:gap-3"
                >
                  <div className="w-full aspect-square bg-white rounded-2xl md:rounded-[2rem] shadow-sm group-hover:shadow-lg border border-gray-100 group-hover:border-primary/20 flex items-center justify-center p-4 md:p-6 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300"></div>
                    <img
                      src={getImageUrl(cat.icon)}
                      alt={cat.name}
                      onError={(e) => e.target.style.display = 'none'}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 relative z-10"
                    />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-wider group-hover:text-primary transition-colors text-center leading-tight">{cat.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sectional Lists */}
          <div className="space-y-12 md:space-y-20 px-2">
            {sections.map((section) => {
              const sectionProducts = products.filter(section.filter);
              if (sectionProducts.length === 0) return null;
              return (
                <div key={section.title} className="relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                      <div className="h-1 w-10 bg-accent rounded-full mt-2.5"></div>
                    </div>
                    <button
                      onClick={() => navigate(`/category/All`)}
                      className="group flex items-center gap-2 bg-white hover:bg-gray-50 px-4 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl transition-all border border-gray-100 shadow-sm active:scale-95"
                    >
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-600 group-hover:text-primary transition-colors">View All</span>
                      <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 group-hover:translate-x-0.5 group-hover:text-primary transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                    {sectionProducts.slice(0, 10).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Banner */}
          <div className="py-12 md:py-16 mt-8 md:mt-12 border-t border-gray-100 px-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
              {[
                { icon: '🚚', title: '24 Hr Delivery', sub: 'Fastest in Bangalore' },
                { icon: '🛡️', title: 'Safe & Secure', sub: 'Verified professional' },
                { icon: '💎', title: 'Best Prices', sub: 'Direct from makers' },
                { icon: '✨', title: '100% Genuine', sub: 'Original products' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-2 md:gap-3 bg-white rounded-2xl p-4 md:p-5 border border-gray-50 hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="text-3xl md:text-4xl mb-1">{item.icon}</div>
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-wider text-gray-900">{item.title}</div>
                  <div className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

