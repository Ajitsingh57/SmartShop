import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { sendValidationError } from "../utils/helpers.js";

// Add new product with optional image upload
export async function addProduct(req, res) {
    try {
        const {
            name,
            category,
            price,
            stock,
            unit,
            lowStockLimit,
            description
        } = req.body;

        const errors = {};

        if (!name || !name.trim()) {
            errors.name = "Please enter the product name";
        }

        if (price === undefined || price === null || price === "" || Number.isNaN(Number(price)) || Number(price) <= 0) {
            errors.price = "Product price must be greater than 0";
        }

        if (stock === undefined || stock === null || stock === "" || Number.isNaN(Number(stock)) || Number(stock) < 0) {
            errors.stock = "Stock quantity cannot be negative";
        }

        if (!unit || !String(unit).trim()) {
            errors.unit = "Please select or enter a unit (e.g. kg, pcs, packet)";
        }

        if (!category || !String(category).trim()) {
            errors.category = "Please select a product category";
        }

        if (lowStockLimit !== undefined && lowStockLimit !== "" && (Number.isNaN(Number(lowStockLimit)) || Number(lowStockLimit) < 0)) {
            errors.lowStockLimit = "Low stock alert limit cannot be negative";
        }

        if (Object.keys(errors).length > 0) {
            const firstMsg = Object.values(errors)[0];
            return sendValidationError(res, firstMsg, errors);
        }

        let imageUrl = "";
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        }

        const product = new Product({
            name: name.trim(),
            category: category?.trim() || "General",
            price: Number(price),
            stock: Number(stock),
            unit,
            lowStockLimit: lowStockLimit !== undefined ? Number(lowStockLimit) : 0,
            image: imageUrl,
            description: description?.trim() || "",
            available: Number(stock) > 0,
            deleted: false,
            createdBy: req.user?._id || req.user?.id || null,
            updatedBy: req.user?._id || req.user?.id || null
        });

        await product.save();

        // log product creation activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Created Product",
            category: "Product",
            targetId: product._id,
            targetName: product.name,
            detail: `Added new product '${product.name}' (Price: ₹${product.price}, Stock: ${product.stock} ${product.unit || ""})`
        });

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product
        });
    } catch (err) {
        console.error("Add product error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Fetch all active (non-deleted) products
export async function getProducts(req, res) {
    try {
        const products = await Product.find({ deleted: false }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            products
        });
    } catch (err) {
        console.error("Get products error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Fetch single product by id
export async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, deleted: false });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });
    } catch (err) {
        console.error("Get product error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Update existing product fields and optional replacement image
export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            price,
            stock,
            unit,
            lowStockLimit,
            description,
            available
        } = req.body;

        const product = await Product.findOne({ _id: id, deleted: false });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return sendValidationError(res, "Product name cannot be empty", {
                    name: "Please enter the product name"
                });
            }
            product.name = name.trim();
        }

        if (category !== undefined) {
            if (!String(category).trim()) {
                return sendValidationError(res, "Please select a product category", {
                    category: "Please select a product category"
                });
            }
            product.category = String(category).trim() || "General";
        }

        if (price !== undefined) {
            const newPrice = Number(price);
            if (Number.isNaN(newPrice) || newPrice <= 0) {
                return sendValidationError(res, "Product price must be greater than 0", {
                    price: "Product price must be greater than 0"
                });
            }
            product.price = newPrice;
        }

        if (stock !== undefined) {
            const newStock = Number(stock);
            if (Number.isNaN(newStock) || newStock < 0) {
                return sendValidationError(res, "Stock quantity cannot be negative", {
                    stock: "Stock quantity cannot be negative"
                });
            }
            product.stock = newStock;
        }

        if (unit !== undefined) {
            if (!String(unit).trim()) {
                return sendValidationError(res, "Unit is required", {
                    unit: "Please select or enter a unit"
                });
            }
            product.unit = unit;
        }

        if (lowStockLimit !== undefined) {
            const newLimit = Number(lowStockLimit);
            if (Number.isNaN(newLimit) || newLimit < 0) {
                return sendValidationError(res, "Low stock limit cannot be negative", {
                    lowStockLimit: "Low stock alert limit cannot be negative"
                });
            }
            product.lowStockLimit = newLimit;
        }

        if (description !== undefined) {
            product.description = String(description).trim();
        }

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });
            product.image = result.secure_url;
        }

        // Set availability explicitly or infer from updated stock level
        if (available !== undefined) {
            product.available = available === true || available === "true";
        } else if (stock !== undefined) {
            product.available = Number(stock) > 0;
        }

        if (req.user?._id || req.user?.id) {
            product.updatedBy = req.user._id || req.user.id;
        }

        await product.save();

        // log product update activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Updated Product",
            category: "Product",
            targetId: product._id,
            targetName: product.name,
            detail: `Updated product '${product.name}' (Price: ₹${product.price}, Stock: ${product.stock} ${product.unit || ""})`
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (err) {
        console.error("Update product error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Soft delete product to keep sales historical integrity
export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, deleted: false });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const deletedProductName = product.name;

        product.deleted = true;
        product.available = false;
        if (req.user?._id || req.user?.id) {
            product.updatedBy = req.user._id || req.user.id;
        }
        await product.save();

        // log product deletion activity
        logAdminActivity({
            admin: req.user,
            req,
            action: "Deleted Product",
            category: "Product",
            targetId: product._id,
            targetName: deletedProductName,
            detail: `Deleted product '${deletedProductName}'`
        });

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (err) {
        console.error("Delete product error:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}