const { findCustomerByPhone, createCustomer } = require('../models/userModel');
const { createOtp, updateOtpById, getLatestValidOtp, deleteOtpById, setRequestId } = require('../models/otpModel');
const { pool } = require('../../db');

const axios = require('axios');
const jwt = require('jsonwebtoken');

const SMS_CONFIG = {
  templateId: process.env.SMS_TEMPLATE_ID || '67d0065ad6fc055648017574',
  senderId: process.env.SMS_SENDER_ID || 'HOMLIE',
  apiUrl: process.env.SMS_API_URL || undefined,
  apiKey: process.env.SMS_API_KEY || undefined,
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || process.env.SMS_TEMPLATE_ID || '67d0065ad6fc055648017574',
  msg91AuthKey: process.env.MSG91_AUTH_KEY || undefined
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneForStore(phone) {
  if (!phone) return phone;
  const digits = phone.replace(/[^0-9]/g, '');
  // if 10 digits, assume India and prefix 91
  if (digits.length === 10) return '91' + digits;
  // if already includes country code (like 919xxxxxxxxx), return as-is
  return digits;
}

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });

    const otp = generateOtp();
    const expiryMinutes = parseInt(process.env.MSG91_OTP_EXPIRY || process.env.OTP_TTL_MINUTES, 10) || 3;
    // store and send using a normalized form (always digits, prefix country code for 10-digit numbers)
    const normalized = normalizePhoneForStore(phone);
    const created = await createOtp(normalized, otp, expiryMinutes);
    const otpId = created.id;

    // Send via MSG91 (template or plain sendsms fallback)
    try {
      if (!SMS_CONFIG.msg91AuthKey) {
        console.error('MSG91 auth key not configured');
        return res.status(500).json({ success: false, message: 'MSG91 auth key not configured on server' });
      }
      // Prefer v5 OTP (template) when explicitly enabled, or when
      // real-time response is requested --- this returns the OTP in
      // the HTTP response which helps real-time verification flows.
      const useTemplate = process.env.MSG91_USE_TEMPLATE === '1' || process.env.MSG91_REALTIME === '1';
      // use normalized number (e.g. 9198xxxx) for provider calls
      const mobile = normalized; // already digits-only and includes country code when appropriate

      if (useTemplate) {
        // Send JSON body for v5/otp (expects JSON input)
        const msg91Url = 'https://control.msg91.com/api/v5/otp';
        const body = {
          mobile: mobile,
          template_id: SMS_CONFIG.msg91TemplateId,
          otp_expiry: process.env.MSG91_OTP_EXPIRY || '3',
          realTimeResponse: process.env.MSG91_REALTIME || '1',
          otp: otp
        };
        const headers = { 'Content-Type': 'application/json', 'authkey': SMS_CONFIG.msg91AuthKey };
        const resp = await axios.post(msg91Url, body, { headers });
        console.log('MSG91 template response:', resp.data);
        const respData = resp.data || {};
        const returnedOtp = respData.otp || respData.otp_code || respData.response?.otp || respData?.data?.otp;
        if (returnedOtp) await updateOtpById(otpId, String(returnedOtp));
        // store request id if present
        if (respData.request_id) await require('../models/otpModel').setRequestId(otpId, respData.request_id);
      } else {
        // Use v2 sendsms with query params (GET)
        const msg91Url = 'https://control.msg91.com/api/v2/sendsms';
        // Prepare mobiles for v2/sendsms: when passing a `country` param,
        // the provider expects the `mobiles` field to be local numbers
        // (without the country prefix). If we already have the full
        // number (e.g. 9198...), strip the country prefix for `mobiles`.
        const mobilesFull = mobile;
        const countryParam = process.env.MSG91_COUNTRY || '91';
        let mobilesForApi = mobilesFull;
        if (countryParam && mobilesFull.startsWith(countryParam)) {
          mobilesForApi = mobilesFull.slice(countryParam.length);
        }
        const params = {
          authkey: SMS_CONFIG.msg91AuthKey,
          mobiles: mobilesForApi,
          message: `Your Hommlie OTP is ${otp}`,
          sender: process.env.MSG91_SENDER_ID || SMS_CONFIG.senderId,
          route: process.env.MSG91_ROUTE || '4',
          country: countryParam
        };
        // Log the exact request params (without revealing OTP) for debugging
        console.log('Sending MSG91 v2/sendsms params (debug):', { mobilesLast10: mobile.slice(-10), mobilesFull: mobilesFull, mobilesForApi: mobilesForApi, sender: params.sender, route: params.route, country: params.country });
        const headers = { 'Accept': 'application/json' };
        const resp = await axios.get(msg91Url, { params, headers });
        console.log('MSG91 sendsms status:', resp.status);
        console.log('MSG91 sendsms response data:', resp.data);
        console.log('MSG91 sendsms response headers:', resp.headers);
        // v2/sendsms returns request id as string sometimes; store it
        const respData = resp.data || {};
        // if response is string like '3661686f6772...', store as request id
        const requestId = typeof respData === 'string' ? respData : respData.request_id || respData.requestId || (respData.data && respData.data.request_id);
        if (requestId) await setRequestId(otpId, requestId);
      }
    } catch (err) {
      console.error('MSG91 send error', err?.response?.data || err.message || err);
      return res.status(500).json({ success: false, message: 'Failed to send SMS' });
    }

    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('sendOtp error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function verifyOtp(req, res) {
  try {
    // Accept either `phone` or `mobile` from different frontends
    const { phone: rawPhoneInBody, mobile: mobileInBody, otp, name, app_token } = req.body;
    const rawPhone = rawPhoneInBody || mobileInBody;
    const normPhone = normalizePhoneForStore(rawPhone);
    if (!rawPhone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

    console.log('verifyOtp request:', { rawPhone, normPhone, otpProvided: String(otp).slice(0, 2) + '****' });

    let record = await getLatestValidOtp(normPhone);
    if (!record) {
      // Fallbacks: try last 10, try without country prefix, and try a raw LIKE search
      const last10 = String(normPhone).slice(-10);
      console.log('verifyOtp: primary lookup failed, trying fallbacks for', normPhone);
      record = await getLatestValidOtp(last10);
      if (!record) {
        // try a manual LIKE query (ignore expiry to inspect rows)
        try {
          const [rows] = await pool.query('SELECT * FROM otps WHERE (phone = ? OR phone LIKE ? OR phone LIKE ?) ORDER BY id DESC LIMIT 5', [normPhone, `%${normPhone}%`, `%${last10}%`]);
          console.log('verifyOtp: manual lookup rows (ignore expiry):', rows.map(r => ({ id: r.id, phone: r.phone, expires_at: r.expires_at, otp: r.otp })).slice(0, 10));
          // pick the first non-expired row if any
          for (const r of rows) {
            const expires = new Date(r.expires_at);
            if (expires > new Date()) { record = r; break; }
          }
        } catch (e) {
          console.error('verifyOtp manual lookup error', e.message || e);
        }
      }
      if (!record) {
        console.log('verifyOtp: no record found for', normPhone);
        // As a fallback for development/testing (and to handle small clock skews),
        // search recent OTP rows for this phone and try to match the provided OTP
        try {
          const [recentRows] = await pool.query('SELECT * FROM otps WHERE phone = ? OR phone LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT 20', [normPhone, `%${normPhone}%`, `%${normPhone.slice(-10)}%`]);
          console.log('verifyOtp: recentRows count', recentRows.length);
          const matched = recentRows.find(r => String(r.otp) === String(otp));
          if (matched) {
            console.log('verifyOtp: matched OTP in recent rows (ignoring expiry), id=', matched.id);
            record = matched;
          } else {
            return res.status(400).json({ success: false, message: 'No OTP requested for this number' });
          }
        } catch (e) {
          console.error('verifyOtp fallback error', e.message || e);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
      }
    }

    if (String(record.otp) !== String(otp)) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // Check if customer exists
    let user = await findCustomerByPhone(normPhone);
    // If user exists, create a JWT and return payload compatible with mobile app
    if (user) {
      // OTP verified and user matches, delete OTP
      await deleteOtpById(record.id);
      const token = jwt.sign({ id: user.id, phone: user.phone }, process.env.ACCESS_TOKEN_SECRET || 'secret', { expiresIn: '30d' });
      return res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone }, isNew: false, token, status: 1, user_id: user.id });
    }

    // New user: if frontend hasn't provided a name, ask for it
    if (!name) {
      // Do NOT delete OTP yet. We need it for the next request where name is provided.
      return res.json({ success: true, isNew: true, askName: true });
    }

    // create and return new user + token
    try {
      console.log('verifyOtp: creating new customer', { name, phone: normPhone });
      const newUser = await createCustomer({ name, phone: normPhone });
      console.log('verifyOtp: created customer', newUser);

      // User created, now delete OTP
      await deleteOtpById(record.id);

      const newToken = jwt.sign({ id: newUser.id, phone: newUser.phone }, process.env.ACCESS_TOKEN_SECRET || 'secret', { expiresIn: '30d' });
      return res.json({ success: true, user: newUser, isNew: true, token: newToken, status: 1, user_id: newUser.id });
    } catch (e) {
      console.error('verifyOtp: createCustomer error', e.message || e);
      return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  } catch (err) {
    console.error('verifyOtp error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { sendOtp, verifyOtp };

// Development helper: list recent OTP rows for a phone (use only on local/dev)
async function debugOtps(req, res) {
  try {
    const phone = String(req.query.phone || '');
    if (!phone) return res.status(400).json({ success: false, message: 'phone query required' });
    const digits = phone.replace(/[^0-9]/g, '');
    const normalized = digits.length === 10 ? '91' + digits : digits;
    const last10 = normalized.slice(-10);
    const [rows] = await pool.query(
      'SELECT * FROM otps WHERE phone = ? OR phone = ? OR phone LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT 50',
      [normalized, last10, `%${normalized}%`, `%${last10}%`]
    );
    return res.json({ success: true, count: rows.length, rows });
  } catch (err) {
    console.error('debugOtps error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Development helper: list recent OTP rows (no phone filter)
async function debugOtpsAll(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM otps ORDER BY id DESC LIMIT 100');
    return res.json({ success: true, count: rows.length, rows });
  } catch (err) {
    console.error('debugOtpsAll error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { sendOtp, verifyOtp, debugOtps, debugOtpsAll }; 
