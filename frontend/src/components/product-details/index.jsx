import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header';
import { getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';

// Icons
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
);
const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

export default function ProductDetails({ cartCount, cart, addToCart, removeFromCart, onCartClick }) {
    const { productName } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getProducts(); // For now fetching all and finding by ID
                if (data.success) {
                    const found = data.data.find(p => slugify(p.product_name) === productName);
                    setProduct(found);
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productName]);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath?.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
        return `${baseUrl}/uploads/${imagePath}`;
    };

    const [imgSrc, setImgSrc] = useState(getImageUrl(product?.product_image));

    useEffect(() => {
        if (product) {
            setImgSrc(getImageUrl(product.product_image));
        }
    }, [product]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    const qty = cart?.[product.id] || 0;
    const images = [imgSrc, imgSrc, imgSrc];

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Header cartCount={cartCount} onCartClick={onCartClick} selectedCategory={product.category_name} />

            {/* Breadcrumbs */}
            <div className="max-w-[1200px] mx-auto px-4 py-4 text-xs text-gray-500 flex items-center gap-2">
                <button className="hover:text-emerald-700 transition-colors" onClick={() => navigate('/')}>Home</button>
                <ChevronRightIcon />
                <button className="hover:text-emerald-700" onClick={() => navigate(`/category/${product.category_name}`)}>{product.category_name}</button>
                <ChevronRightIcon />
                <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.product_name}</span>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pt-2 relative items-start">

                {/* Left: Gallery (Sticky) */}
                <div className="lg:sticky lg:top-24 flex gap-4 h-fit">
                    {/* Thumbnails */}
                    <div className="flex flex-col gap-3 w-16 shrink-0">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`w-16 h-16 rounded-xl border-2 p-1 overflow-hidden transition-all bg-white shadow-sm ${selectedImage === idx ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-gray-100 hover:border-emerald-300'}`}
                            >
                                <img
                                    src={img}
                                    className="w-full h-full object-contain"
                                    alt={`View ${idx}`}
                                    onError={() => setImgSrc('https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80')}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-center relative shadow-sm aspect-[4/4.5]">
                        <img
                            src={imgSrc}
                            className="w-full h-full object-contain"
                            alt={product.product_name}
                            onError={() => setImgSrc('https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80')}
                        />
                        <button className="absolute top-4 right-4 p-2.5 bg-white rounded-full hover:bg-gray-50 ring-1 ring-gray-100 shadow-sm transition-all group">
                            <ShareIcon />
                        </button>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="flex flex-col gap-6 pt-2">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.category_name}</span>
                        </div>

                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.product_name}</h1>
                        <p className="text-sm text-gray-500 mb-6 font-medium">1 unit</p>

                        {/* Delivery Badge */}
                        <div className="bg-emerald-50 w-fit px-4 py-2 rounded-xl flex items-center gap-2 mb-8 border border-emerald-100/50">
                            <LightningIcon />
                            <span className="text-sm font-bold text-emerald-800">Get in {product.estimated_time || '10 minutes'}</span>
                        </div>

                        <div className="h-px bg-gray-100 mb-8"></div>

                        {/* Price Block */}
                        <div className="flex items-center gap-5 mb-8">
                            <div className="bg-emerald-600 text-white font-extrabold text-2xl px-4 py-2 rounded-lg shadow-lg shadow-emerald-200">
                                ₹{product.product_discount_price > 0 ? product.product_discount_price : product.product_price}
                            </div>
                            <div className="flex flex-col">
                                {product.product_discount_price > 0 && (
                                    <span className="text-sm text-gray-400 line-through decoration-gray-300">MRP ₹{product.product_price}</span>
                                )}
                                <span className="text-xs text-emerald-600 font-bold tracking-wide uppercase">(incl. of all taxes)</span>
                            </div>
                        </div>

                        {qty === 0 ? (
                            <button
                                onClick={() => addToCart(product.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200/50 transition-all transform active:scale-[0.99] text-base"
                            >
                                Add to Cart
                            </button>
                        ) : (
                            <div className="flex items-center w-full bg-emerald-600 text-white rounded-xl h-14 shadow-lg shadow-emerald-200 overflow-hidden">
                                <button onClick={() => removeFromCart(product.id)} className="w-16 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors font-bold text-xl">-</button>
                                <span className="flex-1 text-center font-bold text-lg">{qty} in cart</span>
                                <button onClick={() => addToCart(product.id)} className="w-16 h-full flex items-center justify-center hover:bg-emerald-700 transition-colors font-bold text-xl">+</button>
                            </div>
                        )}
                    </div>

                    {/* Product Details Table */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wide">Product Details</h3>
                        <div className="space-y-5 text-sm">
                            <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                                <span className="text-gray-500 font-medium">Brand</span>
                                <span className="col-span-2 font-semibold text-gray-900">Hommlie</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-1">
                                <span className="text-gray-500 font-medium">Description</span>
                                <span className="col-span-2 text-gray-600 leading-relaxed">
                                    {product.product_desc || `Premium quality ${product.product_name.toLowerCase()} for your home needs.`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
