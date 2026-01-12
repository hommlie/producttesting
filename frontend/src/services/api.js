const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const getCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error (getCategories):", error);
        throw error;
    }
};

export const getSubcategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/subcategories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error (getSubcategories):", error);
        throw error;
    }
};

export const getProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API Error (getProducts):", error);
        throw error;
    }
};

export const sendOtp = async (phone) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (sendOtp):', error);
        throw error;
    }
};

export const verifyOtp = async ({ phone, otp, name }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, name })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (verifyOtp):', error);
        throw error;
    }
};

export const getCart = async (token) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch cart');
        return await response.json();
    } catch (error) {
        console.error('API Error (getCart):', error);
        throw error;
    }
};

export const addToCartApi = async (token, productId, quantity) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_id: productId, quantity })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (addToCartApi):', error);
        throw error;
    }
};

export const updateCartItemApi = async (token, productId, quantity) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_id: productId, quantity })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (updateCartItemApi):', error);
        throw error;
    }
};

export const removeFromCartApi = async (token, productId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_id: productId })
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (removeFromCartApi):', error);
        throw error;
    }
};

export const createOrderApi = async (token, orderData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${data.error || 'Unknown error'}`);
            }
            return data;
        } catch (e) {
            // Check if it was indeed the JSON parse error or the throw above
            if (!response.ok) {
                throw new Error(text || `HTTP Error ${response.status}`);
            }
            throw e;
        }
    } catch (error) {
        console.error('API Error (createOrderApi):', error);
        throw error;
    }
};

export const verifyPaymentApi = async (token, paymentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });
        return await response.json();
    } catch (error) {
        console.error('API Error (verifyPaymentApi):', error);
        throw error;
    }
};
