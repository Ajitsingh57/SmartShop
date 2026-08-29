import React, { useState } from "react";
import { Link } from "react-router-dom";

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(null);

  // FAQ entries for admin operations and system troubleshooting
  const faqs = [
    {
      question: "What is SmartShop?",
      answer:
        "SmartShop is a shop management system designed to help manage products, customers, sales, payments, orders and other daily shop operations from one place.",
    },
    {
      question: "Who can access the administration panel?",
      answer:
        "The administration panel is available only to authorized administrator accounts. The Super Admin manages administrator accounts and controls their access.",
    },
    {
      question: "How can I manage products?",
      answer:
        "You can add, update and manage product information from the Products section of the administration panel.",
    },
    {
      question: "How can I check sales and payments?",
      answer:
        "Sales and payment information can be viewed from their respective sections in SmartShop. You can use the available filters and records to review the required information.",
    },
    {
      question: "What should I do if I cannot access my account?",
      answer:
        "Make sure your username and password are correct. If you still cannot access your account, contact the system administrator or support team.",
    },
    {
      question: "How can I report a problem?",
      answer:
        "If you encounter a problem while using SmartShop, use the Contact Support option below and provide a clear description of the issue.",
    },
  ];

  const supportItems = [
    {
      icon: "?",
      title: "Help Center",
      description:
        "Find useful guidance for using SmartShop and understanding its main features.",
    },
    {
      icon: "Q",
      title: "FAQs",
      description:
        "Quick answers to common questions about accounts, products, sales and administration.",
    },
    {
      icon: "✉",
      title: "Contact Support",
      description:
        "Need assistance? Contact the support team with details about your issue.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Support hero section */}
        <div
          className="relative mb-6 overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 85% 20%, var(--app-accent-soft), transparent 32%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
          }}
        >
          <div className="relative z-10 max-w-3xl">
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
              Support Center
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Help & Support
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
              Find answers, get guidance and learn how to use SmartShop effectively for your daily shop management.
            </p>
          </div>

          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
          <div
            className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
        </div>

        {/* Support resource category cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {supportItems.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--app-accent-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--app-border)";
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">{item.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expandable accordion FAQs */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: "var(--app-border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--app-accent)" }}>
              Frequently Asked Questions
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">Common Questions</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Quick answers to common SmartShop questions.
            </p>
          </div>

          <div>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  key={faq.question}
                  className="border-b last:border-0"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition sm:px-6"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span className="text-sm font-medium text-zinc-300">{faq.question}</span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                      style={{
                        backgroundColor: isOpen ? "var(--app-accent-soft)" : "var(--app-surface-light)",
                        color: "var(--app-accent)",
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6">
                      <p className="max-w-4xl text-xs leading-6 text-zinc-500">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact helpdesk card */}
        <div
          className="mt-6 rounded-xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 90% 20%, var(--app-accent-soft), transparent 45%), var(--app-surface)`,
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                }}
              >
                ✉
              </div>

              <div>
                <p className="text-xs font-medium" style={{ color: "var(--app-accent)" }}>
                  Need More Help?
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">Contact Support</h2>
                <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
                  If you couldn't find the answer you were looking for, contact the support team and describe your issue clearly.
                </p>
              </div>
            </div>

            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-lg px-5 py-3 text-xs font-semibold text-white transition"
              style={{
                backgroundColor: "var(--app-accent)",
                boxShadow: "0 8px 20px var(--app-accent-soft)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--app-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--app-accent)";
              }}
            >
              Contact Support →
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-600">Want to know more about SmartShop?</p>
          <Link
            to="/about"
            className="mt-1 inline-block text-xs font-medium transition"
            style={{ color: "var(--app-accent)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Learn more about SmartShop →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;