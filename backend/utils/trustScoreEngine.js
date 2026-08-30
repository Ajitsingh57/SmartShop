import Credit from "../models/creditModel.js";
import Payment from "../models/paymentModel.js";
import Sale from "../models/saleModel.js";
import Customer from "../models/customerModel.js";

/**
 * Calculates a fair, risk-balanced Trust Score (0-100) and Auto Credit Limit (₹)
 * directly tying Auto Credit Limit to BOTH Trust Score and Total Purchase Volume.
 * 
 * Rules:
 *  1. ZERO Purchases = ZERO Trust Score & ZERO Auto Credit Limit.
 *  2. ANY Verified Purchase (`totalPurchase > 0`) unlocks a fair proportional Trust Score and Auto Credit Limit.
 *  3. Auto Credit Limit formula:
 *     `autoCreditLimit = Math.round(purchaseAmount * (trustScore / 100) * 0.40)`
 *     - Scaled smoothly from 0% up to 40% of lifetime spending.
 *     - Fairness: Even small purchases get a starter limit (e.g. ₹10-₹40 on small purchases).
 *     - Risk Safety: Limit can NEVER exceed 40% of what customer has already paid/spent.
 *  4. Overdue delays penalize Trust Score and proportionally reduce/freeze Auto Credit Limit.
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
  const salesList = Array.isArray(sales) ? sales : [];
  const creditsList = Array.isArray(credits) ? credits : [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  // Calculate actual total spending across completed sales
  const calculatedSalesTotal = salesList.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalAmount || s.amount || 0)),
    0
  );
  const purchaseAmount = Math.max(
    0,
    Number(totalPurchase || 0),
    calculatedSalesTotal
  );

  const now = new Date();

  // =========================================================================
  // RULE 1: ZERO PURCHASES = ZERO TRUST SCORE & ZERO AUTO CREDIT LIMIT
  // =========================================================================
  if (purchaseAmount <= 0 || salesList.length === 0) {
    return {
      trustScore: 0,
      autoCreditLimit: 0,
      trustTier: "New",
      breakdown: {
        purchaseScore: 0,
        volumePoints: 0,
        instantFullPaymentCount: 0,
        instantFullPaymentAmount: 0,
        instantPoints: 0,
        repaymentScore: 0,
        onTimeClearedCount: 0,
        earlyClearedCount: 0,
        clearedCreditsCount: 0,
        historicalLateClearedCount: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        totalPending: 0,
        overduePenalty: 0,
        hasActiveOverdue: false,
        maxOverdueDays: 0,
        activeOverdueCount: 0,
        consistencyScore: 0,
      },
    };
  }

  // =========================================================================
  // 1. PURCHASE SPENDING SCORE (Max 35 points)
  // =========================================================================
  // Baseline 10 points for any verified customer purchase
  let volumePoints = 10;

  if (purchaseAmount < 500) {
    // ₹1 - ₹500: 10 to 15 pts
    volumePoints += Math.round((purchaseAmount / 500) * 5);
  } else if (purchaseAmount <= 2000) {
    // ₹501 - ₹2,000: 15 to 23 pts
    volumePoints += 5 + Math.round(((purchaseAmount - 500) / 1500) * 8);
  } else if (purchaseAmount <= 10000) {
    // ₹2,001 - ₹10,000: 23 to 31 pts
    volumePoints += 13 + Math.round(((purchaseAmount - 2000) / 8000) * 8);
  } else {
    // ₹10,000+: 31 to 35 pts max
    volumePoints += 21 + Math.min(4, Math.round(((purchaseAmount - 10000) / 10000) * 4));
  }
  const purchaseScore = Math.min(35, volumePoints);

  // =========================================================================
  // 2. ON-COUNTER INSTANT FULL PAYMENT (CASH / UPI) RELIABILITY (Max 25 points)
  // =========================================================================
  let instantFullPaymentCount = 0;
  let instantFullPaymentAmount = 0;

  salesList.forEach((s) => {
    const saleTotal = Number(s.totalAmount || s.amount || 0);
    const salePending = Number(s.pendingAmount || 0);
    const pType = String(s.paymentType || "").toLowerCase();

    if (
      salePending === 0 ||
      pType === "cash" ||
      pType === "upi" ||
      pType === "card"
    ) {
      instantFullPaymentCount += 1;
      instantFullPaymentAmount += saleTotal;
    }
  });

  const instantRatio =
    purchaseAmount > 0
      ? Math.min(1, instantFullPaymentAmount / purchaseAmount)
      : 1;

  // Instant ratio up to 18 points + instant transaction count up to 7 points
  const instantRatioPoints = Math.round(instantRatio * 18);
  const instantCountBonus = Math.min(7, instantFullPaymentCount * 2);
  const instantPoints = Math.min(25, instantRatioPoints + instantCountBonus);

  // =========================================================================
  // 3. REPAYMENT DISCIPLINE & BORROWING REPUTATION (Max 30 points)
  // =========================================================================
  let repaymentScore = 0;

  const totalBorrowed = creditsList.reduce(
    (sum, c) =>
      sum + Math.max(0, Number(c.borrowedAmount || c.totalAmount || 0)),
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

  let onTimeClearedCount = 0;
  let earlyClearedCount = 0;
  let clearedCreditsCount = 0;
  let historicalLateClearedCount = 0;

  if (creditsList.length === 0) {
    // If customer has never borrowed: neutral baseline of 18 points
    repaymentScore = 18;
  } else {
    // Customer has credit history
    const repaymentRatio =
      totalBorrowed > 0 ? Math.min(1, totalRepaid / totalBorrowed) : 1;
    const ratioPoints = Math.round(repaymentRatio * 18);

    creditsList.forEach((c) => {
      const pending = Number(c.pendingAmount || 0);
      const isCleared = pending <= 0 || c.status === "paid";

      if (isCleared) {
        clearedCreditsCount += 1;
        const dueDate = c.dueDate ? new Date(c.dueDate) : null;
        const settledDate = c.updatedAt ? new Date(c.updatedAt) : now;

        if (dueDate) {
          if (settledDate <= dueDate) {
            onTimeClearedCount += 1;
            const daysBefore = Math.floor(
              (dueDate.getTime() - settledDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysBefore >= 3) {
              earlyClearedCount += 1;
            }
          } else {
            historicalLateClearedCount += 1;
          }
        } else {
          onTimeClearedCount += 1;
        }
      }
    });

    const onTimeBonus = Math.min(8, onTimeClearedCount * 3);
    const earlyBonus = Math.min(4, earlyClearedCount * 2);

    repaymentScore = Math.min(30, ratioPoints + onTimeBonus + earlyBonus);
  }

  // =========================================================================
  // 4. ORDER FREQUENCY & LOYALTY CONSISTENCY (Max 10 points)
  // =========================================================================
  let consistencyScore = 0;
  if (salesList.length >= 8) consistencyScore = 10;
  else if (salesList.length >= 4) consistencyScore = 7;
  else if (salesList.length >= 2) consistencyScore = 4;
  else if (salesList.length === 1) consistencyScore = 2;

  // =========================================================================
  // 5. OVERDUE & DELAY PENALTIES (Deductions: 0 to -80 points)
  // =========================================================================
  let overduePenalty = 0;
  let hasActiveOverdue = false;
  let maxOverdueDays = 0;
  let activeOverdueCount = 0;

  creditsList.forEach((c) => {
    const pending = Number(c.pendingAmount || 0);
    if (pending > 0 && c.dueDate) {
      const dueDate = new Date(c.dueDate);
      if (dueDate < now) {
        hasActiveOverdue = true;
        activeOverdueCount += 1;

        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;

        if (diffDays > 30) {
          overduePenalty += 50; // Critical default (>30 days late)
        } else if (diffDays > 14) {
          overduePenalty += 30; // High delay (15-30 days late)
        } else if (diffDays > 7) {
          overduePenalty += 18; // Moderate delay (8-14 days late)
        } else if (diffDays > 0) {
          overduePenalty += 10; // Mild delay (1-7 days late)
        }
      }
    }
  });

  if (historicalLateClearedCount > 0) {
    overduePenalty += Math.min(10, historicalLateClearedCount * 3);
  }

  if (purchaseAmount > 0 && totalPending > purchaseAmount) {
    overduePenalty += 20;
  }

  overduePenalty = Math.min(80, overduePenalty);

  // =========================================================================
  // 6. FINAL TRUST SCORE (0 - 100)
  // =========================================================================
  const rawScore =
    purchaseScore + instantPoints + repaymentScore + consistencyScore - overduePenalty;
  const trustScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Trust Tier Classification
  let trustTier = "Bronze";
  if (trustScore >= 85) trustTier = "Platinum";
  else if (trustScore >= 70) trustTier = "Gold";
  else if (trustScore >= 50) trustTier = "Silver";

  // =========================================================================
  // 7. HARMONIOUS AUTO CREDIT LIMIT FORMULA (TrustScore × TotalPurchase)
  // =========================================================================
  let autoCreditLimit = 0;

  if (maxOverdueDays > 14 || trustScore <= 0) {
    // If critical overdue (>14 days) or zero trust score, auto credit is blocked
    autoCreditLimit = 0;
  } else {
    // Dynamic Credit Ratio: up to 10% of total purchase, directly scaled by Trust Score (0-100)
    // Formula: limit = purchaseAmount * (trustScore / 100) * 0.10
    // Example: ₹5,000 spending with 100 Trust Score = ₹500 Auto Limit
    // Example: ₹5,000 spending with 50 Trust Score = ₹250 Auto Limit
    const trustMultiplier = (trustScore / 100);
    const maxCreditRatio = 0.10; // Max 10% of lifetime purchase for 100 trust score
    let calculatedLimit = purchaseAmount * trustMultiplier * maxCreditRatio;

    // Repayment discipline booster (+10% if customer cleared 2+ credits with 100% on-time record)
    if (clearedCreditsCount >= 2 && onTimeClearedCount === clearedCreditsCount) {
      calculatedLimit *= 1.10;
    }

    // Mild overdue penalty (1-14 days): dampen limit by 50%
    if (hasActiveOverdue && maxOverdueDays <= 14) {
      calculatedLimit *= 0.5;
    }

    // Hard safety ceiling: never exceed 10% of total purchase (or 11% with booster)
    calculatedLimit = Math.min(calculatedLimit, purchaseAmount * 0.11);

    // Clean rounding:
    if (calculatedLimit >= 100) {
      // Round to nearest ₹50
      autoCreditLimit = Math.round(calculatedLimit / 50) * 50;
    } else if (calculatedLimit >= 10) {
      // Round to nearest ₹5 for micro limits (e.g. ₹15, ₹20, ₹25... ₹95)
      autoCreditLimit = Math.round(calculatedLimit / 5) * 5;
    } else if (calculatedLimit > 0) {
      autoCreditLimit = 10; // Minimum fair ₹10 credit for any paying customer with positive trust
    } else {
      autoCreditLimit = 0;
    }
  }

  return {
    trustScore,
    autoCreditLimit,
    trustTier,
    breakdown: {
      purchaseScore,
      volumePoints,
      instantFullPaymentCount,
      instantFullPaymentAmount,
      instantPoints,
      repaymentScore,
      onTimeClearedCount,
      earlyClearedCount,
      clearedCreditsCount,
      historicalLateClearedCount,
      totalBorrowed,
      totalRepaid,
      totalPending,
      overduePenalty,
      hasActiveOverdue,
      maxOverdueDays,
      activeOverdueCount,
      consistencyScore,
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

  const realTotalPurchase = sales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalAmount || s.amount || 0)),
    0
  );

  customer.totalPurchase = Math.max(
    Number(customer.totalPurchase || 0),
    realTotalPurchase
  );

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
