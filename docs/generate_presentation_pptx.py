import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    os.makedirs("d:/SmartShop/docs", exist_ok=True)
    pptx_path = "d:/SmartShop/docs/SmartShop_Project_Presentation.pptx"
    
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Palette
    NAVY = RGBColor(15, 23, 42)          # Slate 900
    PRIMARY = RGBColor(30, 58, 138)       # Deep Blue
    ACCENT = RGBColor(2, 132, 199)        # Sky Blue 600
    CARD_BG = RGBColor(255, 255, 255)     # White
    CARD_BORDER = RGBColor(203, 213, 225) # Slate 300
    TEXT_DARK = RGBColor(15, 23, 42)
    WHITE = RGBColor(255, 255, 255)
    GREEN = RGBColor(22, 163, 74)

    blank_layout = prs.slide_layouts[6]

    def add_header(slide, title_text, category_text="MCA 3RD SEMESTER MINI PROJECT PRESENTATION"):
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_cat = tf.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.name = "Arial"
        p_cat.font.size = Pt(10.5)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT
        
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.name = "Arial"
        p_title.font.size = Pt(23)
        p_title.font.bold = True
        p_title.font.color.rgb = PRIMARY
        
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.45), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = CARD_BORDER
        line.line.color.rgb = CARD_BORDER

    def add_card(slide, left, top, width, height, title, items, bg_color=CARD_BG, border_color=CARD_BORDER, title_color=PRIMARY):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        
        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        if title:
            p_title = tf.paragraphs[0]
            p_title.text = title
            p_title.font.name = "Arial"
            p_title.font.size = Pt(14.5)
            p_title.font.bold = True
            p_title.font.color.rgb = title_color
            p_title.space_after = Pt(8)
        
        for i, item in enumerate(items):
            p = tf.add_paragraph() if (title or i > 0) else tf.paragraphs[0]
            p.text = f"•  {item}" if not item.startswith(" ") else item
            p.font.name = "Arial"
            p.font.size = Pt(11.5)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(5)

    # ----------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # ----------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = NAVY
    bg1.line.fill.background()

    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.4), Inches(11.333), Inches(3.0))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    
    p_tag = tf1.paragraphs[0]
    p_tag.text = "MCA 3RD SEMESTER MINI PROJECT PRESENTATION"
    p_tag.font.name = "Arial"
    p_tag.font.size = Pt(13)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT
    
    p_main = tf1.add_paragraph()
    p_main.text = "SmartShop"
    p_main.font.name = "Arial"
    p_main.font.size = Pt(44)
    p_main.font.bold = True
    p_main.font.color.rgb = WHITE
    
    p_sub = tf1.add_paragraph()
    p_sub.text = "A Fullstack Digital Shop Management, POS Billing & Customer Khata Ledger Platform"
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(17)
    p_sub.font.color.rgb = RGBColor(148, 163, 184)
    p_sub.space_before = Pt(8)

    meta_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.7), Inches(11.333), Inches(1.8))
    meta_box.fill.solid()
    meta_box.fill.fore_color.rgb = RGBColor(30, 41, 59)
    meta_box.line.color.rgb = RGBColor(51, 65, 85)
    
    mtb = s1.shapes.add_textbox(Inches(1.3), Inches(4.9), Inches(10.733), Inches(1.4))
    mtf = mtb.text_frame
    mtf.word_wrap = True
    
    p1 = mtf.paragraphs[0]
    p1.text = "Submitted By:  Ajit Kumar (Roll No: 2504280140008)     |      Course: Master of Computer Applications (MCA 3rd Sem)"
    p1.font.name = "Arial"
    p1.font.size = Pt(13)
    p1.font.bold = True
    p1.font.color.rgb = WHITE
    
    p2 = mtf.add_paragraph()
    p2.text = "Guided By:  Faculty Project Guide / Project Coordinator"
    p2.font.name = "Arial"
    p2.font.size = Pt(12.5)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.space_before = Pt(6)
    
    p3 = mtf.add_paragraph()
    p3.text = "Academic Session: 2026 – 2027                 |      Tech Stack: MERN Stack (MongoDB, Express, React 19, Node.js)"
    p3.font.name = "Arial"
    p3.font.size = Pt(12)
    p3.font.color.rgb = ACCENT
    p3.space_before = Pt(5)

    # ----------------------------------------------------
    # SLIDE 2: PROJECT OVERVIEW & ABSTRACT
    # ----------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Project Overview & Key Highlights")
    
    add_card(s2, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1), 
             "What is SmartShop?", [
                 "A cloud-based web application tailored for neighborhood retail stores, supermarkets, and provision shops.",
                 "Solves the real-world problem of customers not knowing item availability by letting them check live stock from home.",
                 "Integrates high-speed Point-of-Sale (POS) counter billing with a digital Customer Credit Ledger ('Khata').",
                 "Replaces physical paper notebooks with real-time cloud data storage and automatic calculations."
             ])
             
    add_card(s2, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1), 
             "Core Value Delivered", [
                 "Home Stock Availability: Customers browse categories, prices, and stock indicators before visiting the shop.",
                 "Multi-Mode POS Billing: Supports Cash, UPI, Credit (Khata), and Partial payment combinations.",
                 "Transparent Customer Ledger: 24/7 self-service portal to view itemized bills and settle pending dues.",
                 "Automated Returns & Restocking: Full and partial product returns automatically adjust inventory and debt."
             ])

    # ----------------------------------------------------
    # SLIDE 3: PROBLEM STATEMENT
    # ----------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Problem Statement & Real-World Motivation")
    
    add_card(s3, Inches(0.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "1. Customer Inconvenience", [
                 "Customers walk to the shop only to find essential grocery items out of stock.",
                 "No quick way to verify current item prices or stock levels from home.",
                 "Wasted physical trips and poor customer shopping experience."
             ], bg_color=RGBColor(254, 242, 242), border_color=RGBColor(252, 165, 165), title_color=RGBColor(185, 28, 28))
             
    add_card(s3, Inches(4.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "2. Paper Khata Limitations", [
                 "Handwritten arithmetic errors during daily ledger tallying.",
                 "Physical register damage, torn pages, or ink fading.",
                 "Frequent arguments with customers over old unverified dues.",
                 "No payment proof or timestamp audit trail."
             ], bg_color=RGBColor(254, 243, 199), border_color=RGBColor(253, 230, 138), title_color=RGBColor(180, 83, 9))
             
    add_card(s3, Inches(8.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "3. The SmartShop Solution", [
                 "Live Catalog & Stock check from home on mobile/PC.",
                 "Fast POS counter billing with multi-payment modes.",
                 "Automated digital ledger with borrow limits and due dates.",
                 "Admin payment verification queue with screenshot proofs."
             ], bg_color=RGBColor(240, 253, 244), border_color=RGBColor(187, 247, 208), title_color=GREEN)

    # ----------------------------------------------------
    # SLIDE 4: OBJECTIVES & SCOPE
    # ----------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Project Objectives & Scope")
    
    add_card(s4, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Primary Functional Objectives", [
                 "Live Product Catalog: Allow customers to browse inventory and verify stock availability from home.",
                 "Fast POS Counter Billing: Enable shopkeepers to create bills in seconds via Cash, UPI, Credit, or Partial splits.",
                 "Digital Credit Ledger ('Khata'): Maintain customer debt balances, repayment due dates, and borrow limits.",
                 "Payment Claims Verification: Admin dashboard to review and approve customer Cash/UPI payment proofs.",
                 "Product Returns Management: Restock returned items and deduct customer debt atomically."
             ])
             
    add_card(s4, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Technical & Non-Functional Scope", [
                 "MERN Architecture: Modular React 19 frontend and asynchronous Node.js / Express.js REST backend.",
                 "ACID Reliability: Multi-document write operations protected with MongoDB transaction rollbacks.",
                 "Cloud Storage: Cloudinary CDN integration for product images and receipt screenshot storage.",
                 "Online Gateway: Razorpay API integration for instant online credit clearance.",
                 "Responsive Layout: Tailored glassmorphism UI for Mobile, Tablet, and Desktop screens."
             ])

    # ----------------------------------------------------
    # SLIDE 5: TECHNOLOGY STACK
    # ----------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Technology Stack & Tools")
    
    add_card(s5, Inches(0.8), Inches(1.7), Inches(2.7), Inches(5.1),
             "Frontend UI", [
                 "React 19 (Component UI)",
                 "Vite (Build Tool)",
                 "TailwindCSS (Styling)",
                 "Lucide React (Icons)",
                 "Responsive Glass UI"
             ])
             
    add_card(s5, Inches(3.8), Inches(1.7), Inches(2.7), Inches(5.1),
             "Backend API", [
                 "Node.js (Runtime)",
                 "Express.js (REST API)",
                 "ESM Modules Structure",
                 "Multer (Uploads)",
                 "Security Middleware"
             ])
             
    add_card(s5, Inches(6.8), Inches(1.7), Inches(2.7), Inches(5.1),
             "Database & Cloud", [
                 "MongoDB (Document DB)",
                 "Mongoose (ORM)",
                 "Cloudinary (Image CDN)",
                 "ACID Transactions",
                 "Atomic $inc Operators"
             ])
             
    add_card(s5, Inches(9.8), Inches(1.7), Inches(2.7), Inches(5.1),
             "Auth & Payments", [
                 "JWT (Token Auth)",
                 "Bcrypt.js (Hashing)",
                 "Single-Use Reset Tokens",
                 "Razorpay Payment API",
                 "RBAC Role Middleware"
             ])

    # ----------------------------------------------------
    # SLIDE 6: SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "3-Tier System Architecture")
    
    add_card(s6, Inches(0.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "1. Presentation Tier (Client)", [
                 "Customer Portal: Browse stock from home, view bills, and submit payments.",
                 "Admin POS Portal: Point-of-sale billing, returns, customers, stock, and logs.",
                 "Universal Responsiveness: Adapts seamlessly to Mobile, Tablet, and Desktop screens."
             ])
             
    add_card(s6, Inches(4.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "2. Application Tier (Server)", [
                 "REST API Routes: /users, /products, /sales, /credits, /payments, /returns.",
                 "Auth & Role Middleware: Validates JWT tokens and enforces permissions.",
                 "Transaction Manager: Coordinates atomic multi-document writes."
             ])
             
    add_card(s6, Inches(8.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "3. Database & Cloud Tier", [
                 "MongoDB Database: Persists 7 core collections with relational ObjectId links.",
                 "Cloudinary CDN: Optimized cloud storage for product and receipt images.",
                 "Razorpay Gateway: Secure payment checkout and webhook verification."
             ])

    # ----------------------------------------------------
    # SLIDE 7: CORE MODULE - POS BILLING
    # ----------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Core Module: POS Billing Engine")
    
    add_card(s7, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "POS Counter Billing Features", [
                 "Fast Catalog Search: Instant product selection with live price and stock display.",
                 "Mixed Cart Support: Handles catalog products and custom walk-in items simultaneously.",
                 "Flexible Settlement Modes:",
                 "  • 100% Cash: Instant clearance and cash drawer record.",
                 "  • 100% UPI: Fast digital QR code collection.",
                 "  • 100% Credit (Khata): Automatically adds to customer's credit ledger.",
                 "  • Partial Split: E.g., Pay ₹300 cash, balance ₹700 added to credit ledger."
             ])
             
    add_card(s7, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Stock & Credit Safeguards", [
                 "Atomic Stock Deduction: Decrements product stock using {$gte: qty} to prevent negative stock.",
                 "Auto Availability Toggle: Automatically marks items 'Out of Stock' when stock reaches 0.",
                 "Borrow Limit Enforcement: Validates customer debt ceiling before approving credit sales.",
                 "ACID Transaction: Stock deduction, sale record, and credit creation succeed together or rollback."
             ])

    # ----------------------------------------------------
    # SLIDE 8: CORE MODULE - DIGITAL KHATA
    # ----------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Core Module: Digital Credit Ledger ('Khata')")
    
    add_card(s8, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Ledger Mechanics & Tracking", [
                 "Customer Credit Ledger: Tracks total borrowed, paid amount, and net pending balance.",
                 "Due Date Timeline: Configurable repayment deadlines for each credit entry.",
                 "Credit Statuses: 'Active', 'Partially Paid', 'Paid', and 'Overdue'.",
                 "Historical Invoice Link: Every credit record links directly to its original sale invoice."
             ])
             
    add_card(s8, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Trust Score & Risk Control", [
                 "Customer Trust Rating: Computed based on repayment punctuality and history.",
                 "Custom Borrow Limits: Shopkeeper can set maximum credit limit for individual customers.",
                 "FIFO Debt Reduction: Payments automatically settle the oldest active credit first.",
                 "Customer Transparency: Customers see exact real-time balance on their own mobile devices."
             ])

    # ----------------------------------------------------
    # SLIDE 9: CORE MODULE - RETURNS & ADJUSTMENT
    # ----------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Core Module: Product Returns & Balance Adjustment")
    
    add_card(s9, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Return Processing Modes", [
                 "Full Sale Return: Returns all items from an invoice, restores inventory, and clears credit.",
                 "Partial Item Return: Shopkeeper selects specific returned item and quantity.",
                 "Return Reasons Tracking: Captures reason (Damaged, Expired, Wrong Item, Customer Change).",
                 "Admin Accountability: Records which admin authorized the return."
             ])
             
    add_card(s9, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Automated Balance Correction", [
                 "Automatic Stock Restoration: Returned item quantities are restored back into product inventory.",
                 "Ledger Debt Offset: If sale was on Credit, return amount automatically subtracts from customer's debt.",
                 "Cash Refund Calculation: For fully paid sales, calculates direct refund payout to the customer.",
                 "Transactional Integrity: Inventory restock and debt offset execute in an atomic transaction."
             ])

    # ----------------------------------------------------
    # SLIDE 10: CORE MODULE - PAYMENTS & VERIFICATION
    # ----------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Core Module: Payments & Claims Verification")
    
    add_card(s10, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Customer Payment Options", [
                 "Cash Payment Claim: Customer submits a claim specifying the store clerk who received physical cash.",
                 "UPI Proof Upload: Customer enters UPI UTR Transaction ID and uploads payment screenshot.",
                 "Razorpay Gateway: Instant online clearance via UPI, Debit/Credit Card, or Netbanking.",
                 "Real-Time Statuses: Displays 'Pending Verification', 'Approved', or 'Rejected'."
             ])
             
    add_card(s10, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Admin Verification Dashboard", [
                 "Verification Queue: Lists all pending customer claims awaiting admin review.",
                 "Screenshot Preview: Admins inspect uploaded receipt images stored on Cloudinary.",
                 "One-Click Approve / Reject: Approving immediately decreases customer debt via atomic $inc.",
                 "Audit Trail: Saves timestamps, verifying admin details, and remarks."
             ])

    # ----------------------------------------------------
    # SLIDE 11: DATABASE SCHEMA
    # ----------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Database Design (7 Core Collections)")
    
    add_card(s11, Inches(0.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "User & Customer Collections", [
                 "D1: Users Collection",
                 "  • name, username, email, phone",
                 "  • password (bcrypt hash)",
                 "  • role: 'customer'|'admin'",
                 "  • resetPasswordToken & Expire",
                 "D2: Customers Collection",
                 "  • userId (ref: User)",
                 "  • pendingAmount, totalPurchase",
                 "  • trustScore, manualBorrowLimit"
             ])
             
    add_card(s11, Inches(4.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "Product & Sales Collections", [
                 "D3: Products Collection",
                 "  • name, category, price, stock, unit",
                 "  • imageUrl (Cloudinary CDN)",
                 "  • available & deleted flags",
                 "D4: Sales Collection",
                 "  • customerId, adminId",
                 "  • items: [{ productId, qty, price, total }]",
                 "  • paymentType: cash|upi|credit|partial",
                 "  • paidAmount, pendingAmount, creditId"
             ])
             
    add_card(s11, Inches(8.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "Khata, Payment & Returns", [
                 "D5: Credits Collection (Khata)",
                 "  • customerId, userId, saleId",
                 "  • borrowedAmount, paidAmount, pending",
                 "  • dueDate, extensionCount, status",
                 "D6: Payments Collection",
                 "  • creditId, amount, method, status",
                 "  • transactionId, paymentProof, verifiedBy",
                 "D7: Returns Collection",
                 "  • saleId, items, refundAmount, processedBy"
             ])

    # ----------------------------------------------------
    # SLIDE 12: SECURITY & ATOMICITY
    # ----------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Security & Transactional Reliability")
    
    add_card(s12, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Database Atomicity (ACID Rollbacks)", [
                 "Multi-Document Transactions: Wrapped in session.withTransaction() so errors trigger complete rollback.",
                 "Zero Corrupted Ledgers: If balance update fails, sale and payment records are rolled back automatically.",
                 "Atomic Math Operators: Uses MongoDB $inc for debt increments/decrements to avoid concurrency races.",
                 "Stock Availability Locks: Conditional updates ensure stock never drops below 0 during peak billing."
             ], bg_color=RGBColor(240, 253, 244), border_color=RGBColor(187, 247, 208), title_color=GREEN)
             
    add_card(s12, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Authentication & Network Security", [
                 "Stateless JWT Tokens: Secure JSON Web Tokens with cryptographically signed payloads.",
                 "Single-Use Password Reset Tokens: Reset tokens are invalidated immediately upon first use in DB.",
                 "Security Response Headers: Hardened with nosniff, frameguard (X-Frame-Options), and XSS filters.",
                 "Environment Isolation: All API keys, Cloudinary secrets, and DB URLs strictly shielded via .env."
             ])

    # ----------------------------------------------------
    # SLIDE 13: ADVANTAGES & PRACTICAL IMPACT
    # ----------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Key Advantages & Project Impact")
    
    add_card(s13, Inches(0.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "For Shopkeepers (Admins)", [
                 "Over 80% faster counter billing compared to manual paper slips.",
                 "Zero revenue loss from forgotten or disputed credit balances.",
                 "Live inventory tracking with out-of-stock indicators.",
                 "Full audit trail of all staff activities."
             ])
             
    add_card(s13, Inches(4.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "For Retail Customers", [
                 "Browse catalog & stock availability from home before visiting store.",
                 "24/7 access to personal purchase history and khata dues.",
                 "Flexible payment settlement (Cash, UPI, Online Gateway).",
                 "Total transparency on item prices, discounts, and payments."
             ])
             
    add_card(s13, Inches(8.8), Inches(1.7), Inches(3.7), Inches(5.1),
             "Technical Strengths", [
                 "100% Web-Based; works seamlessly on any modern device.",
                 "Zero proprietary hardware requirements.",
                 "Scalable MERN stack architecture.",
                 "Production-ready stability (0 build errors)."
             ])

    # ----------------------------------------------------
    # SLIDE 14: FUTURE ENHANCEMENTS & CONCLUSION
    # ----------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Future Roadmap & Project Conclusion")
    
    add_card(s14, Inches(0.8), Inches(1.7), Inches(5.6), Inches(5.1),
             "Future Scope (Planned Enhancements)", [
                 "OTP-Based Customer Login: Passwordless login via SMS/Email OTP for faster customer access.",
                 "OTP-Based Password Reset: Time-sensitive OTP verification for secure forgot password recovery.",
                 "WhatsApp / SMS Bill & Due Alerts: Automated notifications for new bills and upcoming khata due dates.",
                 "Thermal POS Receipt Printing: Direct USB/Bluetooth printer support for instant billing slips."
             ])
             
    add_card(s14, Inches(6.8), Inches(1.7), Inches(5.7), Inches(5.1),
             "Conclusion", [
                 "SmartShop successfully bridges the gap between traditional retail credit management and modern web technology.",
                 "Replaces fragile paper ledgers with an ACID-compliant, transparent digital ledger platform.",
                 "Successfully fulfills all functional requirements for an MCA 3rd Semester Mini Project.",
                 "Demonstrates practical fullstack engineering with React 19, Node.js, Express, and MongoDB."
             ])

    # ----------------------------------------------------
    # SLIDE 15: THANK YOU / Q&A
    # ----------------------------------------------------
    s15 = prs.slides.add_slide(blank_layout)
    bg15 = s15.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg15.fill.solid()
    bg15.fill.fore_color.rgb = NAVY
    bg15.line.fill.background()

    tbox15 = s15.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.333), Inches(3.5))
    tf15 = tbox15.text_frame
    tf15.word_wrap = True
    
    p_thx = tf15.paragraphs[0]
    p_thx.text = "Thank You!"
    p_thx.font.name = "Arial"
    p_thx.font.size = Pt(48)
    p_thx.font.bold = True
    p_thx.font.color.rgb = WHITE
    p_thx.alignment = PP_ALIGN.CENTER
    
    p_qa = tf15.add_paragraph()
    p_qa.text = "Questions & Answers (Q&A)"
    p_qa.font.name = "Arial"
    p_qa.font.size = Pt(22)
    p_qa.font.color.rgb = ACCENT
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.space_before = Pt(12)
    
    p_foot = tf15.add_paragraph()
    p_foot.text = "SmartShop — Digital Shop Management, POS & Khata Ledger Platform"
    p_foot.font.name = "Arial"
    p_foot.font.size = Pt(14)
    p_foot.font.color.rgb = RGBColor(148, 163, 184)
    p_foot.alignment = PP_ALIGN.CENTER
    p_foot.space_before = Pt(24)

    prs.save(pptx_path)
    print("MCA Mini Project Presentation PPTX generated at:", pptx_path)

if __name__ == "__main__":
    create_presentation()
