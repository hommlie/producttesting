import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../header';
import { getProducts } from '../../services/api';
import { slugify } from '../../utils/slugify';
import { getImageUrl } from '../../utils/imageUrl';

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
    const [isIntelExpanded, setIsIntelExpanded] = useState(false);
    const [imgSrc, setImgSrc] = useState('');



    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await getProducts();
                if (response.success) {
                    const found = response.data.find(p => slugify(p.product_name) === productName);
                    setProduct(found);
                    if (found) {
                        setImgSrc(getImageUrl(found.product_image));
                    }
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productName]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    const qty = cart?.[product.id] || 0;
    const images = [imgSrc, imgSrc, imgSrc];

    return (
        <div className="min-h-screen bg-[#fcfcfd] pb-20 md:pb-24">
            <Header cartCount={cartCount} onCartClick={onCartClick} selectedCategory={product.category_name} />

            <div className="max-w-[1300px] mx-auto px-2 md:px-4 pt-8 md:pt-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-gray-400 mb-6 md:mb-10 overflow-x-auto scrollbar-hide">
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>Home</span>
                    <span className="opacity-30">/</span>
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/category/${product.category_name}`)}>{product.category_name}</span>
                    <span className="opacity-30">/</span>
                    <span className="text-gray-900 truncate max-w-[200px]">{product.product_name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-20">
                    {/* Left: Visuals */}
                    <div className="lg:col-span-6 space-y-4 md:space-y-8">
                        {/* Main Stage */}
                        <div className="aspect-[1.2/1] bg-white rounded-[2rem] md:rounded-[3rem] shadow-premium border border-gray-100 p-4 md:p-8 relative group flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <img
                                src={imgSrc}
                                className="max-w-[70%] max-h-[70%] object-contain group-hover:scale-110 transition-transform duration-700 ease-out z-10"
                                alt={product.product_name}
                            />
                            <button className="absolute top-8 right-8 w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 z-20 group/btn">
                                <ShareIcon />
                            </button>

                            {/* Badges */}
                            <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
                                <div className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">Premium Quality</div>
                                {product.product_discount_price > 0 && (
                                    <div className="bg-accent text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">
                                        Special Offer
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gallery Strip */}
                        <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`w-20 h-20 rounded-[1.5rem] border-2 p-3 bg-white shrink-0 transition-all duration-300 shadow-sm ${selectedImage === idx ? 'border-primary shadow-lg shadow-primary/10 -translate-y-1' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-contain" alt="" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Intelligence & Actions */}
                    <div className="lg:col-span-6 flex flex-col pt-2 md:pt-4">
                        <div className="mb-6 md:mb-10">
                            <div className="flex items-center gap-3 mb-3 md:mb-4">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">Official Hommlie Store</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3 md:mb-4 tracking-tight leading-[1.1]">{product.product_name}</h1>
                            <div className="flex items-center gap-4 md:gap-6">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{product.unit || 'Standard Pack'}</p>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <div className="flex items-center gap-2">
                                    <LightningIcon />
                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">Ships in {product.estimated_time || '24 Hrs'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Cart Action */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-premium border border-gray-100 mb-6 md:mb-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[10rem] -mr-10 -mt-10"></div>

                            <div className="flex items-end gap-6 mb-8 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Our Price</p>
                                    <div className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
                                        ₹{product.product_discount_price > 0 ? product.product_discount_price : product.product_price}
                                    </div>
                                </div>
                                {product.product_discount_price > 0 && (
                                    <div className="mb-1">
                                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Save ₹{product.product_price - product.product_discount_price}</p>
                                        <span className="text-base text-gray-400 line-through decoration-gray-300 font-bold">₹{product.product_price}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-16 flex items-center">
                                {qty === 0 ? (
                                    <button
                                        onClick={() => addToCart(product.id)}
                                        className="w-full h-full bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs uppercase tracking-[0.2em]"
                                    >
                                        Add to Shopping Bag
                                    </button>
                                ) : (
                                    <div className="flex items-center w-full h-full bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 overflow-hidden">
                                        <button onClick={() => removeFromCart(product.id)} className="flex-1 h-full flex items-center justify-center hover:bg-primary-dark transition-colors font-black text-xl">-</button>
                                        <div className="px-8 h-full flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm border-x border-white/10 min-w-[100px]">
                                            <span className="text-lg font-black">{qty}</span>
                                            <span className="text-[7px] uppercase font-black opacity-60 tracking-widest">In Bag</span>
                                        </div>
                                        <button onClick={() => addToCart(product.id)} className="flex-1 h-full flex items-center justify-center hover:bg-primary-dark transition-colors font-black text-xl">+</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Intelligence Section */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                <button
                                    onClick={() => setIsIntelExpanded(!isIntelExpanded)}
                                    className="w-full flex items-center justify-between group"
                                >
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Intelligence</h3>
                                    <div className={`transition-transform duration-300 ${isIntelExpanded ? 'rotate-90' : ''}`}>
                                        <ChevronRightIcon />
                                    </div>
                                </button>

                                <div className={`overflow-hidden transition-all duration-300 ${isIntelExpanded ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Classification</span>
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{product.category_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logistics</span>
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Next-Gen Delivery</span>
                                        </div>
                                        <div className="pt-4 flex flex-col gap-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Summary</span>
                                            <p className="text-xs font-bold text-gray-900 leading-relaxed tracking-tight">
                                                {product.product_desc || `This premium ${product.product_name.toLowerCase()} is designed for those who value quality and efficiency. Every aspect of this product has been curated to ensure high performance and satisfaction.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trust Banner */}
                            <div className="flex items-center justify-around py-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">✓</div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Authentic</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">🛡</div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Quality Insured</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">⚡</div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Superfast</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
