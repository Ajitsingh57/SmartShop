import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import dns from "node:dns";
import path from "path";

import userRouter from "./routes/userRoute.js";
import customerRouter from "./routes/customerRoute.js";
import productRouter from "./routes/productRoute.js";
import creditRouter from "./routes/creditRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import saleRouter from "./routes/saleRoute.js";
import returnRouter from "./routes/returnRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import productRequestRouter from "./routes/productRequestRoute.js";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const app = express();
const port = process.env.PORT || 5000;

// Security response headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS configuration supporting local and cloud deployment origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server) or matching origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api/users", userRouter);
app.use("/api/customers", customerRouter);
app.use("/api/products", productRouter);
app.use("/api/credits", creditRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/sales", saleRouter);
app.use("/api/returns", returnRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/product-requests", productRequestRouter);

// Root and health check endpoints
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartShop API running"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "SmartShop API is operational"
  });
});

// Centralized JSON error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);

  let status = err.status || 500;
  let message = err.message || "Something went wrong. Please try again.";
  let errors = err.errors || {};

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError" && err.errors) {
    status = 400;
    const fieldKeys = Object.keys(err.errors);
    errors = {};
    fieldKeys.forEach((key) => {
      errors[key] = err.errors[key]?.message || "Invalid value entered";
    });
    message = Object.values(errors)[0] || "Please check the entered details";
  }

  // Handle Mongoose CastError (invalid ObjectId or type conversion)
  else if (err.name === "CastError") {
    status = 400;
    message = "The requested record or identifier is invalid";
    if (err.path) {
      errors[err.path] = "Invalid format";
    }
  }

  // Handle MongoDB Duplicate Key Errors (11000)
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    if (field === "phone") {
      message = "This mobile number is already registered. Please login or use a different number.";
      errors.phone = message;
    } else if (field === "email") {
      message = "This email address is already registered. Please login or use a different email.";
      errors.email = message;
    } else if (field === "username") {
      message = "This username is already taken. Please choose another username.";
      errors.username = message;
    } else if (field === "name") {
      message = "An item with this name already exists. Please choose a different name.";
      errors.name = message;
    } else {
      message = `This ${field} is already in use. Please enter a different value.`;
      errors[field] = message;
    }
  }

  // Handle Multer upload errors
  else if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "Image size exceeds the 5MB limit. Please upload a smaller image.";
    errors.image = message;
  }

  // Handle malformed JSON
  else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
    message = "Invalid data format received. Please try again.";
  }

  res.status(status).json({
    success: false,
    message,
    errors
  });
});

// Start database and server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();