import ProductRequest from "../models/productRequestModel.js";
import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { isValidName, isValidPhone, sendValidationError } from "../utils/helpers.js";

// Customer submits a product request (restock or new product) with optional image
export async function createProductRequest(req, res) {
  try {
    const {
      requestType,
      productId,
      productName,
      category,
      requestedQuantity,
      unit,
      targetPrice,
      description,
      customerName,
      customerPhone,
      customerEmail,
    } = req.body;

    const loggedInUser = req.user || null;
    const finalName = customerName?.trim() || loggedInUser?.name || loggedInUser?.username || "";
    const finalPhone = (customerPhone?.trim() || loggedInUser?.phone || "").replace(/[\s\-()]/g, "");
    const finalEmail = customerEmail?.trim() || loggedInUser?.email || "";

    const errors = {};

    if (!finalName || !isValidName(finalName)) {
      errors.customerName = "Please enter your name (letters and spaces only, min 2 characters)";
    }

    if (!finalPhone || !isValidPhone(finalPhone)) {
      errors.customerPhone = "Please enter a valid 10-digit mobile number";
    }

    if (!productName || !productName.trim()) {
      errors.productName = "Please enter the requested product name";
    }

    const qty = Number(requestedQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.requestedQuantity = "Quantity must be greater than 0";
    }

    if (!unit || !unit.trim()) {
      errors.unit = "Please select or enter a unit (e.g. kg, pcs, packet)";
    }

    if (Object.keys(errors).length > 0) {
      const firstMsg = Object.values(errors)[0];
      return sendValidationError(res, firstMsg, errors);
    }

    let resolvedCategory = category?.trim() || "General";
    let linkedProductId = null;

    if (requestType === "restock" && productId) {
      const existing = await Product.findById(productId);
      if (existing) {
        linkedProductId = existing._id;
        if (!category && existing.category) {
          resolvedCategory = existing.category;
        }
      }
    }

    // Optional image upload to Cloudinary
    let imageUrl = "";
    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "product_requests" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        imageUrl = uploadResult?.secure_url || "";
      } catch (uploadErr) {
        console.error("Cloudinary upload failed for product request:", uploadErr);
      }
    }

    const newRequest = new ProductRequest({
      customer: loggedInUser?._id || null,
      customerName: finalName,
      customerPhone: finalPhone,
      customerEmail: finalEmail,
      requestType: requestType === "restock" ? "restock" : "new_product",
      productId: linkedProductId,
      productName: productName.trim(),
      category: resolvedCategory,
      requestedQuantity: qty,
      unit: unit.trim(),
      targetPrice: targetPrice && Number(targetPrice) > 0 ? Number(targetPrice) : null,
      description: description?.trim() || "",
      image: imageUrl,
      status: "pending",
    });

    const saved = await newRequest.save();

    res.status(201).json({
      success: true,
      message:
        requestType === "restock"
          ? "Restock request submitted successfully. Shopkeeper will notify you once available!"
          : "Product request submitted successfully. Shopkeeper will review and procure it soon!",
      request: saved,
    });
  } catch (error) {
    console.error("Create product request error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to submit product request",
    });
  }
}

// Fetch requests submitted by the logged-in customer
export async function getMyProductRequests(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query = {
      $or: [{ customer: user._id }, { customerPhone: user.phone }],
    };

    const requests = await ProductRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get my product requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve your product requests",
    });
  }
}

// Admin: list all customer product requests with search and filter
export async function getAllProductRequests(req, res) {
  try {
    const { status, requestType, search, category } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (requestType && requestType !== "all") {
      filter.requestType = requestType;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { productName: regex },
        { customerName: regex },
        { customerPhone: regex },
        { category: regex },
      ];
    }

    const requests = await ProductRequest.find(filter)
      .populate("customer", "name username phone email")
      .populate("productId", "name price stock unit image")
      .sort({ createdAt: -1 });

    // Summary counts for admin quick badges
    const [total, pending, approved, inProcurement, available, rejected] =
      await Promise.all([
        ProductRequest.countDocuments(),
        ProductRequest.countDocuments({ status: "pending" }),
        ProductRequest.countDocuments({ status: "approved" }),
        ProductRequest.countDocuments({ status: "in_procurement" }),
        ProductRequest.countDocuments({ status: "available" }),
        ProductRequest.countDocuments({ status: "rejected" }),
      ]);

    res.status(200).json({
      success: true,
      requests,
      counts: {
        total,
        pending,
        approved,
        inProcurement,
        available,
        rejected,
      },
    });
  } catch (error) {
    console.error("Get all product requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product requests",
    });
  }
}

// Admin: update product request status and add note
export async function updateProductRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ["pending", "approved", "in_procurement", "available", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const request = await ProductRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Product request not found",
      });
    }

    const oldStatus = request.status;
    request.status = status;
    if (adminNote !== undefined) {
      request.adminNote = adminNote.trim();
    }

    const updated = await request.save();

    // Log admin write activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Updated Product Request",
      category: "Product",
      details: `Changed status of request for "${request.productName}" (Customer: ${request.customerName}) from ${oldStatus} to ${status}.`,
      targetId: request._id,
      targetModel: "ProductRequest",
    });

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      request: updated,
    });
  } catch (error) {
    console.error("Update product request status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product request status",
    });
  }
}

// Admin: delete product request
export async function deleteProductRequest(req, res) {
  try {
    const { id } = req.params;
    const request = await ProductRequest.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Product request not found",
      });
    }

    // Log admin activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Deleted Product Request",
      category: "Product",
      details: `Deleted product request for "${request.productName}" (Customer: ${request.customerName}).`,
      targetId: id,
      targetModel: "ProductRequest",
    });

    res.status(200).json({
      success: true,
      message: "Product request deleted successfully",
    });
  } catch (error) {
    console.error("Delete product request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product request",
    });
  }
}
