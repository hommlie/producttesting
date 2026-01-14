import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-1 text-gray-500" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

import { getCategories, sendOtp, verifyOtp } from '../../services/api';

export default function Header({ cartCount, onCategorySelect, selectedCategory, onCartClick, isTransparent = false }) {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const [categories, setCategories] = useState([]);
    const [showLogin, setShowLogin] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [askName, setAskName] = useState(false);
    const [msg, setMsg] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [user, setUser] = useState(null);

    function normalizePhoneForSubmit(raw) {
        if (!raw) return '';
        const digits = String(raw).replace(/[^0-9]/g, '');
        // If user entered 10 digits, assume India and prefix 91
        if (digits.length === 10) return '91' + digits;
        // If user entered 11 digits starting with 0, drop the 0 and prefix 91
        if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1);
        // If already includes country code like 919..., return as-is
        return digits;
    }

    const [locationName, setLocationName] = useState('Detecting location...');

    useEffect(() => {
        const fetchCategoriesData = async () => {
            try {
                const data = await getCategories();
                if (data.success) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategoriesData();

        const storedUser = localStorage.getItem('HommlieUserData');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }

        // Location Detection
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    if (!apiKey) {
                        console.warn("Google Maps API Key not found in env");
                        setLocationName("Location API Key Missing");
                        return;
                    }

                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const data = await response.json();

                    if (data.status === 'OK' && data.results.length > 0) {
                        // Use the first result's formatted address
                        // Or try to construct a shorter one if needed. using formatted_address for now.
                        setLocationName(data.results[0].formatted_address);
                    } else {
                        setLocationName("Location not found");
                    }
                } catch (error) {
                    console.error("Error fetching address:", error);
                    setLocationName("Location Error");
                }
            }, (error) => {
                console.warn("Geolocation permission denied or error:", error);
                // Fallback or keep 'Detecting...' or set specific message
                // Maybe default to a generic location or keep static as previous if permission denied?
                // User asked to "integrate user login location auto deduction", imply replacing static.
                setLocationName("Select Location");
            });
        }
    }, []);

    const navItems = [
        { name: 'All', icon: '🛍️' },
        ...categories.filter(cat => cat.category_status === 1).map(cat => ({
            name: cat.category_name,
            icon: '🛍️'
        }))
    ];

    const handleCategoryClick = (catName) => {
        if (catName === 'All') {
            navigate('/');
        } else {
            navigate(`/category/${catName}`);
        }
        if (onCategorySelect) onCategorySelect(catName);
    };

    return (
        <>

            <div className={`z-50 font-sans transition-all duration-500 ${isTransparent ? 'fixed top-0 left-0 right-0' : 'sticky top-0'}`}>
                {/* Top Bar - Dynamic Background & Height */}
                <div className={`transition-all duration-500 overflow-hidden ${isTransparent && scrolled ? 'h-0 opacity-0' : 'h-16 md:h-20 opacity-100'} ${isTransparent && !scrolled ? 'bg-transparent shadow-none' : 'bg-white shadow-sm'}`}>
                    <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-3 lg:gap-12">

                        {/* Brand & Delivery */}
                        <div className="flex items-center gap-3 md:gap-6 min-w-fit">
                            {/* Logo */}
                            <div className="flex flex-col leading-none cursor-pointer group" onClick={() => navigate('/')}>
                                <img
                                    src="/hommlieloogo.png"
                                    alt="Hommlie Logo"
                                    className={`h-8 md:h-11 w-auto transition-all duration-300 ${isTransparent && !scrolled ? 'brightness-0 invert' : ''}`}
                                />
                            </div>

                            {/* Delivery Info */}
                            <div className="hidden md:flex flex-col border-l border-gray-100 pl-6 cursor-pointer group">
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-black text-xs uppercase tracking-wider ${isTransparent && !scrolled ? 'text-white' : 'text-gray-900'}`}>Delivery in 24 hrs</span>
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-semibold transition-colors ${isTransparent && !scrolled ? 'text-white/80' : 'text-gray-500 group-hover:text-primary'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isTransparent && !scrolled ? 'text-accent' : 'text-primary'}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                    <span className="truncate max-w-[180px]" title={locationName}>{locationName}</span>
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>

                        {/* Search Bar - Premium Centered */}
                        <div className="flex-1 max-w-2xl px-2 hidden lg:block">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-12 pr-4 py-3.5 border rounded-2xl text-[15px] transition-all duration-300 shadow-sm ${isTransparent && !scrolled ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder-white/60 focus:bg-white/20' : 'bg-gray-50/80 border-gray-100/50 text-gray-900 focus:bg-white'}`}
                                    placeholder='Search "termite spray" or "herbal pest controller"'
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4 lg:gap-8 min-w-fit">
                            {user ? (
                                <div className="hidden sm:flex items-center gap-4">
                                    <div className={`flex flex-col items-end ${isTransparent && !scrolled ? 'text-white' : 'text-gray-900'}`}>
                                        <span className="font-black text-[10px] uppercase tracking-tight truncate max-w-[120px] drop-shadow-sm">
                                            {user.name}
                                        </span>
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('HommlieUserjwtToken');
                                                localStorage.removeItem('HommlieUserData');
                                                setUser(null);
                                                window.location.reload();
                                            }}
                                            className="text-[9px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em] drop-shadow-sm"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 transition-all duration-300 ${isTransparent && !scrolled ? 'bg-white/20 text-white border-white/40 backdrop-blur-md' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                        {user.name?.[0]?.toUpperCase()}
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowLogin(true)} className={`hidden sm:flex items-center gap-2.5 font-bold text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95`}>
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm ${isTransparent && !scrolled ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-50 text-gray-700'}`}>
                                        <UserIcon />
                                    </div>
                                    <span className={`uppercase tracking-widest text-[10px] font-black ${isTransparent && !scrolled ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>Login</span>
                                </button>
                            )}

                            <button
                                onClick={onCartClick}
                                className="group flex items-center gap-1.5 md:gap-2.5 bg-primary text-white pl-3 md:pl-5 pr-1 md:pr-1.5 py-1 md:py-1.5 rounded-xl md:rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
                            >
                                <span className="uppercase tracking-widest text-[11px] hidden xl:inline">My Cart</span>
                                <div className="flex items-center gap-1.5 md:gap-2 bg-white/20 px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                    <CartIcon />
                                    {cartCount > 0 && (
                                        <span className="font-black text-sm md:text-base">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary Navigation - Settle at top on scroll */}
                <div className={`transition-all duration-500 sticky top-0 z-40 overflow-x-auto whitespace-nowrap scrollbar-hide ${isTransparent && !scrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border-b border-gray-100'}`}>
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex items-center justify-between gap-2 md:gap-4 px-2 md:px-4 lg:pl-10 pr-2 md:pr-4">
                            <div className="flex items-center gap-4 md:gap-10 overflow-x-auto py-2 md:py-2.5 scrollbar-hide flex-1">
                                {navItems.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => handleCategoryClick(item.name)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all relative py-1.5 md:py-2 ${selectedCategory === item.name
                                            ? (isTransparent && !scrolled ? 'text-white' : 'text-gray-900')
                                            : (isTransparent && !scrolled ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                                            }`}
                                    >
                                        <span className={`text-sm md:text-base filter transition-all duration-300 ${selectedCategory === item.name ? 'grayscale-0 scale-110 drop-shadow-md' : 'grayscale opacity-60'}`}>{item.icon}</span>
                                        <span className="whitespace-nowrap">{item.name}</span>
                                        {selectedCategory === item.name && (
                                            <div className={`absolute bottom-0 left-0 right-0 h-0.5 md:h-1 rounded-t-full transition-all duration-300 ${isTransparent && !scrolled ? 'bg-white shadow-[0_-2px_8px_rgba(255,255,255,0.4)]' : 'bg-primary shadow-[0_-2px_8px_rgba(99,102,241,0.4)]'}`}></div>
                                        )}
                                    </button>
                                ))}
                                {/* Add padding element for better scroll */}
                                <div className="w-4 flex-shrink-0 md:hidden"></div>
                            </div>

                            {/* Sticky Cart - Visible on scroll only when top bar is hidden */}
                            {scrolled && isTransparent && (
                                <button
                                    onClick={onCartClick}
                                    className="flex-shrink-0 flex items-center gap-1.5 md:gap-2 bg-primary text-white px-2 md:px-4 py-1.5 rounded-lg md:rounded-xl font-bold text-[9px] md:text-[10px] hover:bg-primary-dark transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95 my-1.5 md:my-2 uppercase tracking-widest"
                                >
                                    <div className="flex items-center gap-1 md:gap-1.5 pt-0.5">
                                        <CartIcon />
                                        {cartCount > 0 && <span className="font-black text-xs">{cartCount}</span>}
                                    </div>
                                    <span className="hidden sm:inline">My Cart</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showLogin && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-3">Login / OTP</h3>
                        {msg && <div className="text-sm text-red-600 mb-2">{msg}</div>}
                        {!otpSent && (
                            <>
                                <label className="block text-xs text-gray-600">Mobile number</label>
                                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" placeholder="e.g. +911234567890" />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setShowLogin(false)} className="px-3 py-2">Cancel</button>
                                    <button onClick={async () => {
                                        setMsg('');
                                        try {
                                            const payloadPhone = normalizePhoneForSubmit(phone);
                                            const res = await sendOtp(payloadPhone);
                                            if (res.success) {
                                                setMsg('OTP sent — please check your phone');
                                                setOtpSent(true);
                                            } else setMsg(res.message || 'Failed to send OTP');
                                        } catch (err) {
                                            setMsg('Failed to send OTP');
                                        }
                                    }} className="px-3 py-2 bg-indigo-600 text-white rounded">Send OTP</button>
                                </div>
                            </>
                        )}

                        {otpSent && (
                            <div className="mt-3">
                                <label className="block text-xs text-gray-600">Enter OTP</label>
                                <input value={otp} onChange={e => setOtp(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" placeholder="6-digit code" />
                                {askName && (
                                    <>
                                        <label className="block text-xs text-gray-600">Your name</label>
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" placeholder="Full name" />
                                    </>
                                )}
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setShowLogin(false); setOtp(''); setAskName(false); setMsg(''); }} className="px-3 py-2">Close</button>
                                    <button onClick={async () => {
                                        setMsg('');
                                        try {
                                            const payloadPhone = normalizePhoneForSubmit(phone);
                                            const res = await verifyOtp({ phone: payloadPhone, otp, name: askName ? name : undefined });
                                            if (!res.success) {
                                                setMsg(res.message || 'OTP verification failed');
                                                return;
                                            }
                                            if (res.askName) {
                                                setAskName(true);
                                                setMsg('Please enter your name to complete signup');
                                                return;
                                            }
                                            // success: user returned
                                            // store token if provided (mobile app compatibility)
                                            if (res.token) localStorage.setItem('HommlieUserjwtToken', res.token);
                                            if (res.user) {
                                                localStorage.setItem('HommlieUserData', JSON.stringify(res.user));
                                                setUser(res.user);
                                            }

                                            setMsg('Login successful');
                                            setShowLogin(false);
                                            setPhone(''); setOtp(''); setName(''); setAskName(false);
                                            setOtpSent(false);
                                            // redirect to home after successful login
                                            navigate('/');
                                        } catch (err) {
                                            setMsg('Verification failed');
                                        }
                                    }} className="px-3 py-2 bg-indigo-600 text-white rounded">Verify</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </>
    );
}
