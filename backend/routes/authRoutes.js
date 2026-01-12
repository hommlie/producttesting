const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, debugOtps, debugOtpsAll } = require('../src/controllers/authController');

router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.get('/auth/debug-otps', debugOtps);
router.get('/auth/debug-otps-all', debugOtpsAll);

// Compatibility endpoints used by other projects / older frontend
router.post('/register', (req, res, next) => {
	// expects { mobile: '+911234567890' } or '9123456789'
	req.body = req.body || {};
	req.body.phone = req.body.mobile || req.body.phone;
	return sendOtp(req, res, next);
});

router.post('/verifyotp', (req, res, next) => {
	// expects { mobile: '+911234567890', otp: '123456', name?, referral_code?, app_token? }
	req.body = req.body || {};
	// map mobile -> phone and keep other fields
	if (req.body.mobile) req.body.phone = req.body.mobile;
	// adapt app_token -> token if present (verify flow may expect token field)
	if (req.body.app_token) req.body.app_token = req.body.app_token;
	return verifyOtp(req, res, next);
});

router.post('/resendotp', (req, res, next) => {
	req.body = req.body || {};
	req.body.phone = req.body.mobile || req.body.phone;
	// Re-send by invoking sendOtp again
	return sendOtp(req, res, next);
});

module.exports = router;
