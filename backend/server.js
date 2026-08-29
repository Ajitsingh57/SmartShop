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

// Middlewares
app.use(cors());
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

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SmartShop API running"
  });
});

// Centralized JSON error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error"
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