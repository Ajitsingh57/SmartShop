import "dotenv/config";
import readline from "readline";
import bcrypt from "bcryptjs";
import dns from "node:dns";
import mongoose from "mongoose";

const mongo_url = process.env.Mongo_url;

const connectDB = async () => {
    try {
        await mongoose.connect(mongo_url);
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection failed", err);
        process.exit(1);
    }
};

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        // Username used by admin/superadmin login
        username: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true
        },
        phone: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["customer", "admin", "superadmin"],
            default: "customer"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        deactivatedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// DNS resolution for MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(text) {
    return new Promise((resolve) => {
        rl.question(text, resolve);
    });
}

// Fetch existing superadmin
async function getSuperAdmin() {
    return await User.findOne({ role: "superadmin" });
}

// Interactive prompt to create superadmin
async function createSuperAdmin() {
    const name = (await question("Enter superadmin name: ")).trim();
    if (!name) {
        console.log("Name cannot be empty.");
        return;
    }

    const username = (await question("Enter username: ")).trim();
    if (!username) {
        console.log("Username cannot be empty.");
        return;
    }

    const password = await question("Enter password: ");
    if (password.length < 6) {
        console.log("Password must be at least 6 characters.");
        return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        console.log("Username already exists.");
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        name,
        username,
        password: hashedPassword,
        role: "superadmin",
        isActive: true
    });

    console.log("\nSuperadmin created successfully.");
}

// Update superadmin display name
async function changeSuperAdminName(superAdmin) {
    const name = (await question("Enter new superadmin name: ")).trim();
    if (!name) {
        console.log("Name cannot be empty.");
        return;
    }

    superAdmin.name = name;
    await superAdmin.save();
    console.log("\nSuperadmin name changed successfully.");
}

// Update superadmin username
async function changeSuperAdminUsername(superAdmin) {
    const username = (await question("Enter new superadmin username: ")).trim();
    if (!username) {
        console.log("Username cannot be empty.");
        return;
    }

    const existingUsername = await User.findOne({
        username,
        _id: { $ne: superAdmin._id }
    });

    if (existingUsername) {
        console.log("Username already exists.");
        return;
    }

    superAdmin.username = username;
    await superAdmin.save();
    console.log("\nSuperadmin username changed successfully.");
}

// Update superadmin password
async function changeSuperAdminPassword(superAdmin) {
    const password = await question("Enter new password: ");
    if (password.length < 6) {
        console.log("Password must be at least 6 characters.");
        return;
    }

    const confirmPassword = await question("Confirm new password: ");
    if (password !== confirmPassword) {
        console.log("Passwords do not match.");
        return;
    }

    superAdmin.password = await bcrypt.hash(password, 10);
    await superAdmin.save();
    console.log("\nSuperadmin password changed successfully.");
}

// CLI entry point
async function start() {
    try {
        await connectDB();
        const superAdmin = await getSuperAdmin();

        if (!superAdmin) {
            console.log("\n==============================");
            console.log("       Superadmin Setup");
            console.log("==============================");
            console.log("1. Create Superadmin");
            console.log("2. Exit");

            const option = await question("\nSelect option: ");
            if (option === "1") {
                await createSuperAdmin();
            } else {
                console.log("\nSetup cancelled.");
            }
        } else {
            console.log("\n==============================");
            console.log("       Superadmin Setup");
            console.log("==============================");
            console.log("Superadmin already exists.");
            console.log("\n1. Change Superadmin Username");
            console.log("2. Change Superadmin Password");
            console.log("3. Change Superadmin Name");
            console.log("4. Exit");

            const option = await question("\nSelect option: ");
            if (option === "1") {
                await changeSuperAdminUsername(superAdmin);
            } else if (option === "2") {
                await changeSuperAdminPassword(superAdmin);
            } else if (option === "3") {
                await changeSuperAdminName(superAdmin);
            } else {
                console.log("\nSetup cancelled.");
            }
        }
    } catch (error) {
        console.error("\nSuperadmin setup failed:", error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

start();