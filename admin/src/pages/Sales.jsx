import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Search,
  User,
  Package,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  Sparkles,
  Printer,
  Receipt,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";

import {
  customersApi,
  productsApi,
  salesApi,
} from "../services/api";
import { printSaleBillPDF } from "../utils/exportReports";

const money = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

// Formats a Date object to local YYYY-MM-DD string without timezone drift
const getLocalDateString = (d) => {
  const date = d ? new Date(d) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Returns a YYYY-MM-DD date string by adding N days to local today
const addDaysToToday = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Number(days));
  return getLocalDateString(d);
};

const getId = (item) => {
  if (!item || typeof item !== "object") return "";

  return String(
    item._id ||
      item.id ||
      (typeof item.userId === "string" ? item.userId : "") ||
      (typeof item.customerId === "string" ? item.customerId : "") ||
      (typeof item.productId === "string" ? item.productId : "") ||
      ""
  );
};

// Customer name extractor compatible with nested user/profile objects
const getCustomerName = (customer) => {
  if (!customer || typeof customer !== "object") {
    return "Customer";
  }

  const userId =
    customer.userId && typeof customer.userId === "object"
      ? customer.userId
      : null;

  const user =
    customer.user && typeof customer.user === "object"
      ? customer.user
      : null;

  const profile =
    customer.profile && typeof customer.profile === "object"
      ? customer.profile
      : null;

  const name =
    customer.name ||
    customer.fullName ||
    userId?.name ||
    userId?.fullName ||
    user?.name ||
    user?.fullName ||
    profile?.name ||
    profile?.fullName ||
    userId?.username ||
    user?.username ||
    customer.username;

  return typeof name === "string" && name.trim() ? name.trim() : "Customer";
};

const getCustomerPhone = (customer) => {
  if (!customer || typeof customer !== "object") return "";

  const userId =
    customer.userId && typeof customer.userId === "object"
      ? customer.userId
      : null;

  const user =
    customer.user && typeof customer.user === "object"
      ? customer.user
      : null;

  return (
    customer.phone ||
    customer.mobile ||
    userId?.phone ||
    userId?.mobile ||
    user?.phone ||
    user?.mobile ||
    ""
  );
};

const getCustomerEmail = (customer) => {
  if (!customer || typeof customer !== "object") return "";

  const userId =
    customer.userId && typeof customer.userId === "object"
      ? customer.userId
      : null;

  const user =
    customer.user && typeof customer.user === "object"
      ? customer.user
      : null;

  return customer.email || userId?.email || user?.email || "";
};

const getCustomerOutstanding = (customer) => {
  if (!customer || typeof customer !== "object") return 0;

  return Number(
    customer.pendingAmount ??
      customer.outstanding ??
      customer.profile?.pendingAmount ??
      0
  );
};

const getCustomerCreditLimit = (customer) => {
  if (!customer || typeof customer !== "object") return 0;

  const profile = customer.profile || {};
  const mode =
    customer.creditLimitMode ||
    profile.creditLimitMode ||
    (Number(customer.manualBorrowLimit || profile.manualBorrowLimit || 0) > 0
      ? "manual"
      : "auto");

  if (mode === "manual") {
    return Number(
      customer.manualBorrowLimit ??
        profile.manualBorrowLimit ??
        0
    );
  }

  return Number(
    customer.maxBorrowAmount ??
      customer.autoBorrowLimit ??
      profile.maxBorrowAmount ??
      profile.autoBorrowLimit ??
      customer.creditLimit ??
      0
  );
};

const getCustomerCreditMode = (customer) => {
  if (!customer || typeof customer !== "object") return "auto";
  const profile = customer.profile || {};
  return (
    customer.creditLimitMode ||
    profile.creditLimitMode ||
    (Number(customer.manualBorrowLimit || profile.manualBorrowLimit || 0) > 0
      ? "manual"
      : "auto")
  );
};

const getProductName = (product) => {
  return product?.name || product?.productName || "Unnamed product";
};

const getProductPrice = (product) => {
  return Number(
    product?.price ?? product?.sellingPrice ?? product?.salePrice ?? 0
  );
};

const getProductStock = (product) => {
  const value =
    product?.stockQuantity ?? product?.stock ?? product?.quantity;

  if (value === null || value === undefined || value === "") return null;
  return Number(value);
};

const normalizeCustomers = (response) => {
  const data =
    response?.customers ||
    response?.data?.customers ||
    response?.data ||
    response;

  return Array.isArray(data) ? data : [];
};

const normalizeProducts = (response) => {
  const data =
    response?.products ||
    response?.data?.products ||
    response?.data ||
    response;

  return Array.isArray(data) ? data : [];
};

