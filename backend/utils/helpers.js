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
