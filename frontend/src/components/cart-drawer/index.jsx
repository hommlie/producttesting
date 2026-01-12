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
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
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

    const handleCheckout = async () => {
        const token = localStorage.getItem('HommlieUserjwtToken');
        if (!token) {
            alert('Please login to place an order');
            return;
        }

        if (!address) {
            setShowAddressForm(true);
            return;
        }

        setLoading(true);

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
                className={`relative w-full max-w-[400px] h-full bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100 z-10">
                    <h2 className="text-lg font-bold text-gray-900">{showAddressForm ? 'Add Address' : 'Cart'}</h2>
                    {showAddressForm ? (
                        <button onClick={() => setShowAddressForm(false)} className="text-sm font-bold text-indigo-600">Back</button>
                    ) : (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Content */}
                {showAddressForm ? (
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                        <form onSubmit={handleSaveAddress} className="space-y-4">
                            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-6 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={autoDetectLocation}>
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                    <TargetIcon />
                                    <span>{detectingLoc ? 'Detecting...' : 'Use Current Location'}</span>
                                </div>
                                {formData.location && <p className="text-xs text-gray-600 mt-2 ml-6 text-left">{formData.location}</p>}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                                    <input required type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Mobile *</label>
                                        <input required type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="10-digit number" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                                        <input required type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                            value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} placeholder="560001" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">House / Flat No. *</label>
                                    <input required type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={formData.houseNo} onChange={e => setFormData({ ...formData, houseNo: e.target.value })} placeholder="#101, Apartment Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Landmark</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={formData.landmark} onChange={e => setFormData({ ...formData, landmark: e.target.value })} placeholder="Near Park" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Email (Optional)</label>
                                    <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 mt-6">
                                Save Address
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        {!cartItems.length ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                </div>
                                <p className="font-bold text-lg mb-2">Your Cart is Empty</p>
                                <p className="text-xs mb-6">Add items to start shopping</p>
                                <button onClick={onClose} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Browse Products</button>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pb-64">
                                {savings > 0 && (
                                    <div className="bg-green-50 px-4 py-2 flex items-center justify-center gap-2 border-b border-green-100">
                                        <span className="text-xs font-bold text-green-700">Yay! You saved ₹{savings.toFixed(0)} on this order</span>
                                        <div className="bg-white rounded-full p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></div>
                                    </div>
                                )}

                                <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {cartItems.map((item) => {
                                        const product = itemsDetail[item.id] || {};
                                        const sellingPrice = (product.product_discount_price > 0) ? product.product_discount_price : product.product_price;
                                        return (
                                            <div key={item.id} className="flex gap-3 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                <div className="w-12 h-12 rounded-lg border border-gray-100 bg-white p-1 shrink-0">
                                                    <img src={getImageUrl(product.product_image)} alt={product.product_name} className="w-full h-full object-contain" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=500&q=80'} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 max-w-[150px]">{product.product_name}</h4>
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-gray-900">₹{(sellingPrice * item.qty).toFixed(0)}</div>
                                                            {product.product_discount_price > 0 && (
                                                                <div className="text-[10px] text-gray-400 line-through">₹{(product.product_price * item.qty).toFixed(0)}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mb-2">{product.unit || '1 pack'}</div>

                                                    <div className="flex items-center bg-emerald-50 border border-emerald-100 rounded-lg w-20 h-7">
                                                        <button onClick={() => onRemove(item.id)} className="w-7 h-full flex items-center justify-center text-emerald-700 font-bold hover:bg-emerald-100 rounded-l-lg transition-colors text-lg leading-none pb-1">-</button>
                                                        <span className="flex-1 text-center text-xs font-bold text-emerald-800">{item.qty}</span>
                                                        <button onClick={() => onAdd(item.id)} className="w-7 h-full flex items-center justify-center text-emerald-700 font-bold hover:bg-emerald-100 rounded-r-lg transition-colors text-lg leading-none pb-1">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mx-4 mt-6">
                                    <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Bill Details</h3>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span>Item Total (MRP)</span>
                                            <span className="font-medium text-gray-900 shadow-sm px-1 rounded bg-gray-50">₹{totalMRP.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 border-b border-dashed border-gray-200 pb-2">
                                            <span>Discounted Price</span>
                                            <span className="font-bold text-emerald-600">₹{totalSelling.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600 pt-1">
                                            <span className="underline decoration-dotted">Handling Charge</span>
                                            <span className="font-bold text-gray-900">₹{handlingFee}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-600">
                                            <span className="underline decoration-dotted">Delivery Fee</span>
                                            <span className="font-bold text-gray-900">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-3 border-t border-gray-100 mt-1">
                                            <span>To Pay</span>
                                            <span>₹{toPay.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <div className="bg-white border-t border-gray-100 p-4 pb-6 absolute bottom-0 w-full z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <div onClick={() => setShowAddressForm(true)} className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="bg-white p-1.5 rounded-full shadow-sm text-indigo-600"><LocationIcon /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-900">{address ? 'Delivering to:' : 'Select Delivery Address'}</span>
                                            <ChevronDownIcon />
                                        </div>
                                        <p className="text-[10px] text-gray-500 truncate">
                                            {address ? `${address.houseNo}, ${address.landmark}, ${address.location || address.pincode}` : 'Add your location and address details'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{address ? 'Change' : 'Add'}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'ONLINE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} onClick={() => setPaymentMethod('ONLINE')}>
                                        <span className="font-bold text-sm">Online Pay</span>
                                        <span className="text-[10px] opacity-75">Pay via UPI/Card</span>
                                    </button>
                                    <button className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'COD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} onClick={() => setPaymentMethod('COD')}>
                                        <span className="font-bold text-sm">Cash on Delivery</span>
                                        <span className="text-[10px] opacity-75">Pay at Doorstep</span>
                                    </button>
                                </div>

                                <button disabled={loading} onClick={handleCheckout} className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-pink-200 transition-all transform active:scale-[0.99] text-base flex justify-between px-6 items-center disabled:opacity-70 disabled:cursor-not-allowed`}>
                                    <span className="flex flex-col items-start leading-none">
                                        <span className="text-xs opacity-90 font-medium mb-0.5">Total</span>
                                        <span>₹{toPay.toFixed(0)}</span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {loading ? 'Processing...' : (paymentMethod === 'COD' ? 'Place Order' : 'Click to Pay')}
                                        {!loading && <ChevronDownIcon className="rotate-[-90deg]" />}
                                    </span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
