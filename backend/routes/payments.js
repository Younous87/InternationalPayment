import express from "express";
import jwt from "jsonwebtoken";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import {
    validateAgainstWhitelist,
    checkForInjectionPatterns
} from "../utils/inputValidation.js";

const router = express.Router();
const JWT_SECRET = "8847ee188f91e31bcb45d6c4c6189c6ca948b9623a52b370d9715528ba253ce66838ce17f38af573320794b398565f6d04a80d062df3c2daa2a20d395d38df66";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token." });
    }
};

// Create a new payment transaction
router.post("/create", verifyToken, async (req, res) => {
    try {
        console.log("Payment request received:", req.body);
        const {
            amount,
            currency,
            provider,
            beneficiaryAccountNumber,
            beneficiaryName,
            beneficiaryBankName,
            swiftCode,
            beneficiaryAddress
        } = req.body;

        // Validate required fields
        if (!amount || !currency || !beneficiaryAccountNumber || !swiftCode) {
            console.log("Validation failed - missing required fields");
            return res.status(400).json({ message: "Amount, currency, beneficiary account number, and SWIFT code are required" });
        }

        // Validate amount
        if (amount <= 0) {
            console.log("Validation failed - invalid amount:", amount);
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        // Whitelist validations
        const accountNumberCheck = validateAgainstWhitelist(beneficiaryAccountNumber, 'accountNumber');
        if (!accountNumberCheck.isValid) {
            return res.status(400).json({ message: "Invalid beneficiary account number" });
        }

        // Currency code must be 3 uppercase letters
        const currencyWhitelist = /^[A-Z]{3}$/;
        if (!currencyWhitelist.test(String(currency).trim())) {
            return res.status(400).json({ message: "Invalid currency code" });
        }

        // Basic injection checks on free-text fields
        const nameThreats = checkForInjectionPatterns(beneficiaryName);
        const bankThreats = checkForInjectionPatterns(beneficiaryBankName);
        const addrThreats = checkForInjectionPatterns(beneficiaryAddress);
        if (!nameThreats.isSafe || !bankThreats.isSafe || !addrThreats.isSafe) {
            return res.status(400).json({ message: "Input validation failed", threats: [...nameThreats.threats, ...bankThreats.threats, ...addrThreats.threats] });
        }

        // Validate SWIFT code format (6 Uppercase Characters, 2 Alphaneumeric Characters, 3 Optional Alphaneumeric Characters)
        const swiftCodeUpper = swiftCode.toUpperCase();
        const swiftCodeRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
        console.log("Testing SWIFT code:", swiftCodeUpper, "against regex:", swiftCodeRegex);
        if (!swiftCodeRegex.test(swiftCodeUpper)) {
            console.log("Validation failed - invalid SWIFT code:", swiftCodeUpper);
            return res.status(400).json({ 
                message: `Invalid SWIFT code format: ${swiftCode}. Must be 8 or 11 characters (6 Uppercase Characters, 2 Alphaneumeric Characters, 3 Optional Alphaneumeric Characters)` 
            });
        }

        // Create new payment transaction with SWIFT as default provider
        // Auto-complete for demo purposes (in production, this would be 'pending')
        const newPayment = new Payment({
            userId: req.user.id,
            amount,
            currency,
            provider: "SWIFT",
            beneficiaryAccountNumber,
            beneficiaryName: beneficiaryName || "Default Beneficiary",
            beneficiaryBankName: beneficiaryBankName || "Default Bank",
            swiftCode,
            beneficiaryAddress: beneficiaryAddress || "Default Address",
            status: 'completed' // Auto-complete for demo/testing
        });

        await newPayment.save();
        console.log("Payment saved successfully:", newPayment.transactionId);

        res.status(201).json({
            message: "Payment transaction created successfully",
            transactionId: newPayment.transactionId,
            payment: {
                id: newPayment._id,
                amount: newPayment.amount,
                currency: newPayment.currency,
                provider: newPayment.provider,
                status: newPayment.status,
                createdAt: newPayment.createdAt
            }
        });

    } catch (error) {
        console.error("Payment creation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get all payments for a user
router.get("/my-payments", verifyToken, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('-__v')
            .populate('userId', 'username email');

        res.json({
            payments,
            count: payments.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get received payments 
router.get("/received", verifyToken, async (req, res) => {
    try {
    
        const payments = await Payment.find({ 
            status: 'completed'
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('-__v')
            .populate('userId', 'username email');

        res.json({
            payments,
            count: payments.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific payment by transaction ID
router.get("/:transactionId", verifyToken, async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Validate transactionId against whitelist and injection patterns
        const txnCheck = validateAgainstWhitelist(transactionId, 'alphanumeric');
        const txnThreats = checkForInjectionPatterns(transactionId);
        if (!txnCheck.isValid || !txnThreats.isSafe) {
            return res.status(400).json({ message: "Invalid transactionId" });
        }
        
        const payment = await Payment.findOne({ 
            transactionId,
            userId: req.user.id 
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json({ payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update payment status (for payment processing)
router.patch("/:transactionId/status", verifyToken, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status } = req.body;

        // Validate transactionId
        const txnCheck = validateAgainstWhitelist(transactionId, 'alphanumeric');
        const txnThreats = checkForInjectionPatterns(transactionId);
        if (!txnCheck.isValid || !txnThreats.isSafe) {
            return res.status(400).json({ message: "Invalid transactionId" });
        }

        const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const payment = await Payment.findOneAndUpdate(
            { transactionId, userId: req.user.id },
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.json({
            message: "Payment status updated successfully",
            payment: {
                transactionId: payment.transactionId,
                status: payment.status,
                updatedAt: payment.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Complete all pending payments for current user (for testing purposes)
router.post("/complete-my-payments", verifyToken, async (req, res) => {
    try {
        const result = await Payment.updateMany(
            { userId: req.user.id, status: 'pending' },
            { status: 'completed', updatedAt: Date.now() }
        );

        res.json({
            message: "Payments marked as completed",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all payments (for testing/debugging)
router.get("/all", async (req, res) => {
    try {
        const payments = await Payment.find().populate('userId', 'username email');
        res.json({
            count: payments.length,
            payments: payments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get currencies
router.get("/currencies/supported", (req, res) => {
    const supportedCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
    ];

    res.json({ currencies: supportedCurrencies });
});

// Get supported payment providers (SWIFT only...for now)
router.get("/providers/supported", (req, res) => {
    const supportedProviders = [
        { 
            code: 'SWIFT', 
            name: 'SWIFT Network', 
            description: 'Society for Worldwide Interbank Financial Telecommunication',
            fees: 'Variable based on amount and destination'
        }
    ];

    res.json({ providers: supportedProviders });
});

export default router;
