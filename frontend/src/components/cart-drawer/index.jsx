import React, { useEffect, useState } from 'react';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const LightningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);
const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
);
const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);
const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
);

import { createOrderApi, verifyPaymentApi } from '../../services/api';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function CartDrawer({ isOpen, onClose, cartItems, itemsDetail, onAdd, onRemove, onClearCart }) {
    const [isVisible, setIsVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
    const [loading, setLoading] = useState(false);

    // Address State
    const [address, setAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isBillExpanded, setIsBillExpanded] = useState(true);
    const [step, setStep] = useState('cart'); // 'cart' or 'checkout'
    const [formData, setFormData] = useState({
        fullName: '',
        houseNo: '',
        landmark: '',
        pincode: '',
        mobile: '',
        email: '',
        location: ''
    });
    const [detectingLoc, setDetectingLoc] = useState(false);
    const [showNoDeliveryPopup, setShowNoDeliveryPopup] = useState(false);

    const isBangalorePincode = (pincode) => {
        // Bangalore pincodes typically start with 560
        return /^560\d{3}$/.test(pincode);
    };

    const autoDetectLocation = () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setDetectingLoc(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                if (!apiKey) {
                    console.warn("Google Maps API Key not found");
                    setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                    return;
                }
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                const data = await response.json();
                if (data.status === 'OK' && data.results.length > 0) {
                    setFormData(prev => ({ ...prev, location: data.results[0].formatted_address }));
                    const pincodeComp = data.results[0].address_components.find(c => c.types.includes('postal_code'));
                    if (pincodeComp) setFormData(prev => ({ ...prev, pincode: pincodeComp.long_name }));
                } else {
                    setFormData(prev => ({ ...prev, location: "Location found" }));
                }
            } catch (error) {
                console.error("Geocoding error:", error);
                setFormData(prev => ({ ...prev, location: "Error fetching address" }));
            } finally {
                setDetectingLoc(false);
            }
        }, (error) => {
            console.error(error);
            alert("Unable to retrieve location");
            setDetectingLoc(false);
        });
    };

    const handleSaveAddress = (e) => {
        e.preventDefault();
        if (!formData.fullName || !formData.mobile || !formData.pincode || !formData.houseNo) {
            alert("Please fill required fields");
            return;
        }

        if (!isBangalorePincode(formData.pincode)) {
            setShowNoDeliveryPopup(true);
            return;
        }

        setAddress(formData);
        setShowAddressForm(false);
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for slide out animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:4000';
        return `${baseUrl}/uploads/${imagePath}`;
    };

    // Calculate totals - using database values
    const totalMRP = cartItems.reduce((sum, item) => {
        const product = itemsDetail[item.id];
        return sum + (product?.product_price || 0) * item.qty;
    }, 0);

    const totalSelling = cartItems.reduce((sum, item) => {
        const product = itemsDetail[item.id];
        const price = (product?.product_discount_price > 0) ? product.product_discount_price : (product?.product_price || 0);
        return sum + price * item.qty;
    }, 0);

    const savings = totalMRP - totalSelling;
    const handlingFee = 5;
    const deliveryFee = totalSelling > 99 ? 0 : 25;
    const toPay = totalSelling + handlingFee + deliveryFee;

    const handleProceedToCheckout = () => {
        const token = localStorage.getItem('HommlieUserjwtToken');
        if (!token) {
            alert('Please login to place an order');
            return;
        }
        setStep('checkout');
    };

    const handlePlaceOrder = async () => {
        if (!address) {
            setShowAddressForm(true);
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('HommlieUserjwtToken');

        try {
            const orderData = {
                payment_method: paymentMethod, // 'COD' or 'ONLINE'
                address
            };

            const response = await createOrderApi(token, orderData);

            if (response.success) {
                if (paymentMethod === 'COD') {
                    alert('Order Placed Successfully via Cash on Delivery!');
                    if (onClearCart) onClearCart();
                    onClose();
                } else {
                    // Online Payment
                    const res = await loadRazorpay();
                    if (!res) {
                        alert('Razorpay SDK failed to load');
                        setLoading(false);
                        return;
                    }

                    const options = {
                        key: response.key_id,
                        amount: response.amount * 100, // amount in paise
                        currency: "INR",
                        name: "Hommlie",
                        description: "Order Payment",
                        order_id: response.razorpay_order_id,
                        handler: async function (responseParams) {
                            try {
                                const verifyRes = await verifyPaymentApi(token, {
                                    razorpay_order_id: responseParams.razorpay_order_id,
                                    razorpay_payment_id: responseParams.razorpay_payment_id,
                                    razorpay_signature: responseParams.razorpay_signature,
                                    order_id: response.order_id
                                });

                                if (verifyRes.success) {
                                    alert('Payment Successful! Order Placed.');
                                    if (onClearCart) onClearCart();
                                    onClose();
                                } else {
                                    alert('Payment Verification Failed');
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Payment Verification Error');
                            }
                        },
                        prefill: {
                            name: address.fullName || "User",
                            contact: address.mobile || "",
                            email: address.email || ""
                        },
                        theme: {
                            color: "#db2777"
                        }
                    };
                    const rzp1 = new window.Razorpay(options);
                    rzp1.open();
                }
            } else {
                alert(response.message || 'Failed to create order');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong during checkout');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            <div
                className={`relative w-full sm:max-w-[400px] h-full bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="bg-white p-6 flex items-center justify-between border-b border-gray-50 z-10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest text-[10px] text-gray-400 mb-1">
                            {showAddressForm ? 'Delivery Details' : step === 'cart' ? 'My Shopping Cart' : 'Checkout & Payment'}
                        </h2>
                        {!showAddressForm && cartItems.length > 0 && (
                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                                {step === 'cart' ? `${cartItems.length} Items ready to ship` : 'Almost Done!'}
                            </p>
                        )}
                    </div>
                    {showAddressForm ? (
                        <button onClick={() => setShowAddressForm(false)} className="text-xs font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors">Back</button>
                    ) : step === 'checkout' ? (
                        <button onClick={() => setStep('cart')} className="text-xs font-black text-primary uppercase tracking-widest hover:text-primary-dark transition-colors">Back to Cart</button>
                    ) : (
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 text-gray-400">
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Content */}
                {showAddressForm ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-white">
                        <form onSubmit={handleSaveAddress} className="space-y-6">
                            <div className="bg-primary/5 border border-primary/10 p-5 rounded-[2rem] cursor-default hover:bg-primary/10 transition-all duration-300 group shadow-sm relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-widest cursor-pointer" onClick={autoDetectLocation}>
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <TargetIcon />
                                        </div>
                                        <span>{detectingLoc ? 'Pinpointing...' : 'Locate Me Instantly'}</span>
                                    </div>
                                    {(formData.location || formData.pincode) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData({ ...formData, location: '', pincode: '' });
                                            }}
                                            className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg shadow-sm border border-red-100"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {formData.location && <p className="text-[10px] font-medium text-gray-500 mt-4 ml-11 leading-relaxed">{formData.location}</p>}
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <input required type="text" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                                        value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mobile</label>
                                        <input required type="tel" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                                            value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="10 Digits" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pincode</label>
                                        <input required type="text" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                                            value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="560XXX" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">House / Flat No.</label>
                                    <input required type="text" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                                        value={formData.houseNo} onChange={e => setFormData({ ...formData, houseNo: e.target.value })} placeholder="Apt Name, Floor etc." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Landmark</label>
                                    <input type="text" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all"
                                        value={formData.landmark} onChange={e => setFormData({ ...formData, landmark: e.target.value })} placeholder="Near Temple / Park" />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-primary text-white font-black py-4 rounded-[1.5rem] shadow-lg shadow-primary/20 mt-8 active:scale-95 transition-all text-sm uppercase tracking-widest">
                                SAVE DELIVERY ADDRESS
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        {!cartItems.length ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-white">
                                <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-8 shadow-premium border border-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                </div>
                                <h3 className="font-black text-gray-900 text-xl tracking-tight mb-2 uppercase tracking-widest text-sm">Cart is Empty</h3>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] mb-10 leading-relaxed text-gray-400">Discover premium home protection products</p>
                                <button onClick={onClose} className="bg-primary text-white px-10 py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Start Shopping</button>
                            </div>
                        ) : (
                            <div className={`flex-1 overflow-y-auto ${step === 'cart' ? 'pb-[140px]' : 'pb-[320px]'} px-4 pt-4 scrollbar-hide relative`}>
                                {savings > 0 && (
                                    <div className="mx-2 mb-6 bg-accent/5 px-6 py-3 rounded-2xl flex items-center justify-center gap-3 border border-accent/10 shadow-sm">
                                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-[10px]">✨</div>
                                        <span className="text-[10px] font-black text-accent-dark uppercase tracking-widest">You're saving ₹{Number(savings || 0).toFixed(0)} today</span>
                                    </div>
                                )}

                                {/* Compact Review Section for Step 2 */}
                                {step === 'checkout' && (
                                    <div className="mx-2 mb-6 bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review Selected Items</h3>
                                                <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] font-black text-gray-500">{cartItems.length} ITEMS</div>
                                            </div>
                                            <button onClick={() => setStep('cart')} className="text-[9px] font-black text-primary uppercase hover:underline flex items-center gap-1">
                                                <span>Edit</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {cartItems.map(item => {
                                                const product = itemsDetail[item.id] || {};
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between gap-3 bg-gray-50/30 p-2 rounded-xl border border-gray-50">
                                                        <div className="flex items-center gap-3 shrink min-w-0">
                                                            <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                                                                <img src={getImageUrl(product.product_image)} className="max-w-full max-h-full object-contain" alt="" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-bold text-gray-800 truncate leading-none mb-1">{product.product_name || 'Loading...'}</span>
                                                                <span className="text-[9px] font-bold text-gray-400">
                                                                    {item.qty} × ₹{Number(product.product_discount_price || product.product_price || 0).toFixed(0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-black text-gray-900 bg-white px-2.5 py-1.5 rounded-lg shrink-0 border border-gray-100 shadow-sm">
                                                            ₹{(Number(product.product_discount_price || product.product_price || 0) * item.qty).toFixed(0)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-[2rem] shadow-premium border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                    {cartItems.map((item) => {
                                        const product = itemsDetail[item.id] || {};
                                        const sellingPrice = (product.product_discount_price > 0) ? product.product_discount_price : product.product_price;
                                        return (
                                            <div key={item.id} className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                                                <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-white p-2 shrink-0 shadow-sm flex items-center justify-center">
                                                    <img src={getImageUrl(product.product_image)} alt={product.product_name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2 gap-2">
                                                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight uppercase tracking-tight">{product.product_name}</h4>
                                                        <div className="text-right shrink-0">
                                                            <div className="text-sm font-black text-gray-900 leading-none mb-1">₹{Number((sellingPrice || 0) * item.qty).toFixed(0)}</div>
                                                            {product.product_discount_price > 0 && (
                                                                <div className="text-[10px] text-gray-400 line-through font-bold">₹{Number((product.product_price || 0) * item.qty).toFixed(0)}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.unit || '1 pack'}</div>
                                                        <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 h-8 px-1">
                                                            <button onClick={() => onRemove(item.id)} className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors font-black">-</button>
                                                            <span className="w-8 text-center text-xs font-black text-primary">{item.qty}</span>
                                                            <button onClick={() => onAdd(item.id)} className="w-7 h-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors font-black">+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 px-2">
                                    <button
                                        onClick={() => setIsBillExpanded(!isBillExpanded)}
                                        className="w-full flex items-center justify-between mb-4 group"
                                    >
                                        <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-[0.2em]">Detailed Summary</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-primary uppercase">{isBillExpanded ? 'Hide' : 'Show Details'}</span>
                                            <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${isBillExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ${isBillExpanded ? 'max-h-64' : 'max-h-0'}`}>
                                        <div className="bg-white rounded-[2rem] shadow-premium border border-gray-100 p-6 space-y-4 mb-4">
                                            <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                <span>Subtotal</span>
                                                <span className="text-gray-900">₹{Number(totalMRP || 0).toFixed(0)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                <span>Promotion</span>
                                                <span className="text-accent">- ₹{Number(savings || 0).toFixed(0)}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                <span>Service Fee</span>
                                                <span className="text-gray-900">₹{handlingFee}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-50">
                                                <span>Logistics</span>
                                                <span className={deliveryFee === 0 ? 'text-accent' : 'text-gray-900'}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2rem] shadow-premium border border-gray-100 p-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Total Payable</span>
                                            <span className="text-2xl font-black text-gray-900 tracking-tighter">₹{Number(toPay || 0).toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <div className="bg-white border-t border-gray-50 p-4 pb-7 absolute bottom-0 w-full z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
                                {step === 'checkout' && (
                                    <>
                                        {/* Address Section */}
                                        <div onClick={() => setShowAddressForm(true)} className="flex items-center gap-4 mb-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-all group">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{address ? 'Shipping To' : 'Set Destination'}</span>
                                                    <ChevronDownIcon className="text-gray-400 w-3 h-3 group-hover:text-primary transition-colors" />
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight">
                                                    {address ? `${address.houseNo}, ${address.landmark}, ${address.location || address.pincode}` : 'Add your full delivery address'}
                                                </p>
                                            </div>
                                            <button className="text-[9px] font-black text-white bg-primary px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                                                {address ? 'Change' : 'Add'}
                                            </button>
                                        </div>

                                        {/* Payment Methods */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <button className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'ONLINE' ? 'border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5' : 'border-gray-100 bg-white text-gray-400'}`} onClick={() => setPaymentMethod('ONLINE')}>
                                                <span className="font-black text-[11px] uppercase tracking-widest">Pay Online</span>
                                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">UPI / Cards</span>
                                            </button>
                                            <button className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'COD' ? 'border-accent bg-accent/5 text-accent shadow-lg shadow-accent/5' : 'border-gray-100 bg-white text-gray-400'}`} onClick={() => setPaymentMethod('COD')}>
                                                <span className="font-black text-[11px] uppercase tracking-widest">Cash on Delivery</span>
                                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Pay at Door</span>
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button
                                    disabled={loading}
                                    onClick={step === 'cart' ? handleProceedToCheckout : handlePlaceOrder}
                                    className={`w-full relative overflow-hidden group bg-primary text-white font-black py-4.5 rounded-[1.5rem] shadow-[0_15px_30px_rgba(99,102,241,0.25)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.35)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-dark to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <div className="relative flex items-center justify-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[11px] uppercase font-black tracking-[0.15em] text-center">
                                                {loading ? 'Verifying...' : step === 'cart' ? 'Proceed to Checkout' : 'Pay Now & Place Order'}
                                            </span>
                                            <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest leading-none mt-1">
                                                {step === 'cart' ? '1 Step Away' : 'Secure Encrypted Payment'}
                                            </span>
                                        </div>
                                        {!loading && (
                                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-sm group-hover:translate-x-1 transition-transform duration-300">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* No Delivery Popup */}
            {
                showNoDeliveryPopup && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                    <line x1="15" y1="13" x2="9" y2="7" />
                                    <line x1="9" y1="13" x2="15" y2="7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Service Unavailable</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">
                                Currently, we are not delivering to this location. We apologize for the inconvenience and will be expanding to your area very soon!
                            </p>
                            <button
                                onClick={() => setShowNoDeliveryPopup(false)}
                                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                            >
                                Got it, thanks!
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
