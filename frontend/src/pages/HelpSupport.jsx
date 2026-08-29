import React, { useState } from "react";
import { Link } from "react-router-dom";

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How does the Digital Khata / Credit system work?",
      answer:
        "When you make purchases at the shop, the store admin records the transaction to your customer account. You can track your borrowed amount, due dates, and payment history in real-time.",
    },
    {
      question: "How can I check my purchases and credit history?",
      answer:
        "You can view all your purchases, payment settlements, and credit adjustments from the Transactions section of your SmartShop account.",
    },
    {
      question: "How can I clear or settle my pending credit amount?",
      answer:
        "Visit the Payments page in your account. You can make payments via Cash (verified by shop admin) or UPI / Online payment options.",
    },
    {
      question: "What should I do if my payment claim is pending verification?",
      answer:
        "Cash and manual UPI payment claims are reviewed and approved by the store administrator. Once verified, your outstanding balance updates automatically.",
    },
    {
      question: "I forgot my password. How can I regain access?",
      answer:
        "Go to the Login page and click 'Forgot Password?' to generate a secure reset link for your registered email, phone or username.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px]">
      <div
        className="mx-auto max-w-5xl rounded-xl border border-white/5 p-5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:rounded-[16px] sm:p-8 md:p-10"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Help & Support
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Find answers to common questions or get help with your SmartShop account and credit ledger.
          </p>
        </div>

        {/* Support contact cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 transition duration-300 hover:border-[var(--app-accent-border)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
              ?
            </div>
            <h2 className="text-xl font-semibold text-white">Need Help?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Check the frequently asked questions below to understand your account, credits and payments.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 transition duration-300 hover:border-[var(--app-accent-border)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
              @
            </div>
            <h2 className="text-xl font-semibold text-white">Contact Store Support</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              For ledger, credit limit or payment verification assistance, reach out to support.
            </p>
            <a
              href="mailto:support@smartshop.com"
              className="mt-4 inline-block text-sm font-medium text-[var(--app-accent)] transition hover:text-[var(--app-accent-hover)]"
            >
              support@smartshop.com
            </a>
          </div>
        </div>

        {/* FAQ accordions */}
        <div>
          <h2 className="mb-5 text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-zinc-900"
                  >
                    <span className="text-sm font-medium text-zinc-200 sm:text-base">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-xl text-[var(--app-accent)]">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-800 px-5 py-4">
                      <p className="text-sm leading-6 text-zinc-500">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/settings"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            Back to Settings
          </Link>

          <Link
            to="/"
            className="rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;