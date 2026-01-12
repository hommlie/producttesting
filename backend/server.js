require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, message: 'Backend running' }));

const path = require('path');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', categoryRoutes);
app.use('/api', subcategoryRoutes);
app.use('/api', productRoutes);
app.use('/api', authRoutes);
const cartRoutes = require('./routes/cartRoutes');
app.use('/api', cartRoutes);
const orderRoutes = require('./routes/orderRoutes');
app.use('/api', orderRoutes);

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    return res.json({ connected: true, rows });
  } catch (err) {
    console.error('DB test failed', err);
    return res.status(500).json({ connected: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Test DB connection on startup
async function checkDBConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  checkDBConnection();
});
