import Activity from "../models/activityModel.js";
import User from "../models/userModel.js";

// helper to log admin activity safely in background
export const logAdminActivity = async ({
  admin,
  action,
  category = "Other",
  targetId = null,
  targetName = null,
  detail,
  metadata = {},
  req = null,
}) => {
  try {
    if (!action || !detail) return;

    let adminId = null;
    let adminName = "Admin";
    let username = "admin";

    if (admin) {
      adminId = admin._id || admin.id || null;
      adminName = admin.name || "Admin";
      username = admin.username || admin.email || "admin";
    } else if (req?.user) {
      adminId = req.user._id || req.user.id || null;
      adminName = req.user.name || "Admin";
      username = req.user.username || req.user.email || "admin";
    } else {
      const fallbackAdmin = await User.findOne({
        role: { $in: ["admin", "superadmin"] },
        isActive: true,
      }).sort({ createdAt: 1 });

      if (fallbackAdmin) {
        adminId = fallbackAdmin._id;
        adminName = fallbackAdmin.name;
        username = fallbackAdmin.username || fallbackAdmin.email || "admin";
      }
    }

    const ipAddress =
      req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
      req?.socket?.remoteAddress ||
      null;

    await Activity.create({
      adminId,
      adminName,
      username,
      action,
      category,
      targetId: targetId ? String(targetId) : null,
      targetName: targetName ? String(targetName) : null,
      detail,
      metadata,
      ipAddress,
    });
  } catch (error) {
    console.error("Failed to log admin activity:", error);
  }
};
