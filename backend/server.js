import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import https from "https";
import helmet from "helmet";
import fs from "fs";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { constants as cryptoConstants } from "crypto";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Remove X-Powered-By header
app.disable("x-powered-by");

// Set secure HTTP Headers (general protections + CSP)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives : {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
    },
}));

// CORS configuration to allow frontend access
app.use(cors({
    origin: ['http://localhost:3000', 'https://localhost:3000', 'http://localhost:3001', 'https://localhost:3001'],
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limit repeated requests to public API
const limiter = rateLimit({
    // 15 minutes
    windowMs: 15 * 60 * 1000, 
    // Limit each IP to 100 reuests per windoMs
    limit: 100,
    message: {message: "Too many requests, please try again later."},
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply global rate limiting to API routes
app.use('/api', limiter);

// Enforce HTTPS when deployed
app.enable("trust proxy");
app.use((req, res, next) => {
    if(process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
});

// Basic middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Prevent NoSQL injection operators in req data
// Use a custom wrapper to sanitize body and params only.
// Some router implementations expose `req.query` as a read-only getter,
// which causes `express-mongo-sanitize` to throw when attempting to reassign it.
// We avoid touching `req.query` here and rely on per-route validation for query strings.
app.use((req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      mongoSanitize.sanitize(req.body, { replaceWith: "_" });
    }
    if (req.params && typeof req.params === 'object') {
      mongoSanitize.sanitize(req.params, { replaceWith: "_" });
    }
  } catch (e) {
    // Continue without blocking the request on sanitization edge cases
  }
  next();
});

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('combined'));
}

// Test endpoint
app.get("/test", (req, res) => {
    res.json({ message: "Server is running!" });
});

// Web application Firewall - protection against SQL Injection, XSS, etc
app.use((req, res, next) => {
    const payload = JSON.stringify(req.body);
    const backlist = [
        /<script.*?>.*?<\/script>/gi,
        /(\%27)(\')|(\-\-)|(\%23)|(#)/i,
        /<.*?on\w+=/gi
    ];
    for(const pattern of backlist){
        if(pattern.test(payload)){
            return res.status(403).json({message: "Malicious payload detected."})
        }
    }
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);


// Connect to MongoDB
const connectionString = process.env.ATLAS_URI || "mongodb://localhost:27017/international-payment";

mongoose
    .connect(connectionString)
    .then(() => {
        console.log(" Connected to MongoDB Atlas");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        console.log("Server will continue running without database connection");
    });

// SSL/TLS Configuration
const sslKeyPath = path.join(__dirname, 'ssl', 'server.key');
const sslCertPath = path.join(__dirname, 'ssl', 'server.cert');

let httpsOptions = null;
let useHTTPS = false;

// Check if SSL certificate and key exist
if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    try {
        httpsOptions = {
            key: fs.readFileSync(sslKeyPath),
            cert: fs.readFileSync(sslCertPath)
        };
        useHTTPS = true;
        console.log('SSL certificate and key loaded successfully');
    } catch (error) {
        console.error('Warning: Could not load SSL certificate:', error.message);
        console.log('   Falling back to HTTP');
    }
} else {
    console.log('Warning: SSL certificate not found');
    console.log('   Falling back to HTTP');
}

// Start server
const PORT = process.env.PORT || 4000;

if (useHTTPS) {
    // Start HTTPS server
    const httpsServer = https.createServer({
        ...httpsOptions,
        honorCipherOrder: true,
        secureOptions: cryptoConstants.SSL_OP_NO_TLSv1 | cryptoConstants.SSL_OP_NO_TLSv1_1,
        ciphers: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'TLS_AES_128_GCM_SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES256-GCM-SHA384',
            'ECDHE-ECDSA-CHACHA20-POLY1305',
            'ECDHE-RSA-CHACHA20-POLY1305',
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-RSA-AES128-GCM-SHA256'
        ].join(':'),
    }, app);

    // Harden timeouts against slowloris
    httpsServer.requestTimeout = 60000; // 60s
    httpsServer.headersTimeout = 65000; // 65s

    // Enable HSTS (only meaningful over HTTPS)
    app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));

    httpsServer.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`HTTPS Server running on port ${PORT}`);
        console.log(`Access at: https://localhost:${PORT}`);
        console.log('='.repeat(60));
    });
} else {
    // Fallback to HTTP server
    const httpServer = app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`HTTP Server running on port ${PORT}`);
        console.log(`Access at: http://localhost:${PORT}`);
        console.log('='.repeat(60));
    });
    httpServer.requestTimeout = 60000;
    httpServer.headersTimeout = 65000;
}