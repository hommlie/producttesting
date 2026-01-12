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

export default function Header({ cartCount, onCategorySelect, selectedCategory, onCartClick }) {
    const navigate = useNavigate();
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
        ...categories.map(cat => ({
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
            <div className="bg-white sticky top-0 z-50 shadow-sm font-sans">
                {/* Top Bar */}
                <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between gap-4">

                    {/* Brand & Delivery */}
                    <div className="flex items-center gap-6 min-w-fit">
                        {/* Logo */}
                        <div className="flex flex-col leading-none cursor-pointer" onClick={() => navigate('/')}>
                            <img
                                src="/hommlieloogo.png"
                                alt="Hommlie Logo"
                                className="h-10 w-auto"
                            />
                        </div>

                        {/* Delivery Location Divider */}
                        <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>

                        {/* Delivery Info */}
                        <div className="hidden md:flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-extrabold text-sm text-gray-900">10 minutes</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-indigo-600 transition-colors">
                                <span className="truncate max-w-[150px]" title={locationName}>{locationName}</span>
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>

                    {/* Search Bar - Centered & Wide */}
                    <div className="flex-1 max-w-3xl px-4 hidden lg:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                                placeholder='Search for "termite spray"'
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-8 min-w-fit">
                        {user ? (
                            <div className="hidden sm:flex items-center gap-3">
                                <span className="text-gray-900 font-bold text-sm truncate max-w-[150px]">
                                    {user.name}
                                </span>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('HommlieUserjwtToken');
                                        localStorage.removeItem('HommlieUserData');
                                        setUser(null);
                                        window.location.reload();
                                    }}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowLogin(true)} className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
                                <UserIcon />
                                <span>Login</span>
                            </button>
                        )}

                        <button
                            onClick={onCartClick}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                        >
                            <CartIcon />
                            <span>My Cart</span>
                            {cartCount > 0 && (
                                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Secondary Navigation - Categories */}
                <div className="border-t border-gray-100 bg-white">
                    <div className="max-w-[1400px] mx-auto px-4">
                        <div className="flex items-center gap-8 overflow-x-auto py-3 scrollbar-hide">
                            {navItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => handleCategoryClick(item.name)}
                                    className={`flex-shrink-0 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === item.name
                                        ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 pb-0.5'
                                        : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <span className="text-lg opacity-80">{item.icon}</span>
                                    {item.name}
                                </button>
                            ))}
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
            )}
        </>
    );
}
