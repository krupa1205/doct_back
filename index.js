require("dotenv").config({ path: './config.env' });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;

// Import routes
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const specialtyRoutes = require("./routes/specialtyRoutes");
const sessionRouter = require("./routes/session.js");
const messageRouter = require("./routes/message.js");

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN ? 
            process.env.CORS_ORIGIN.split(',') : 
            ['http://localhost:5173', 'http://localhost:5174'];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/specialties', specialtyRoutes);

// Legacy routes (to maintain compatibility with existing RAG service)
app.use("/", sessionRouter);
app.use("/", messageRouter);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📊 Health check available at: http://localhost:${port}/health`);
    console.log(`🔗 API base URL: http://localhost:${port}/api`);
});