const Sales = () => {
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const customerSearchRef = useRef(null);
  const productSearchRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [unknownRate, setUnknownRate] = useState("");
  const [cart, setCart] = useState([]);
  const [showProductList, setShowProductList] = useState(false);

  const [totalAmount, setTotalAmount] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [partialPaymentType, setPartialPaymentType] = useState("");
  const [creditTenure, setCreditTenure] = useState("30");
  const [customDueDate, setCustomDueDate] = useState("");

  const minDueDateStr = useMemo(() => addDaysToToday(1), []);
  const maxDueDateStr = useMemo(() => addDaysToToday(365), []);

  const dueDateInfo = useMemo(() => {
    let dateStr = "";
    if (creditTenure === "custom") {
      dateStr = customDueDate;
    } else {
      const days = Number(creditTenure) || 30;
      dateStr = addDaysToToday(days);
    }

    if (!dateStr) {
      return { isValid: false, dateStr: "", formattedDate: "", diffDays: 0, error: "Please select a repayment due date." };
    }

    const parts = String(dateStr).trim().split("-");
    if (parts.length !== 3 || parts[0].length !== 4) {
      return { isValid: false, dateStr, formattedDate: "", diffDays: 0, error: "Incomplete date format." };
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
      return { isValid: false, dateStr, formattedDate: "", diffDays: 0, error: "Invalid calendar date." };
    }

    const targetDate = new Date(year, month, day);
    if (isNaN(targetDate.getTime()) || targetDate.getMonth() !== month || targetDate.getDate() !== day) {
      return { isValid: false, dateStr, formattedDate: "", diffDays: 0, error: "Invalid day for the selected month." };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return {
        isValid: false,
        dateStr,
        formattedDate: targetDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        diffDays,
        error: "Due date must be tomorrow or later. Past/today's date is not allowed.",
      };
    }

    if (diffDays > 365) {
      return {
        isValid: false,
        dateStr,
        formattedDate: targetDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        diffDays,
        error: "Due date cannot exceed 1 year (365 days).",
      };
    }

    return {
      isValid: true,
      dateStr,
      formattedDate: targetDate.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      diffDays,
      error: null,
    };
  }, [creditTenure, customDueDate]);

  const handleShiftCustomDays = (offset) => {
    let baseDate = new Date();
    if (customDueDate) {
      const parts = customDueDate.split("-");
      if (parts.length === 3) {
        baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    } else {
      baseDate.setDate(baseDate.getDate() + 30);
    }

    baseDate.setDate(baseDate.getDate() + offset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (baseDate <= today) {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
    }

    setCustomDueDate(getLocalDateString(baseDate));
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  // Load customer and product datasets
  const loadData = async () => {
    try {
      setLoading(true);
      clearMessage();

      const [customersResponse, productsResponse] = await Promise.all([
        customersApi.getAll(),
        productsApi.list(),
      ]);

      setCustomers(normalizeCustomers(customersResponse));
      setProducts(normalizeProducts(productsResponse));
    } catch (error) {
      console.error("Load sales data error:", error);
      setMessage(error?.message || "Failed to load customers and products.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle dropdown dismiss on outside click
  useEffect(() => {
    const handleOutsidePointerDown = (event) => {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target)
      ) {
        setShowCustomerList(false);
      }

      if (
        productSearchRef.current &&
        !productSearchRef.current.contains(event.target)
      ) {
        setShowProductList(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers.slice(0, 10);

    return customers
      .filter((customer) => {
        const name = String(getCustomerName(customer)).toLowerCase();
        const phone = String(getCustomerPhone(customer)).toLowerCase();
        const email = String(getCustomerEmail(customer)).toLowerCase();

        return (
          name.includes(query) || phone.includes(query) || email.includes(query)
        );
      })
      .slice(0, 10);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products.slice(0, 10);

    return products
      .filter((product) =>
        getProductName(product).toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [products, productSearch]);

  const handleCustomerSelect = (customer) => {
    if (!customer || typeof customer !== "object") return;
    setSelectedCustomer(customer);
    setCustomerSearch(getCustomerName(customer));
    setShowCustomerList(false);
    clearMessage();
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerList(false);
  };

  // Add selected product to the cart
  const addProduct = (product) => {
    clearMessage();
    const productId = getId(product);

    if (!productId) {
      setMessage("Product ID is missing.");
      setMessageType("error");
      return;
    }

    const stock = getProductStock(product);
    if (stock !== null && stock <= 0) {
      setMessage(`${getProductName(product)} is out of stock.`);
      setMessageType("error");
      return;
    }

    const existing = cart.find(
      (item) => item.productId && String(item.productId) === String(productId)
    );

    if (existing) {
      if (stock !== null && existing.quantity >= stock) {
        setMessage(
          `Available stock limit reached for ${getProductName(product)}.`
        );
        setMessageType("error");
        return;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.cartItemId === existing.cartItemId
            ? {
                ...item,
                quantity: Number(item.quantity || 1) + 1,
                total:
                  item.price !== null && item.price !== undefined && item.price !== ""
                    ? Number(item.price) * (Number(item.quantity || 1) + 1)
                    : null,
              }
            : item
        )
      );
    } else {
      const price = getProductPrice(product);
      setCart((prev) => [
        ...prev,
        {
          cartItemId: `prod_${productId}_${Date.now()}`,
          productId,
          productName: getProductName(product),
          quantity: 1,
          unit: product?.unit || product?.sellingUnit || null,
          price: price || "",
          total: price || "",
          stock,
          isCustom: false,
        },
      ]);
    }

    setProductSearch("");
    setShowProductList(false);
  };

  // Add a custom / unknown item to the cart
  const addCustomItem = (name = "Unknown item", initialPrice = "") => {
    clearMessage();
    const cleanName =
      typeof name === "string" && name.trim() ? name.trim() : "Unknown item";
    const numPrice =
      initialPrice !== "" && Number.isFinite(Number(initialPrice))
        ? Number(initialPrice)
        : "";

    const newItem = {
      cartItemId: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: null,
      productName: cleanName,
      quantity: 1,
      unit: null,
      price: numPrice,
      total: numPrice,
      stock: null,
      isCustom: true,
    };

    setCart((prev) => [...prev, newItem]);
    setProductSearch("");
    setShowProductList(false);
  };

  // Quick add unknown item by entering rate only
  const handleQuickAddUnknown = (e) => {
    if (e) e.preventDefault();
    const rate = Number(unknownRate);
    if (!unknownRate || !Number.isFinite(rate) || rate <= 0) {
      setMessage("Please enter a valid rate for the unknown item.");
      setMessageType("error");
      return;
    }

    addCustomItem("Unknown item", rate);
    setUnknownRate("");
    clearMessage();
  };

  const updateQuantity = (cartItemId, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;

        let quantity = Number(item.quantity || 1);

        if (type === "increase") {
          if (item.stock !== null && quantity >= item.stock) return item;
          quantity += 1;
        }

        if (type === "decrease") {
          quantity = Math.max(1, quantity - 1);
        }

        const price = Number(item.price);
        return {
          ...item,
          quantity,
          total:
            item.price !== null && item.price !== undefined && item.price !== "" && Number.isFinite(price)
              ? price * quantity
              : item.total,
        };
      })
    );
  };

  const updateItem = (cartItemId, field, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;

        const updated = {
          ...item,
          [field]: value,
        };

        if (field === "price" || field === "quantity") {
          const priceStr = field === "price" ? value : item.price;
          const qtyStr = field === "quantity" ? value : item.quantity;

          const price = Number(priceStr);
          const quantity = Number(qtyStr);

          if (
            priceStr !== "" &&
            priceStr !== null &&
            qtyStr !== "" &&
            qtyStr !== null &&
            Number.isFinite(price) &&
            Number.isFinite(quantity)
          ) {
            updated.total = price * quantity;
          } else if (field === "price" && priceStr !== "" && Number.isFinite(price)) {
            updated.total = price;
          }
        }

        return updated;
      })
    );
  };

  const removeProduct = (cartItemId) => {
    setCart((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId)
    );
  };

  const itemTotal = (item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (
      item.price !== "" &&
      item.price !== null &&
      item.quantity !== "" &&
      item.quantity !== null &&
      Number.isFinite(price) &&
      Number.isFinite(quantity)
    ) {
      return price * quantity;
    }

    if (item.total !== null && item.total !== undefined && item.total !== "") {
      const totalNum = Number(item.total);
      if (Number.isFinite(totalNum)) return totalNum;
    }

    return 0;
  };

  const calculatedItemsTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + itemTotal(item), 0);
  }, [cart]);

  const enteredTotal = Number(totalAmount);
  const hasEnteredTotal = totalAmount !== "" && Number.isFinite(enteredTotal);
  const total = hasEnteredTotal ? Math.max(0, enteredTotal) : calculatedItemsTotal;

  // Auto-calculated extra unknown item difference when manually typing a higher total
  const extraUnknownAmount = useMemo(() => {
    if (hasEnteredTotal && enteredTotal > calculatedItemsTotal) {
      return Math.round((enteredTotal - calculatedItemsTotal) * 100) / 100;
    }
    return 0;
  }, [hasEnteredTotal, enteredTotal, calculatedItemsTotal]);

  const calculatedPaid =
    paymentType === "cash" || paymentType === "upi"
      ? total
      : paymentType === "credit"
      ? 0
      : paymentType === "partial"
      ? Math.min(Math.max(Number(paidAmount) || 0, 0), total)
      : 0;

  const pendingAmount = Math.max(0, total - calculatedPaid);

  const currentOutstanding = selectedCustomer
    ? getCustomerOutstanding(selectedCustomer)
    : 0;

  const creditLimit = selectedCustomer
    ? getCustomerCreditLimit(selectedCustomer)
    : 0;

  const availableCredit = Math.max(0, creditLimit - currentOutstanding);

  const needsCredit = paymentType === "credit" || paymentType === "partial";
  const creditExceeded =
    needsCredit && selectedCustomer && pendingAmount > availableCredit;

  // Validate sale requirements before backend submission
  const validateSale = () => {
    const amount = Number(total);

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Please enter a valid total amount.";
    }

    if (needsCredit && !selectedCustomer) {
      return "Customer is required for credit or partial payment.";
    }

    if (paymentType === "partial") {
      const paid = Number(paidAmount);

      if (!paidAmount || !Number.isFinite(paid) || paid <= 0) {
        return "Please enter the amount paid by customer.";
      }

      if (paid >= amount) {
        return "For partial payment, paid amount must be less than total amount.";
      }

      if (!["cash", "upi"].includes(partialPaymentType)) {
        return "Please select whether the partial payment was received by cash or UPI.";
      }
    }

    if (needsCredit && selectedCustomer && creditExceeded) {
      return `Credit limit exceeded. Available credit is ${money(availableCredit)}.`;
    }

    if (needsCredit) {
      if (!dueDateInfo.isValid) {
        return dueDateInfo.error || "Please select a valid repayment due date.";
      }
    }

    return "";
  };

  const preparedItems = useMemo(() => {
    const items = cart.map((item) => {
      const quantity =
        item.quantity === "" || item.quantity === null || item.quantity === undefined
          ? null
          : Number(item.quantity);

      const price =
        item.price === "" || item.price === null || item.price === undefined
          ? null
          : Number(item.price);

      const itemTotalValue =
        quantity !== null &&
        price !== null &&
        Number.isFinite(quantity) &&
        Number.isFinite(price)
          ? quantity * price
          : Number.isFinite(Number(item.total)) && item.total !== "" && item.total !== null
          ? Number(item.total)
          : null;

      return {
        productId: item.productId || null,
        productName: item.productName?.trim() || "Unknown item",
        quantity: Number.isFinite(quantity) ? quantity : null,
        unit: item.unit || null,
        price: Number.isFinite(price) ? price : null,
        total: itemTotalValue !== null ? itemTotalValue : item.total ?? null,
      };
    });

    // If total entered by user is greater than cart items total, automatically add the difference as an unknown item!
    if (extraUnknownAmount > 0) {
      items.push({
        productId: null,
        productName: "Unknown item",
        quantity: 1,
        unit: null,
        price: extraUnknownAmount,
        total: extraUnknownAmount,
      });
    }

    return items;
  }, [cart, extraUnknownAmount]);

  // Submit sale payload to backend
  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (submitting) return;

    clearMessage();
    const validation = validateSale();

    if (validation) {
      setMessage(validation);
      setMessageType("error");
      return;
    }

    const amount = Number(total);
    const paid =
      paymentType === "cash" || paymentType === "upi"
        ? amount
        : paymentType === "credit"
        ? 0
        : Number(paidAmount);

    const pending = Math.max(0, amount - paid);

    const saleData = {
      customerId: selectedCustomer ? getId(selectedCustomer) : null,
      items: preparedItems,
      totalAmount: amount,
      paymentType,
      paidAmount:
        paymentType === "partial"
          ? paid
          : paymentType === "cash" || paymentType === "upi"
          ? amount
          : 0,
      pendingAmount:
        paymentType === "partial" || paymentType === "credit" ? pending : 0,
      partialPaymentType:
        paymentType === "partial" ? partialPaymentType : null,
      dueDate: needsCredit ? dueDateInfo.dateStr : null,
      creditDays: needsCredit && creditTenure !== "custom" ? Number(creditTenure) : null,
    };

    try {
      setSubmitting(true);
      const response = await salesApi.create(saleData);

      const created = response?.sale || {
        _id: "NEW",
        ...saleData,
        items: preparedItems,
      };

      setCreatedReceipt({
        id: `SALE-${String(created._id).slice(-6).toUpperCase()}`,
        rawId: created._id,
        date: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerName: selectedCustomer ? getCustomerName(selectedCustomer) : "Walk-in Customer",
        customerPhone: selectedCustomer?.userId?.phone || selectedCustomer?.phone || "",
        items: preparedItems,
        totalAmount: amount,
        paidAmount: saleData.paidAmount,
        pendingAmount: saleData.pendingAmount,
        paymentType: paymentType.toUpperCase(),
        dueDate: needsCredit ? dueDateInfo.dateStr : null,
      });

      setMessage(response?.message || "Sale created successfully.");
      setMessageType("success");
      resetSale();

      try {
        const productsResponse = await productsApi.list();
        setProducts(normalizeProducts(productsResponse));
      } catch {
        // Continue if background product refresh fails
      }
    } catch (error) {
      console.error("Create sale error:", error);
      setMessage(error?.message || "Failed to create sale.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetSale = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
    setUnknownRate("");
    setCart([]);
    setTotalAmount("");
    setPaymentType("cash");
    setPaidAmount("");
    setPartialPaymentType("");
    setCreditTenure("30");
    setCustomDueDate("");
    setShowCustomerList(false);
    setShowProductList(false);
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center px-4"
        style={{ backgroundColor: "var(--app-bg)" }}
      >
        <div className="text-center">
          <RefreshCw
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: "var(--app-accent)" }}
          />
          <p className="mt-3 text-sm text-zinc-500">
            Loading customers and products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-w-0 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 md:px-8 lg:px-10"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
              SmartShop Admin Panel
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Create Sale
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Record a quick sale with optional product details.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white sm:w-auto sm:px-4"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <Link
              to="/transactions"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white sm:w-auto sm:px-4"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              View Transactions →
            </Link>
          </div>
        </div>

        {message && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
            style={
              messageType === "success"
                ? {
                    borderColor: "rgba(34,197,94,.2)",
                    backgroundColor: "rgba(34,197,94,.05)",
                    color: "#4ade80",
                  }
                : {
                    borderColor: "rgba(239,68,68,.2)",
                    backgroundColor: "rgba(239,68,68,.05)",
                    color: "#f87171",
                  }
            }
          >
            {messageType === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleCreateSale}>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:gap-6 xl:grid-cols-3">
            {/* Customer and products selection */}
            <div className="min-w-0 space-y-4 sm:space-y-5 xl:col-span-2">
              <section
                className="min-w-0 rounded-xl border p-3 sm:p-4 md:p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white">Customer</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Optional. Leave empty for Walk-in Customer.
                    </p>
                  </div>

                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="text-zinc-500 transition hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div ref={customerSearchRef} className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-zinc-600" />
                  </div>

                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomer(null);
                      setShowCustomerList(true);
                      clearMessage();
                    }}
                    onFocus={() => setShowCustomerList(true)}
                    placeholder="Search customer by name, phone or email..."
                    className="w-full rounded-lg border py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  />

                  {showCustomerList && (
                    <div
                      className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto overscroll-contain rounded-lg border shadow-2xl"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => {
                          const id = getId(customer) || `customer-${index}`;

                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => handleCustomerSelect(customer)}
                              className="flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-0 hover:bg-white/[0.03]"
                              style={{ borderColor: "var(--app-border)" }}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                  style={{
                                    backgroundColor: "var(--app-accent-soft)",
                                    color: "var(--app-accent)",
                                  }}
                                >
                                  <User className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-zinc-200">
                                    {getCustomerName(customer)}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-zinc-600">
                                    {getCustomerPhone(customer) ||
                                      getCustomerEmail(customer) ||
                                      "No contact details"}
                                  </p>
                                </div>
                              </div>

                              <span className="text-xs" style={{ color: "var(--app-accent)" }}>
                                Select
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-zinc-600">
                          No customer found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div
                    className="mt-4 rounded-xl border p-4"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-zinc-600">Selected Customer</p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {getCustomerName(selectedCustomer)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-600">
                          {getCustomerPhone(selectedCustomer) && (
                            <span>{getCustomerPhone(selectedCustomer)}</span>
                          )}
                          {getCustomerEmail(selectedCustomer) && (
                            <span>{getCustomerEmail(selectedCustomer)}</span>
                          )}
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Outstanding
                          </p>
                          <p className="mt-1 text-sm font-semibold text-red-400">
                            {money(currentOutstanding)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Available Credit
                          </p>
                          <p className="mt-1 text-sm font-semibold text-emerald-400">
                            {money(availableCredit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section
                className="min-w-0 rounded-xl border p-3 sm:p-4 md:p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white">Products</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Select catalog products or quick-add unknown items by rate.
                    </p>
                  </div>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--app-accent-soft)",
                      color: "var(--app-accent)",
                    }}
                  >
                    {cart.length} Items
                  </span>
                </div>

                {/* Search catalog + Quick Add Unknown by Rate */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  {/* Product Search */}
                  <div ref={productSearchRef} className="relative sm:col-span-7">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-zinc-600" />
                    </div>

                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductList(true);
                        clearMessage();
                      }}
                      onFocus={() => setShowProductList(true)}
                      placeholder="Search catalog product..."
                      className="w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    />

                    {showProductList && (
                      <div
                        className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto overscroll-contain rounded-lg border shadow-2xl"
                        style={{
                          borderColor: "var(--app-border)",
                          backgroundColor: "var(--app-surface-light)",
                        }}
                      >
                        {/* Quick Add Custom / Unknown Item option if search term entered */}
                        {productSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const num = Number(productSearch.trim());
                              if (Number.isFinite(num) && num > 0) {
                                addCustomItem("Unknown item", num);
                              } else {
                                addCustomItem(productSearch.trim(), "");
                              }
                            }}
                            className="flex w-full items-center justify-between border-b px-4 py-3 text-left transition hover:bg-amber-500/10"
                            style={{
                              borderColor: "var(--app-border)",
                              backgroundColor: "rgba(245, 158, 11, 0.04)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                                <Plus className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-amber-300">
                                  {Number.isFinite(Number(productSearch.trim())) && Number(productSearch.trim()) > 0
                                    ? `Add Unknown Item for ₹${productSearch.trim()}`
                                    : `Add "${productSearch.trim()}" as Unknown Item`}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Click to add directly to the cart
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-amber-400">Add Item +</span>
                          </button>
                        )}

                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => {
                            const stock = getProductStock(product);
                            const outOfStock = stock !== null && stock <= 0;

                            return (
                              <button
                                key={getId(product)}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => addProduct(product)}
                                className="flex w-full items-center justify-between border-b px-4 py-3 text-left last:border-0 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/[0.03]"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor: "var(--app-accent-soft)",
                                      color: "var(--app-accent)",
                                    }}
                                  >
                                    <Package className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-zinc-200">
                                      {getProductName(product)}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-600">
                                      {stock === null ? "Stock not recorded" : `Stock ${stock}`}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-semibold text-white">
                                    {money(getProductPrice(product))}
                                  </p>
                                  <p className="mt-1 text-xs" style={{ color: "var(--app-accent)" }}>
                                    {outOfStock ? "Out of stock" : "Add +"}
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          !productSearch.trim() && (
                            <div className="px-4 py-6 text-center text-sm text-zinc-600">
                              No product found
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Add Unknown Item with Rate Only */}
                  <div className="sm:col-span-5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={unknownRate}
                          onChange={(e) => setUnknownRate(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleQuickAddUnknown();
                            }
                          }}
                          placeholder="Rate (e.g. 50)"
                          className="h-10 w-full rounded-lg border border-amber-500/30 bg-amber-500/5 py-2 pl-7 pr-3 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-amber-400 focus:bg-amber-500/10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickAddUnknown}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
                        style={{
                          borderColor: "rgba(245, 158, 11, 0.4)",
                          backgroundColor: "rgba(245, 158, 11, 0.12)",
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add Unknown
                      </button>
                    </div>
                  </div>
                </div>

                {cart.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {cart.map((item) => {
                      const isCustom = !item.productId || item.isCustom;

                      return (
                        <div
                          key={item.cartItemId}
                          className="min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4 transition-all"
                          style={{
                            borderColor: isCustom
                              ? "rgba(245, 158, 11, 0.3)"
                              : "var(--app-border)",
                            backgroundColor: isCustom
                              ? "rgba(245, 158, 11, 0.03)"
                              : "var(--app-surface-light)",
                          }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                {isCustom ? (
                                  <div className="flex items-center gap-2">
                                    <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                                      Unknown Item
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                      Rate: {money(item.price || 0)}
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                                        Catalog Product
                                      </span>
                                    </div>
                                    <p className="mt-1 truncate text-sm font-medium text-zinc-200">
                                      {item.productName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-zinc-600">
                                      Product ID: {item.productId}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeProduct(item.cartItemId)}
                                className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Simplified row for Unknown Items */}
                            {isCustom ? (
                              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                  <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-amber-400/80">
                                    Rate (₹)
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={item.price ?? ""}
                                      onChange={(e) =>
                                        updateItem(
                                          item.cartItemId,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Rate"
                                      className="h-9 w-full rounded-lg border border-amber-500/30 bg-zinc-900/80 pl-7 pr-3 text-sm font-semibold text-white outline-none focus:border-amber-400"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                                    Quantity
                                  </label>
                                  <div
                                    className="flex h-9 items-center rounded-lg border"
                                    style={{
                                      borderColor: "var(--app-border)",
                                      backgroundColor: "var(--app-surface)",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.cartItemId,
                                          "decrease"
                                        )
                                      }
                                      className="flex h-full w-8 items-center justify-center text-zinc-500 hover:text-white"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0.001"
                                      step="any"
                                      value={item.quantity ?? ""}
                                      onChange={(e) =>
                                        updateItem(
                                          item.cartItemId,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      className="h-full min-w-0 flex-1 bg-transparent text-center text-sm text-white outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.cartItemId,
                                          "increase"
                                        )
                                      }
                                      className="flex h-full w-8 items-center justify-center text-zinc-500 hover:text-white"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                                    Item Total
                                  </label>
                                  <div
                                    className="flex h-9 items-center rounded-lg border px-3 text-sm font-bold text-amber-300"
                                    style={{
                                      borderColor: "var(--app-border)",
                                      backgroundColor: "var(--app-surface)",
                                    }}
                                  >
                                    {money(itemTotal(item))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Detailed row for Catalog Products */
                              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-600">
                                    Quantity
                                  </label>
                                  <div
                                    className="flex h-10 items-center rounded-lg border"
                                    style={{
                                      borderColor: "var(--app-border)",
                                      backgroundColor: "var(--app-surface)",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.cartItemId,
                                          "decrease"
                                        )
                                      }
                                      className="flex h-full w-9 items-center justify-center text-zinc-500 hover:text-white"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min="0.001"
                                      step="any"
                                      value={item.quantity ?? ""}
                                      onChange={(e) =>
                                        updateItem(
                                          item.cartItemId,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      className="h-full min-w-0 flex-1 bg-transparent text-center text-sm text-white outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(
                                          item.cartItemId,
                                          "increase"
                                        )
                                      }
                                      className="flex h-full w-9 items-center justify-center text-zinc-500 hover:text-white"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-600">
                                    Unit
                                  </label>
                                  <select
                                    value={item.unit || ""}
                                    onChange={(e) =>
                                      updateItem(
                                        item.cartItemId,
                                        "unit",
                                        e.target.value || null
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border px-3 text-sm text-zinc-300 outline-none"
                                    style={{
                                      borderColor: "var(--app-border)",
                                      backgroundColor: "var(--app-surface)",
                                    }}
                                  >
                                    <option value="">Not specified</option>
                                    <option value="piece">Piece</option>
                                    <option value="kg">Kg</option>
                                    <option value="gram">Gram</option>
                                    <option value="liter">Liter</option>
                                    <option value="ml">Ml</option>
                                    <option value="meter">Meter</option>
                                    <option value="box">Box</option>
                                    <option value="packet">Packet</option>
                                    <option value="dozen">Dozen</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-600">
                                    Price
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={item.price ?? ""}
                                      onChange={(e) =>
                                        updateItem(
                                          item.cartItemId,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Optional"
                                      className="h-10 w-full rounded-lg border pl-7 pr-3 text-sm text-white outline-none placeholder:text-zinc-700"
                                      style={{
                                        borderColor: "var(--app-border)",
                                        backgroundColor: "var(--app-surface)",
                                      }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-600">
                                    Item Total
                                  </label>
                                  <div
                                    className="flex h-10 items-center rounded-lg border px-3 text-sm font-semibold text-white"
                                    style={{
                                      borderColor: "var(--app-border)",
                                      backgroundColor: "var(--app-surface)",
                                    }}
                                  >
                                    {itemTotal(item) > 0
                                      ? money(itemTotal(item))
                                      : "₹0"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="mt-5 rounded-xl border border-dashed px-5 py-12 text-center"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <div
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: "var(--app-accent-soft)",
                        color: "var(--app-accent)",
                      }}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-zinc-300">
                      No products added
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      You can select catalog items, enter a rate in <strong>"Add Unknown"</strong>, or simply enter the total sale amount below.
                    </p>
                  </div>
                )}

                <div
                  className="mt-5 rounded-xl border p-5"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Total Sale Amount
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        Final billing amount recorded by the backend.
                      </p>
                    </div>

                    {calculatedItemsTotal > 0 && (
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                            Cart Items Total
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-zinc-300">
                            {money(calculatedItemsTotal)}
                          </p>
                        </div>

                        {hasEnteredTotal && enteredTotal !== calculatedItemsTotal && (
                          <button
                            type="button"
                            onClick={() => setTotalAmount("")}
                            className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-white"
                          >
                            Reset to {money(calculatedItemsTotal)}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative mt-4">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "var(--app-accent)" }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => {
                        setTotalAmount(e.target.value);
                        clearMessage();
                      }}
                      placeholder={
                        calculatedItemsTotal > 0
                          ? String(calculatedItemsTotal)
                          : "Enter total amount"
                      }
                      className="w-full rounded-lg border py-3 pl-9 pr-4 text-lg font-semibold text-white outline-none placeholder:text-zinc-700"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface)",
                      }}
                    />
                  </div>

                  {/* Auto-detected Unknown item notification when total is higher */}
                  {extraUnknownAmount > 0 && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 text-xs text-amber-300">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-medium text-amber-200">
                          Automatic Unknown Item Detection (+{money(extraUnknownAmount)})
                        </p>
                        <p className="mt-0.5 text-amber-400/90">
                          Total amount is {money(extraUnknownAmount)} higher than listed cart items ({money(calculatedItemsTotal)}). This extra ₹{extraUnknownAmount} will be automatically added as an <strong>"Unknown item"</strong> in the receipt.
                        </p>
                      </div>
                    </div>
                  )}

                  {totalAmount === "" && calculatedItemsTotal > 0 && (
                    <p className="mt-2 text-xs text-zinc-600">
                      If left blank, the calculated product total ({money(calculatedItemsTotal)}) will be used automatically.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Payment method and sale summary */}
            <div className="min-w-0 xl:col-span-1">
              <div
                className="overflow-hidden rounded-xl border xl:sticky xl:top-24"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div
                  className="border-b p-5"
                  style={{
                    borderColor: "var(--app-border)",
                    background: `radial-gradient(circle at top right, var(--app-accent-soft), transparent 55%), var(--app-surface)`,
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: "var(--app-accent)" }}>
                    SALE SUMMARY
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white">Payment Details</h2>
                </div>

                <div className="p-5">
                  <div
                    className="min-w-0 overflow-hidden rounded-xl border p-3 sm:p-4"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-wider text-zinc-600">Total</p>
                    <p className="mt-2 text-3xl font-bold text-white">{money(total)}</p>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-medium text-zinc-300">Payment Type</p>
                    <div className="space-y-2">
                      <PaymentOption
                        active={paymentType === "cash"}
                        icon={<Banknote className="h-4 w-4" />}
                        title="Cash"
                        description="Customer pays the full amount in cash."
                        onClick={() => {
                          setPaymentType("cash");
                          setPaidAmount("");
                          setPartialPaymentType("");
                          clearMessage();
                        }}
                      />

                      <PaymentOption
                        active={paymentType === "upi"}
                        icon={<Smartphone className="h-4 w-4" />}
                        title="UPI"
                        description="Customer pays the full amount by UPI."
                        onClick={() => {
                          setPaymentType("upi");
                          setPaidAmount("");
                          setPartialPaymentType("");
                          clearMessage();
                        }}
                      />

                      <PaymentOption
                        active={paymentType === "credit"}
                        danger
                        icon={<Wallet className="h-4 w-4" />}
                        title="Full Credit"
                        description="Entire amount is added to customer credit."
                        onClick={() => {
                          setPaymentType("credit");
                          setPaidAmount("");
                          setPartialPaymentType("");
                          clearMessage();
                        }}
                      />

                      <PaymentOption
                        active={paymentType === "partial"}
                        icon={<CreditCard className="h-4 w-4" />}
                        title="Partial Payment"
                        description="Some amount is paid now and remaining becomes credit."
                        onClick={() => {
                          setPaymentType("partial");
                          clearMessage();
                        }}
                      />
                    </div>
                  </div>

                  {paymentType === "partial" && (
                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">
                          Amount Paid
                        </label>
                        <div className="relative">
                          <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                            style={{ color: "var(--app-accent)" }}
                          >
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={total}
                            step="0.01"
                            value={paidAmount}
                            onChange={(e) => {
                              setPaidAmount(e.target.value);
                              clearMessage();
                            }}
                            placeholder="Enter amount paid"
                            className="w-full rounded-lg border py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600"
                            style={{
                              borderColor: "var(--app-border)",
                              backgroundColor: "var(--app-surface-light)",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-300">
                          Paid By
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPartialPaymentType("cash")}
                            className="flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm"
                            style={
                              partialPaymentType === "cash"
                                ? {
                                    borderColor: "rgba(34,197,94,.3)",
                                    backgroundColor: "rgba(34,197,94,.05)",
                                    color: "#4ade80",
                                  }
                                : {
                                    borderColor: "var(--app-border)",
                                    backgroundColor: "var(--app-surface-light)",
                                    color: "#a1a1aa",
                                  }
                            }
                          >
                            <Banknote className="h-4 w-4" />
                            Cash
                          </button>

                          <button
                            type="button"
                            onClick={() => setPartialPaymentType("upi")}
                            className="flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm"
                            style={
                              partialPaymentType === "upi"
                                ? {
                                    borderColor: "rgba(34,197,94,.3)",
                                    backgroundColor: "rgba(34,197,94,.05)",
                                    color: "#4ade80",
                                  }
                                : {
                                    borderColor: "var(--app-border)",
                                    backgroundColor: "var(--app-surface-light)",
                                    color: "#a1a1aa",
                                  }
                            }
                          >
                            <Smartphone className="h-4 w-4" />
                            UPI
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className="mt-6 rounded-xl border p-4"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Paid Now</span>
                      <span className="font-semibold text-emerald-400">
                        {money(calculatedPaid)}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-zinc-500">Pending / Credit</span>
                      <span className="font-semibold text-red-400">
                        {money(pendingAmount)}
                      </span>
                    </div>
                  </div>

                  {needsCredit && (
                    <div
                      className="mt-4 rounded-xl border p-4"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          Repayment Due Date
                        </label>
                        {dueDateInfo.isValid && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            {dueDateInfo.diffDays} Days ({dueDateInfo.formattedDate})
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[11px] text-zinc-500">
                        Choose repayment duration or pick a custom date.
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        {[
                          { value: "7", label: "7 Days" },
                          { value: "15", label: "15 Days" },
                          { value: "30", label: "30 Days (Default)" },
                          { value: "45", label: "45 Days" },
                          { value: "60", label: "60 Days" },
                          { value: "custom", label: "📅 Custom Date" },
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                              setCreditTenure(preset.value);
                              if (preset.value === "custom" && !customDueDate) {
                                setCustomDueDate(addDaysToToday(30));
                              }
                            }}
                            className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold transition ${
                              creditTenure === preset.value
                                ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm ring-1 ring-amber-500/30"
                                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Date Picker Controls */}
                      {creditTenure === "custom" && (
                        <div className="mt-3.5 space-y-2.5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-400">
                              Select Specific Due Date:
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              (Min: Tomorrow • Max: 1 Year)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleShiftCustomDays(-1)}
                              title="Decrease 1 Day"
                              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white"
                            >
                              -1d
                            </button>

                            <div className="relative flex-1">
                              <input
                                type="date"
                                min={minDueDateStr}
                                max={maxDueDateStr}
                                value={customDueDate || addDaysToToday(30)}
                                onChange={(e) => setCustomDueDate(e.target.value)}
                                onClick={(e) => {
                                  try {
                                    e.target.showPicker?.();
                                  } catch {}
                                }}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-amber-500 cursor-pointer"
                                style={{
                                  colorScheme: "dark",
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleShiftCustomDays(1)}
                              title="Increase 1 Day"
                              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white"
                            >
                              +1d
                            </button>
                          </div>

                          {/* Quick Jump Chips */}
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] text-zinc-500 mr-1">Quick Jump:</span>
                            {[
                              { label: "+7 Days", days: 7 },
                              { label: "+14 Days", days: 14 },
                              { label: "+30 Days", days: 30 },
                              { label: "+45 Days", days: 45 },
                              { label: "+60 Days", days: 60 },
                              { label: "+90 Days", days: 90 },
                            ].map((chip) => (
                              <button
                                key={chip.days}
                                type="button"
                                onClick={() => setCustomDueDate(addDaysToToday(chip.days))}
                                className="rounded border border-zinc-800 bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Live Date Confirmation Card */}
                      {dueDateInfo.isValid ? (
                        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">
                          <div className="flex items-center justify-between font-semibold">
                            <span>📅 Repayment Due:</span>
                            <span className="text-amber-300 font-bold">{dueDateInfo.formattedDate}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-amber-300/80">
                            <span>Time to Clear:</span>
                            <span>{dueDateInfo.diffDays} days from today</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                          <span>{dueDateInfo.error || "Please select a valid future due date."}</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-[11px] text-zinc-400 leading-relaxed">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-semibold text-zinc-300">Repayment Policy:</span> Customer can extend this due date <strong>exactly 1 time</strong> if in emergency. Dues unpaid past this due date will directly penalize Trust Score.
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedCustomer && pendingAmount > 0 && (
                    <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-3 text-xs text-red-400">
                      Customer is required because {money(pendingAmount)} will become credit.
                    </div>
                  )}

                  {selectedCustomer && needsCredit && pendingAmount > 0 && (
                    <div
                      className="mt-4 rounded-lg border px-3 py-3 text-xs"
                      style={
                        creditExceeded
                          ? {
                              borderColor: "rgba(239,68,68,.2)",
                              backgroundColor: "rgba(239,68,68,.05)",
                              color: "#f87171",
                            }
                          : {
                              borderColor: "var(--app-accent-border)",
                              backgroundColor: "var(--app-accent-soft)",
                              color: "var(--app-accent)",
                            }
                      }
                    >
                      {creditExceeded
                        ? `Credit limit exceeded by ${money(pendingAmount - availableCredit)}.`
                        : `${money(pendingAmount)} will be added to customer's credit.`}
                    </div>
                  )}

                  <div className="mt-5 space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600">Customer</span>
                      <span className="text-right text-zinc-300">
                        {selectedCustomer
                          ? getCustomerName(selectedCustomer)
                          : "Walk-in Customer"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600">Items</span>
                      <span className="text-right text-zinc-300">
                        {preparedItems.length} items
                        {extraUnknownAmount > 0 && (
                          <span className="block text-[10px] text-amber-400">
                            (+{money(extraUnknownAmount)} Unknown)
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600">Payment</span>
                      <span className="capitalize text-zinc-300">
                        {paymentType === "partial"
                          ? `Partial (${partialPaymentType || "method not selected"})`
                          : paymentType}
                      </span>
                    </div>

                    {selectedCustomer && (
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-600">Credit Limit</span>
                        <span className="text-right text-zinc-300">
                          {creditLimit > 0 ? (
                            <span>
                              {money(creditLimit)}{" "}
                              <span
                                className={`rounded px-1 py-0.5 text-[10px] font-bold ${
                                  getCustomerCreditMode(selectedCustomer) === "manual"
                                    ? "border border-blue-500/30 bg-blue-500/10 text-blue-400"
                                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                }`}
                              >
                                {getCustomerCreditMode(selectedCustomer) === "manual" ? "Manual" : "Auto"}
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">₹0 (No Limit)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || total <= 0}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--app-accent)",
                      boxShadow: "0 10px 25px var(--app-accent-soft)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating Sale...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Create Sale
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetSale}
                    disabled={submitting}
                    className="mt-2 w-full rounded-lg border px-5 py-3 text-sm font-medium text-zinc-400 transition hover:text-white disabled:opacity-50"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    Clear Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Printable Bill / Invoice Modal */}
        {createdReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border p-6 shadow-2xl"
              style={{
                borderColor: "var(--app-accent-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: "var(--app-border)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    S
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">SmartShop Retail Bill</h3>
                    <p className="font-mono text-xs text-zinc-400">Invoice: {createdReceipt.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCreatedReceipt(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer & Bill Meta */}
              <div className="my-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500">Customer:</span>
                  <p className="font-bold text-white">{createdReceipt.customerName}</p>
                  {createdReceipt.customerPhone && (
                    <p className="text-zinc-400">{createdReceipt.customerPhone}</p>
                  )}
                </div>
                <div>
                  <span className="text-zinc-500">Date & Time:</span>
                  <p className="font-medium text-zinc-200">{createdReceipt.date}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Payment Mode:</span>
                  <p className="font-bold text-emerald-400">{createdReceipt.paymentType}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Bill Status:</span>
                  <p className="font-semibold text-zinc-200">
                    {createdReceipt.pendingAmount > 0 ? "Partial / Due" : "Completed / Paid"}
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div
                className="my-4 max-h-56 overflow-y-auto rounded-xl border p-3"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                      <th className="pb-2">Item Name</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--app-border)" }}>
                    {createdReceipt.items && createdReceipt.items.length > 0 ? (
                      createdReceipt.items.map((item, idx) => (
                        <tr key={idx} className="text-zinc-300">
                          <td className="py-2 font-medium text-white">
                            {item.productName || "Unknown Item"}
                          </td>
                          <td className="py-2 text-center text-zinc-400">
                            {item.quantity ?? 1} {item.unit || ""}
                          </td>
                          <td className="py-2 text-right font-mono text-zinc-400">
                            ₹{item.price || 0}
                          </td>
                          <td className="py-2 text-right font-bold font-mono text-white">
                            ₹{item.total || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-zinc-400">
                          Total Bill Amount: ₹{createdReceipt.totalAmount}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: "var(--app-border)" }}>
                <div className="flex justify-between text-base font-extrabold text-white">
                  <span>Total Amount:</span>
                  <span style={{ color: "var(--app-accent)" }}>
                    ₹{Number(createdReceipt.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {createdReceipt.paidAmount > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Amount Paid:</span>
                    <span className="font-semibold text-emerald-400">
                      ₹{Number(createdReceipt.paidAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {createdReceipt.pendingAmount > 0 && (
                  <div className="flex justify-between text-zinc-300">
                    <span>Balance Due (Credit):</span>
                    <span className="font-bold text-rose-400">
                      ₹{Number(createdReceipt.pendingAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => printSaleBillPDF(createdReceipt)}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-white/10 cursor-pointer"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Bill / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreatedReceipt(null)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  Done / Next Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Payment type selection button
const PaymentOption = ({
  active,
  danger = false,
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border p-3 text-left transition-all"
      style={
        active
          ? danger
            ? {
                borderColor: "rgba(239,68,68,.3)",
                backgroundColor: "rgba(239,68,68,.05)",
              }
            : {
                borderColor: "var(--app-accent-border)",
                backgroundColor: "var(--app-accent-soft)",
              }
          : {
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface-light)",
            }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: active
                ? danger
                  ? "rgba(239,68,68,.1)"
                  : "var(--app-accent-soft)"
                : "var(--app-surface)",
              color: active
                ? danger
                  ? "#f87171"
                  : "var(--app-accent)"
                : "#71717a",
            }}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200">{title}</p>
            <p className="mt-1 break-words text-xs text-zinc-600">{description}</p>
          </div>
        </div>

        <span
          className="h-4 w-4 shrink-0 rounded-full border"
          style={{
            borderColor: active
              ? danger
                ? "#f87171"
                : "var(--app-accent)"
              : "#3f3f46",
            backgroundColor: active
              ? danger
                ? "#f87171"
                : "var(--app-accent)"
              : "transparent",
          }}
        />
      </div>
    </button>
  );
};

export default Sales;