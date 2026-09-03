import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import { sendValidationError } from "../utils/helpers.js";

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Accessories",
  "Groceries",
  "Clothing",
  "Home & Kitchen",
  "Beauty",
  "Stationery",
  "Other",
];

// Seed default and existing categories if collection is empty
async function ensureDefaultCategories() {
  try {
    const count = await Category.countDocuments();
    if (count > 0) return;

    // Collect distinct categories already present in products
    const productCategories = await Product.distinct("category");
    const combinedSet = new Set([...DEFAULT_CATEGORIES, ...productCategories.filter(Boolean)]);

    const toInsert = Array.from(combinedSet).map((name) => ({
      name: name.trim(),
      description: `Category for ${name.trim()}`,
    }));

    if (toInsert.length > 0) {
      await Category.insertMany(toInsert, { ordered: false });
    }
  } catch (err) {
    console.error("Default categories seed error:", err);
  }
}

// Get all categories with product counts
export async function getCategories(req, res) {
  try {
    await ensureDefaultCategories();

    const categories = await Category.find().sort({ name: 1 }).lean();

    // Attach product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat.name,
          deleted: false,
        });
        return {
          ...cat,
          productCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (err) {
    console.error("Get categories error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
}

// Add a new category
export async function addCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return sendValidationError(res, "Please enter a category name", {
        name: "Category name is required"
      });
    }

    const trimmedName = name.trim();

    // Check for duplicate category name (case-insensitive)
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Category "${trimmedName}" already exists. Please choose a different name.`,
        errors: { name: `Category "${trimmedName}" already exists` }
      });
    }

    const category = new Category({
      name: trimmedName,
      description: description?.trim() || "",
      createdBy: req.user?._id || req.user?.id || null,
      updatedBy: req.user?._id || req.user?.id || null,
    });

    await category.save();

    // log category creation activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Created Category",
      category: "Category",
      targetId: category._id,
      targetName: category.name,
      detail: `Created new product category '${category.name}'`,
    });

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: {
        ...category.toObject(),
        productCount: 0,
      },
    });
  } catch (err) {
    console.error("Add category error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to add category",
    });
  }
}

// Update an existing category
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const oldName = category.name;
    const trimmedName = name ? name.trim() : oldName;

    if (name !== undefined) {
      if (!trimmedName) {
        return sendValidationError(res, "Category name cannot be empty", {
          name: "Category name is required"
        });
      }

      if (trimmedName !== oldName) {
        // Check if new name already exists
        const duplicate = await Category.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: `Category "${trimmedName}" already exists. Please choose a different name.`,
            errors: { name: `Category "${trimmedName}" already exists` }
          });
        }

        // Update name across all active products referencing this category
        await Product.updateMany(
          { category: oldName },
          { $set: { category: trimmedName } }
        );
        category.name = trimmedName;
      }
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    category.updatedBy = req.user?._id || req.user?.id || null;
    await category.save();

    // log category update activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Updated Category",
      category: "Category",
      targetId: category._id,
      targetName: category.name,
      detail: `Updated product category '${category.name}'`,
    });

    const productCount = await Product.countDocuments({
      category: category.name,
      deleted: false,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (err) {
    console.error("Update category error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update category",
    });
  }
}

// Delete a category
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const deletedCategoryName = category.name;

    // Check if category is used by active products
    const productCount = await Product.countDocuments({
      category: category.name,
      deleted: false,
    });

    if (productCount > 0 && force !== "true") {
      return res.status(400).json({
        success: false,
        hasProducts: true,
        productCount,
        message: `Cannot delete "${category.name}" because it is currently assigned to ${productCount} active product(s). Please reassign or remove those products first.`,
      });
    }

    // If force delete is requested, reassign affected products to "Other" or leave as is
    if (productCount > 0 && force === "true") {
      await Product.updateMany(
        { category: category.name },
        { $set: { category: "Other" } }
      );
    }

    await Category.findByIdAndDelete(id);

    // log category deletion activity
    logAdminActivity({
      admin: req.user,
      req,
      action: "Deleted Category",
      category: "Category",
      targetId: category._id,
      targetName: deletedCategoryName,
      detail: `Deleted product category '${deletedCategoryName}'`,
    });

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
    });
  } catch (err) {
    console.error("Delete category error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete category",
    });
  }
}
