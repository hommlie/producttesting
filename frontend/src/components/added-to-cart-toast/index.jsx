import React, { useEffect } from 'react';

// Icons
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="m9 18 6-6-6-6" /></svg>
);

export default function AddedToCartToast({ isOpen, onClose, product, onGoToCart }) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
        return `${baseUrl}/uploads/${imagePath}`;
    };

    const sellingPrice = (product.product_discount_price > 0) ? product.product_discount_price : product.product_price;

    return (
        <div className="fixed top-24 right-4 z-[70] bg-white rounded-xl shadow-xl border border-gray-100 p-0 w-[400px] animate-fade-in-down overflow-hidden">
            {/* Header */}
            <div className="bg-white p-3 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-green-700 text-sm flex items-center gap-2"><CheckCircleIcon /> Added to Cart</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="text-xl leading-none">&times;</span>
                </button>
            </div>

            {/* Product Content */}
            <div className="p-4 flex gap-4">
                <div className="w-16 h-16 rounded-lg border border-gray-100 bg-white p-1 shrink-0 flex items-center justify-center">
                    <img
                        src={getImageUrl(product.product_image)}
                        alt={product.product_name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80'}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{product.product_name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{product.unit || '1 pack'}</p>
                    <div className="flex items-center gap-2">
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">₹{sellingPrice}</span>
                        {product.product_discount_price > 0 && (
                            <span className="text-xs text-gray-400 line-through">₹{product.product_price}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <button
                    onClick={() => {
                        onClose();
                        onGoToCart();
                    }}
                    className="w-full bg-white border border-rose-100 hover:bg-rose-50 text-rose-500 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors shadow-sm"
                >
                    Go to Cart <ChevronRightIcon />
                </button>
            </div>
        </div>
    );
}
