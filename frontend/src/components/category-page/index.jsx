import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header';
import { getSubcategories, getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';

export default function CategoryPage({ cart, addToCart, removeFromCart, onCartClick, cartTotalItems }) {
    const { categoryName, subcategoryName } = useParams();
    const navigate = useNavigate();
    const [subcategories, setSubcategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
        return `${baseUrl}/uploads/${imagePath}`;
    };

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
        <div className="min-h-screen bg-white">
            <Header
                cartCount={cartTotalItems}
                onCartClick={onCartClick}
                selectedCategory={categoryName}
            />

            <div className="max-w-[1400px] mx-auto flex">
                {/* Left Sidebar - Subcategories */}
                <aside className="w-64 border-r border-gray-100 min-h-[calc(100vh-120px)] p-4">
                    <div className="space-y-4">
                        {subcategories.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => navigate(`/category/${categoryName}/${sub.subcategory_name}`)}
                                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeSub === sub.subcategory_name
                                    ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {sub.subcategory_image ? (
                                        <img
                                            src={getImageUrl(sub.subcategory_image)}
                                            alt={sub.subcategory_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-400 font-bold">
                                            {sub.subcategory_name?.[0] || 'S'}
                                        </div>
                                    )}
                                </div>
                                <span className="font-bold text-sm text-left leading-tight">{sub.subcategory_name}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 bg-gray-50/30">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                            <span>Home</span>
                            <span>›</span>
                            <span>{categoryName}</span>
                            {subcategoryName && (
                                <>
                                    <span>›</span>
                                    <span className="text-gray-900 font-bold">{subcategoryName}</span>
                                </>
                            )}
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-6">Buy {activeSub || categoryName} Online</h1>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            <div className="py-20 text-center text-gray-400">
                                No products found in this category.
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

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
        return `${baseUrl}/uploads/${imagePath}`;
    };

    const [imgSrc, setImgSrc] = useState(getImageUrl(product.product_image));

    useEffect(() => {
        setImgSrc(getImageUrl(product.product_image));
    }, [product.product_image]);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-xl transition-all group flex flex-col h-full shadow-sm relative">
            <div
                className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden flex items-center justify-center p-4 cursor-pointer"
                onClick={() => navigate(`/product/${slugify(product.product_name)}`)}
            >
                <img
                    src={imgSrc}
                    alt={product.product_name}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        if (imgSrc !== '') e.target.src = 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80';
                    }}
                />
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 h-10">{product.product_name}</h3>
                <div className="text-gray-400 text-xs mb-4">{product.estimated_time || '15 mins'}</div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        {product.product_discount_price > 0 && (
                            <span className="text-[10px] text-gray-400 line-through">₹{product.product_price}</span>
                        )}
                        <span className="font-bold text-gray-900 text-base">
                            ₹{product.product_discount_price > 0 ? product.product_discount_price : product.product_price}
                        </span>
                    </div>

                    <div className="relative">
                        {qty === 0 ? (
                            <button
                                onClick={() => addToCart(product.id)}
                                className="px-6 py-2 border border-pink-500 text-pink-500 rounded-lg font-bold text-xs hover:bg-pink-50 transition-colors uppercase"
                            >
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center bg-pink-500 text-white rounded-lg px-2 py-1 shadow-lg shadow-pink-100">
                                <button onClick={() => removeFromCart(product.id)} className="w-6 h-8 flex items-center justify-center font-bold">-</button>
                                <span className="w-6 text-center font-bold text-xs">{qty}</span>
                                <button onClick={() => addToCart(product.id)} className="w-6 h-8 flex items-center justify-center font-bold">+</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute top-2 left-2 bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">Ad</div>
        </div>
    );
};
