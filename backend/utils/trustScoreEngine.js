import Credit from "../models/creditModel.js";
import Payment from "../models/paymentModel.js";
import Sale from "../models/saleModel.js";
import Customer from "../models/customerModel.js";

/**
 * Calculates a reliable, explainable Trust Score (0-100) and Auto Credit Limit (₹)
 * based on:
 *  1. Total Purchase volume & frequency
 *  2. Repayment history (on-time cleared vs delayed)
 *  3. Overdue debt penalties
 *  4. Debt-to-purchase risk ratio
 *
 * @param {Object} params
 * @param {number} params.totalPurchase - Lifetime spending in ₹
 * @param {Array} params.sales - All customer sales
 * @param {Array} params.credits - All customer credit entries
 * @param {Array} params.payments - All customer payments
 * @returns {{ trustScore: number, autoCreditLimit: number, trustTier: string, breakdown: Object }}
 */
export const calculateCustomerTrustScoreAndLimits = ({
  totalPurchase = 0,
  sales = [],
  credits = [],
  payments = [],
}) => {
  const purchaseAmount = Math.max(0, Number(totalPurchase || 0));
  const salesCount = Array.isArray(sales) ? sales.length : 0;
  const creditsList = Array.isArray(credits) ? credits : [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  const now = new Date();

  // ==========================================
  // 1. PURCHASE SCORE (Max 35 points)
  // ==========================================
  // Baseline for any account: 10 points
  let purchaseScore = 10;

  // Volume points: +2 points per ₹1,000 spent (capped at +20 points for ₹10,000+ purchase)
  const volumePoints = Math.min(20, Math.floor(purchaseAmount / 1000) * 2);
  purchaseScore += volumePoints;

  // Frequency points: +1 for 2+ orders, +3 for 5+ orders, +5 for 10+ orders
  if (salesCount >= 10) {
    purchaseScore += 5;
  } else if (salesCount >= 5) {
    purchaseScore += 3;
  } else if (salesCount >= 2) {
    purchaseScore += 1;
  }

  purchaseScore = Math.min(35, purchaseScore);

  // ==========================================
  // 2. REPAYMENT & CREDIT REPUTATION (Max 45 points)
  // ==========================================
  let repaymentScore = 25; // Neutral baseline for customer who has never taken credit

  const totalBorrowed = creditsList.reduce(
    (sum, c) => sum + Math.max(0, Number(c.borrowedAmount || c.totalAmount || 0)),
    0
  );
  const totalRepaid = creditsList.reduce(
    (sum, c) => sum + Math.max(0, Number(c.paidAmount || 0)),
    0
  );
  const totalPending = creditsList.reduce(
    (sum, c) => sum + Math.max(0, Number(c.pendingAmount || 0)),
    0
  );

  const clearedCreditsCount = creditsList.filter(
    (c) => Number(c.pendingAmount || 0) <= 0 || c.status === "paid"
  ).length;

  if (creditsList.length > 0) {
    // If customer has borrowing history:
    const repaymentRatio = totalBorrowed > 0 ? totalRepaid / totalBorrowed : 1;

    // Scale 0-35 based on repayment percentage
    const ratioPoints = Math.round(repaymentRatio * 35);

    // Bonus for cleared credit milestones
    let clearedBonus = 0;
    if (clearedCreditsCount >= 5) clearedBonus = 10;
    else if (clearedCreditsCount >= 2) clearedBonus = 5;
    else if (clearedCreditsCount === 1) clearedBonus = 2;

    repaymentScore = Math.min(45, ratioPoints + clearedBonus);
  }

  // ==========================================
  // 3. OVERDUE & DELAY PENALTIES (Deductions: 0 to -60 points)
  // ==========================================
  let overduePenalty = 0;
  let hasActiveOverdue = false;
  let maxOverdueDays = 0;

  creditsList.forEach((c) => {
    const pending = Number(c.pendingAmount || 0);
    if (pending > 0 && c.dueDate) {
      const dueDate = new Date(c.dueDate);
      if (dueDate < now) {
        hasActiveOverdue = true;
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;

        if (diffDays > 30) {
          overduePenalty += 35; // Severe default
        } else if (diffDays > 14) {
          overduePenalty += 20; // Moderate overdue
        } else if (diffDays > 0) {
          overduePenalty += 10; // Mild overdue
        }
      }
    }
  });

  // Extra penalty if pending debt exceeds total purchase volume
  if (purchaseAmount > 0 && totalPending > purchaseAmount) {
    overduePenalty += 15;
  }

  overduePenalty = Math.min(60, overduePenalty);

  // ==========================================
  // 4. FINAL TRUST SCORE CALCULATION (0 - 100)
  // ==========================================
  const rawScore = purchaseScore + repaymentScore - overduePenalty;
  const trustScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Trust Tier classification
  let trustTier = "Bronze";
  if (trustScore >= 85) trustTier = "Platinum";
  else if (trustScore >= 70) trustTier = "Gold";
  else if (trustScore >= 50) trustTier = "Silver";

  // ==========================================
  // 5. AUTO CREDIT LIMIT CALCULATION
  // ==========================================
  let autoCreditLimit = 0;

  if (hasActiveOverdue || trustScore < 30) {
    // If user has active overdue debt or poor trust score, auto credit limit is zero
    autoCreditLimit = 0;
  } else {
    // Percentage of total lifetime purchases allowed as auto credit
    let purchasePercentage = 0;
    if (trustScore >= 85) purchasePercentage = 0.50; // 50% for Platinum
    else if (trustScore >= 70) purchasePercentage = 0.35; // 35% for Gold
    else if (trustScore >= 50) purchasePercentage = 0.20; // 20% for Silver
    else purchasePercentage = 0.10; // 10% for Bronze

    let calculatedLimit = purchaseAmount * purchasePercentage;

    // Minimum starter credit limit for trustworthy customers
    if (trustScore >= 70 && calculatedLimit < 1000) {
      calculatedLimit = 1000;
    } else if (trustScore >= 50 && calculatedLimit < 500) {
      calculatedLimit = 500;
    }

    // Round to nearest ₹50
    autoCreditLimit = Math.round(calculatedLimit / 50) * 50;
  }

  return {
    trustScore,
    autoCreditLimit,
    trustTier,
    breakdown: {
      purchaseScore,
      volumePoints,
      salesCount,
      repaymentScore,
      clearedCreditsCount,
      totalBorrowed,
      totalRepaid,
      totalPending,
      overduePenalty,
      hasActiveOverdue,
      maxOverdueDays,
    },
  };
};

/**
 * Re-evaluates and persists trust score & auto maxBorrowAmount for a specific customer in MongoDB.
 * @param {string|mongoose.Types.ObjectId} customerId
 * @param {Object} [session=null] - Optional mongoose session
 * @returns {Promise<Object>} Updated Customer document with calculation details
 */
export const syncCustomerTrustAndLimits = async (customerId, session = null) => {
  if (!customerId) return null;

  let query = Customer.findById(customerId);
  if (session) query = query.session(session);
  const customer = await query;

  if (!customer) return null;

  const [sales, credits, payments] = await Promise.all([
    Sale.find({ customerId: customer._id }),
    Credit.find({ customerId: customer._id }),
    Payment.find({ customerId: customer._id }),
  ]);

  // Sum actual sales total purchase
  const realTotalPurchase = sales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalAmount || s.amount || 0)),
    0
  );

  customer.totalPurchase = Math.max(Number(customer.totalPurchase || 0), realTotalPurchase);

  const pendingAmount = credits.reduce(
    (sum, c) => sum + Math.max(0, Number(c.pendingAmount || 0)),
    0
  );
  customer.pendingAmount = pendingAmount;

  const calculated = calculateCustomerTrustScoreAndLimits({
    totalPurchase: customer.totalPurchase,
    sales,
    credits,
    payments,
  });

  customer.trustScore = calculated.trustScore;
  customer.maxBorrowAmount = calculated.autoCreditLimit;

  await customer.save(session ? { session } : {});

  return {
    customer,
    calculated,
  };
};
