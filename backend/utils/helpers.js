import mongoose from "mongoose";
import Customer from "../models/customerModel.js";

// Safe helper to find customer by customer _id or linked userId
export const findCustomerByIdOrUser = async (id, session = null) => {
    if (!id) return null;

    let query = Customer.findById(id);
    if (session) query = query.session(session);
    let customer = await query;

    if (!customer) {
        let userQuery = Customer.findOne({ userId: id });
        if (session) userQuery = userQuery.session(session);
        customer = await userQuery;
    }

    return customer;
};

// Safe transaction wrapper that supports replica sets with standalone fallback
export const runTransaction = async (callback) => {
    let session = null;
    try {
        session = await mongoose.startSession();
        let result;
        await session.withTransaction(async () => {
            result = await callback(session);
        });
        return result;
    } catch (error) {
        // If MongoDB server does not support replica set transactions (e.g. local standalone), fallback to sessionless execution
        if (
            error?.message?.includes("Transaction numbers are only allowed on a replica set member") ||
            error?.message?.includes("This MongoDB deployment does not support retryable writes or transactions")
        ) {
            return await callback(null);
        }
        throw error;
    } finally {
        if (session) {
            await session.endSession().catch(() => {});
        }
    }
};

// Validates person names: letters, spaces, dots, hyphens, and apostrophes (NO digits)
export const isValidName = (name) => {
    if (!name || typeof name !== "string") return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return false;
    // Disallow numbers / digits in person names
    if (/\d/.test(trimmed)) return false;
    // Must contain letters, spaces, dots, hyphens, apostrophes
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) return false;
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    return letterCount >= 2;
};

// Validates mobile phone numbers: 10 digits starting with 6-9 or 10-15 digits
export const isValidPhone = (phone) => {
    if (!phone || typeof phone !== "string") return false;
    const trimmed = phone.trim();
    const cleanDigits = trimmed.replace(/[\s\-+()]/g, "");
    if (!/^\d+$/.test(cleanDigits)) return false;
    if (cleanDigits.length === 10) {
        return /^[6-9]\d{9}$/.test(cleanDigits);
    }
    if (cleanDigits.length === 12 && cleanDigits.startsWith("91")) {
        return /^91[6-9]\d{9}$/.test(cleanDigits);
    }
    return cleanDigits.length >= 10 && cleanDigits.length <= 15;
};

// Validates usernames: 3-30 chars, letters/numbers/underscore, at least 1 letter
export const isValidUsername = (username) => {
    if (!username || typeof username !== "string") return false;
    const trimmed = username.trim();
    return /^[a-zA-Z0-9_]{3,30}$/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
};

// Validates email address format
export const isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};
