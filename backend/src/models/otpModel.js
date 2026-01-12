const { pool } = require('../../db');

async function createOtp(phone, otp, expiryMinutes = 3) {
  const [result] = await pool.query(
    'INSERT INTO otps (phone, otp, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))',
    [phone, otp, expiryMinutes]
  );
  try {
    // console.log(`createOtp: inserted id=${result.insertId} phone=${phone} otp_len=${String(otp).length}`);
  } catch (e) {
    // ignore logging errors
  }
  return { id: result.insertId };
}

async function updateOtpById(id, otp) {
  await pool.query('UPDATE otps SET otp = ? WHERE id = ?', [otp, id]);
}

async function getLatestValidOtp(phone) {
  // Try to find by exact phone first, and allow several fallbacks.
  // Perform expiry checks in JS (using UTC comparison) to avoid DB timezone issues.
  const phoneStr = String(phone || '');
  const last10 = phoneStr.slice(-10);
  const likePhone = `%${phoneStr}%`;
  const likeLast10 = `%${last10}%`;
  const [rows] = await pool.query(
    'SELECT * FROM otps WHERE (phone = ? OR phone = ? OR phone LIKE ? OR phone LIKE ?) ORDER BY id DESC LIMIT 50',
    [phoneStr, last10, likePhone, likeLast10]
  );
  if (!rows || rows.length === 0) return undefined;
  const now = new Date();
  for (const r of rows) {
    const expires = new Date(r.expires_at);
    if (expires > now) return r;
  }
  return undefined;
}

async function deleteOtpById(id) {
  await pool.query('DELETE FROM otps WHERE id = ?', [id]);
}

async function setRequestId(id, requestId) {
  await pool.query('UPDATE otps SET request_id = ? WHERE id = ?', [requestId, id]);
}

module.exports = { createOtp, updateOtpById, getLatestValidOtp, deleteOtpById, setRequestId };
