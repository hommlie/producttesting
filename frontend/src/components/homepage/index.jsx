import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../header';
import { getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/${imagePath}`;
};

const ProductCard = ({ product, cart, addToCart, removeFromCart }) => {
  const qty = cart?.[product.id] || 0;
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(getImageUrl(product.product_image));

  useEffect(() => {
    setImgSrc(getImageUrl(product.product_image));
  }, [product.product_image]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-emerald-100 transition-all duration-300 flex flex-col h-full relative group shadow-sm">
      <div
        className="aspect-square rounded-xl bg-gray-50 mb-4 relative overflow-hidden flex items-center justify-center p-4 cursor-pointer"
        onClick={() => navigate(`/product/${slugify(product.product_name)}`)}
      >
        <img
          src={imgSrc}
          alt={product.product_name}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80')}
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="flex-1 flex flex-col">
        <h3
          className="font-bold text-gray-800 text-sm leading-snug mb-1 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2"
          onClick={() => navigate(`/product/${slugify(product.product_name)}`)}
        >
          {product.product_name}
        </h3>
        <p className="text-gray-400 text-[11px] mb-4">{product.estimated_time || '15 mins'}</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            {product.product_discount_price > 0 && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.product_price}</span>
            )}
            <span className="font-extrabold text-gray-900 text-base">
              ₹{product.product_discount_price > 0 ? product.product_discount_price : product.product_price}
            </span>
          </div>

          <div className="w-20">
            {qty === 0 ? (
              <button
                onClick={() => addToCart(product.id)}
                className="w-full py-1.5 rounded-lg border border-indigo-100 text-indigo-600 font-bold text-xs bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all uppercase"
              >
                Add
              </button>
            ) : (
              <div className="flex items-center w-full bg-indigo-600 text-white rounded-lg h-8 shadow-md shadow-indigo-100 overflow-hidden">
                <button onClick={() => removeFromCart(product.id)} className="w-6 h-full flex items-center justify-center hover:bg-indigo-700 font-bold text-sm">-</button>
                <span className="flex-1 text-center font-bold text-xs">{qty}</span>
                <button onClick={() => addToCart(product.id)} className="w-6 h-full flex items-center justify-center hover:bg-indigo-700 font-bold text-sm">+</button>
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

  const sections = [
    { title: 'Best Sellers', filter: (p) => p.product_price < 500 }, // Dummy filter for demo
    { title: 'New Arrivals', filter: (p) => p.id > 10 },
    { title: 'Hot Deals', filter: (p) => p.product_price > 100 },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 md:pb-0">
      <Header
        cartCount={cartTotalItems}
        onCartClick={onCartClick}
        selectedCategory="All"
      />

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <main className="space-y-12">
          {/* Hero Banner - Divided into two halves */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[2.5rem] shadow-2xl relative">
            {/* Left Side: Content */}
            <div className="bg-indigo-900 p-12 lg:p-20 text-white flex flex-col justify-center relative z-10">
              <div className="max-w-md">
                <span className="inline-block px-4 py-1.5 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-400/50 shadow-lg">⚡ Superfast Delivery</span>
                <h1 className="text-4xl lg:text-6xl font-black mb-8 leading-[1.1]">
                  Pest-free in <br />
                  <span className="text-yellow-400 italic">10 minutes.</span>
                </h1>
                <p className="text-indigo-200 text-lg mb-10 font-medium leading-relaxed">Get professional grade home protection delivered to your doorstep instantly.</p>
                <button
                  onClick={() => navigate('/category/Pest Control')}
                  className="bg-white text-indigo-900 px-10 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-indigo-500/20 text-lg group inline-flex items-center gap-2"
                >
                  Shop All Items
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>

            {/* Right Side: Image/Visual */}
            <div className="relative h-64 md:h-auto overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1587563871196-1c8134fd396d?w=1200&q=80"
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 md:from-indigo-900/80 to-transparent"></div>

              {/* Floating Promo Tag */}
              <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-white shadow-2xl hidden lg:block transform rotate-3">
                <div className="text-3xl font-black mb-1">20% OFF</div>
                <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest">On First Order</div>
              </div>
            </div>
          </div>

          <div className="space-y-16">
            {sections.map((section) => {
              const sectionProducts = products.filter(section.filter);
              if (sectionProducts.length === 0) return null;
              return (
                <div key={section.title} className="relative">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                      <div className="h-1 w-12 bg-indigo-500 rounded-full mt-2"></div>
                    </div>
                    <button
                      className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1 group"
                    >
                      See All
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {sectionProducts.slice(0, 5).map(product => (
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
        </main>
      </div>
    </div>
  );
}
