import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header';
import { getSubcategories, getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';
import { getImageUrl } from '../../utils/imageUrl';

export default function CategoryPage({ cart, addToCart, removeFromCart, onCartClick, cartTotalItems }) {
    const { categoryName, subcategoryName } = useParams();
    const navigate = useNavigate();
    const [subcategories, setSubcategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [subData, prodData] = await Promise.all([
                    getSubcategories(),
                    getProducts()
                ]);

                if (subData.success) {
                    setSubcategories(subData.subcategories.filter(s => s.category_name === categoryName));
                }
                if (prodData.success) {
                    setProducts(prodData.data);
                }
            } catch (error) {
                console.error("Error fetching category page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryName]);

    const filteredProducts = products.filter(p => {
        const catMatch = p.category_name === categoryName;
        const subMatch = subcategoryName ? p.subcategory_name === subcategoryName : true;
        return catMatch && subMatch;
    });

    const activeSub = subcategoryName || (subcategories[0]?.subcategory_name);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#fcfcfd]">
            <Header
                cartCount={cartTotalItems}
                onCartClick={onCartClick}
                selectedCategory={categoryName}
            />

            <div className="max-w-[1400px] mx-auto flex gap-6 md:gap-8 px-2 md:px-4 pb-20 md:pb-24">
                {/* Left Sidebar - Subcategories */}
                <aside className="w-72 hidden lg:block sticky top-[100px] h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide py-8">
                    <div className="space-y-3">
                        <div className="px-4 mb-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Categories</h2>
                            <div className="h-0.5 w-8 bg-primary/20 mt-2"></div>
                        </div>
                        {subcategories.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => navigate(`/category/${categoryName}/${sub.subcategory_name}`)}
                                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group ${activeSub === sub.subcategory_name
                                    ? 'bg-white shadow-premium border-primary/10 border text-primary ring-1 ring-primary/5'
                                    : 'text-gray-500 hover:bg-white hover:shadow-sm'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${activeSub === sub.subcategory_name ? 'border-primary/20' : 'border-transparent bg-gray-50'}`}>
                                    {sub.subcategory_image ? (
                                        <img
                                            src={getImageUrl(sub.subcategory_image)}
                                            alt={sub.subcategory_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs uppercase tracking-tighter">
                                            {sub.subcategory_name?.[0] || 'S'}
                                        </div>
                                    )}
                                </div>
                                <span className={`font-bold text-xs uppercase tracking-widest text-left leading-tight transition-colors ${activeSub === sub.subcategory_name ? 'text-primary' : 'group-hover:text-gray-900'}`}>{sub.subcategory_name}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 py-8">
                    <div className="mb-10">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>Home</span>
                            <span className="opacity-30">/</span>
                            <span>{categoryName}</span>
                            {subcategoryName && (
                                <>
                                    <span className="opacity-30">/</span>
                                    <span className="text-gray-900">{subcategoryName}</span>
                                </>
                            )}
                        </div>

                        {/* Title Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
                            <div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-none mb-2 md:mb-3">
                                    {activeSub || categoryName}
                                </h1>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                                    {filteredProducts.length} Premium Products Found
                                </p>
                            </div>

                            {/* Simple Filter Placeholder */}
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort by:</span>
                                <select className="bg-white border border-gray-100 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm">
                                    <option>Relevance</option>
                                    <option>Newest First</option>
                                    <option>Price: Low to High</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    cart={cart}
                                    addToCart={addToCart}
                                    removeFromCart={removeFromCart}
                                />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-premium border border-dashed border-gray-200">
                                <div className="text-6xl mb-6 grayscale opacity-20">🛒</div>
                                <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-widest">No Products Found</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Try adjusting your filters or category selection</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Go Home
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

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
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg uppercase tracking-widest w-fit">Ad</div>
                {product.product_discount_price > 0 && (
                    <div className="bg-accent text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg uppercase tracking-widest w-fit">
                        Sale
                    </div>
                )}
            </div>

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
                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-2 h-10"
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

                    <div className="w-24 px-1">
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

