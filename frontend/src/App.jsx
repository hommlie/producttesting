import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './components/homepage';
import CategoryPage from './components/category-page';
import ProductDetails from './components/product-details';
import CartDrawer from './components/cart-drawer';
import AddedToCartToast from './components/added-to-cart-toast';
import { getProducts, getCart, addToCartApi, updateCartItemApi, removeFromCartApi } from './services/api';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('HommlieCart');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('HommlieCart', JSON.stringify(cart));
  }, [cart]);
  const [recentlyAddedItem, setRecentlyAddedItem] = useState(null);
  const [isToastOpen, setIsToastOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Error fetching products in App:", error);
      }
    };
    fetchProducts();
  }, []);

  // Fetch cart if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('HommlieUserjwtToken');
    if (token) {
      getCart(token).then(res => {
        if (res.success) {
          // Convert array [{product_id, quantity}] to object { [id]: qty }
          const newCart = {};
          res.data.forEach(item => {
            newCart[item.product_id] = item.quantity;
          });
          setCart(newCart);
        }
      }).catch(err => console.error(err));
    }
  }, []);

  const productsMap = useMemo(() => {
    return products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  }, [products]);

  const addToCart = async (productId) => {
    // Optimistic update
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    setRecentlyAddedItem(productsMap[productId]);
    setIsToastOpen(true);

    // Sync with backend
    const token = localStorage.getItem('HommlieUserjwtToken');
    if (token) {
      try {
        const res = await addToCartApi(token, productId, 1);
        if (res.success) {
          const newCart = {};
          res.data.forEach(item => { newCart[item.product_id] = item.quantity; });
          setCart(newCart);
        }
      } catch (err) {
        console.error("Failed to sync cart", err);
      }
    }
  };

  const removeFromCart = async (productId) => {
    // Current qty
    const currentQty = cart[productId] || 0;
    if (currentQty === 0) return;

    // Optimistic update
    setCart(prev => {
      const newCount = (prev[productId] || 0) - 1;
      if (newCount <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newCount };
    });

    // Sync with backend
    const token = localStorage.getItem('HommlieUserjwtToken');
    if (token) {
      try {
        let res;
        if (currentQty - 1 <= 0) {
          res = await removeFromCartApi(token, productId);
        } else {
          res = await updateCartItemApi(token, productId, currentQty - 1);
        }
        if (res && res.success) {
          const newCart = {};
          res.data.forEach(item => { newCart[item.product_id] = item.quantity; });
          setCart(newCart);
        }
      } catch (err) {
        console.error("Failed to sync cart", err);
      }
    }
  };

  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartItemsArray = Object.entries(cart).map(([id, qty]) => ({ id: parseInt(id), qty }));

  return (
    <Router>
      <AddedToCartToast
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        product={recentlyAddedItem}
        onGoToCart={() => {
          setIsToastOpen(false);
          setIsCartOpen(true);
        }}
      />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItemsArray}
        itemsDetail={productsMap}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onClearCart={() => setCart({})}
      />

      <Routes>
        <Route
          path="/"
          element={
            <Homepage
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              onCartClick={() => setIsCartOpen(true)}
            />
          }
        />
        <Route
          path="/category/:categoryName"
          element={
            <CategoryPage
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              onCartClick={() => setIsCartOpen(true)}
              cartTotalItems={cartTotalItems}
            />
          }
        />
        <Route
          path="/category/:categoryName/:subcategoryName"
          element={
            <CategoryPage
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              onCartClick={() => setIsCartOpen(true)}
              cartTotalItems={cartTotalItems}
            />
          }
        />
        <Route
          path="/product/:productName"
          element={
            <ProductDetails
              cartCount={cartTotalItems}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              onCartClick={() => setIsCartOpen(true)}
              onBack={() => window.history.back()}
              product={null} // ProductDetails should fetch its own or use useParams
            />
          }
        />
        <Route path="/category/All" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
