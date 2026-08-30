import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize name before saving to avoid duplicate casing
categorySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

const categoryModel =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default categoryModel;
