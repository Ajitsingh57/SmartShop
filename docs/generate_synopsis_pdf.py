import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header
        self.drawString(54, 11 * inch - 36, "SmartShop — Major Project Synopsis")
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Academic Year 2025-2026")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        self.line(54, 48, 8.5 * inch - 54, 48)
        self.drawString(54, 34, "Digital Shop Management & Khata POS System")
        self.drawRightString(8.5 * inch - 54, 34, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def create_synopsis():
    os.makedirs("d:/SmartShop/docs", exist_ok=True)
    pdf_path = "d:/SmartShop/docs/SmartShop_Project_Synopsis.pdf"
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#1e3a8a")  # Deep blue
    accent_color = colors.HexColor("#0284c7")   # Sky blue
    text_dark = colors.HexColor("#0f172a")      # Slate 900
    text_muted = colors.HexColor("#475569")     # Slate 600
    
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=primary_color
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        alignment=TA_CENTER,
        textColor=accent_color
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color
    )
    
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_dark
    )
    
    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=20,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        alignment=TA_JUSTIFY,
        textColor=text_dark,
        spaceAfter=6
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        alignment=TA_LEFT,
        textColor=text_dark,
        leftIndent=15,
        spaceAfter=3
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 20))
    story.append(Paragraph("PROJECT SYNOPSIS", ParagraphStyle('SubHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, alignment=TA_CENTER, textColor=text_muted, spaceAfter=10)))
    story.append(Paragraph("SMARTSHOP", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("A Modern Digital Shop Management, POS & Customer Khata Ledger Platform", subtitle_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceBefore=5, spaceAfter=25))
    
    story.append(Spacer(1, 15))
    
    # Project submission metadata box
    submission_data = [
        [Paragraph("Course / Degree:", meta_label_style), Paragraph("Bachelor of Technology / Computer Science & Engineering (B.Tech CSE / BCA / MCA)", meta_val_style)],
        [Paragraph("Project Title:", meta_label_style), Paragraph("SmartShop — Fullstack Digital Shop Management System", meta_val_style)],
        [Paragraph("Project Category:", meta_label_style), Paragraph("Web Application / Enterprise POS & Ledger Management", meta_val_style)],
        [Paragraph("Technology Stack:", meta_label_style), Paragraph("MERN Stack (MongoDB, Express.js, React 19, Node.js), TailwindCSS", meta_val_style)],
        [Paragraph("Submitted By:", meta_label_style), Paragraph("Student Name: <b>Ajit Singh</b> & Team", meta_val_style)],
        [Paragraph("Guided By:", meta_label_style), Paragraph("Project Coordinator / Faculty Guide", meta_val_style)],
        [Paragraph("Academic Session:", meta_label_style), Paragraph("2025 – 2026", meta_val_style)],
    ]
    
    sub_table = Table(submission_data, colWidths=[130, 370])
    sub_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(sub_table)
    
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>ABSTRACT</b>", h1_style))
    story.append(Paragraph(
        "Small and medium retail shops in India heavily rely on manual paper notebooks (Khata bahi) to record customer credit, daily billing, and stock levels. This traditional method suffers from record loss, calculation errors, lack of payment transparency, and absence of real-time inventory tracking. "
        "<b>SmartShop</b> is an integrated, full-stack digital shop management and point-of-sale (POS) web platform built to solve these critical bottlenecks. It enables shop administrators to record fast multi-item billing (Cash, UPI, Credit, Partial payments), manage real-time inventory, automate credit balance calculations, handle product returns with automated balance deductions, and verify customer payments. Concurrently, customers gain access to a dedicated digital ledger portal to view purchases, credit balances, payment history, and make settlements via Cash or online payment gateway integration (Razorpay). Built on modern web architecture with ACID transactional rollbacks and responsive glassmorphism UI, SmartShop provides a comprehensive, secure, and production-ready solution for modern retail shop operations.",
        body_style
    ))
    
    story.append(PageBreak())

    # ================= SECTION 1: INTRODUCTION & PROBLEM STATEMENT =================
    story.append(Paragraph("1. INTRODUCTION & PROBLEM STATEMENT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("1.1 Background", h2_style))
    story.append(Paragraph(
        "Retail stores form the backbone of local neighborhood commerce. In the traditional Indian retail setup, regular customers often purchase daily household items on short-term informal credit ('Udhar' / 'Khata'). While this builds customer loyalty, managing these credit records manually in paper registers leads to disputes, unpaid balances, physical register damage, and zero visibility for customers into their debt timelines.",
        body_style
    ))
    
    story.append(Paragraph("1.2 Problem Statement", h2_style))
    story.append(Paragraph("The existing manual and semi-digital systems face the following critical challenges:", body_style))
    story.append(Paragraph("• <b>Paper-Based Khata Errors:</b> High likelihood of arithmetic mistakes and lost entries in handwritten ledgers.", bullet_style))
    story.append(Paragraph("• <b>Zero Customer Visibility:</b> Customers cannot inspect their itemized receipts, dues, or payment statuses without physically visiting the shop.", bullet_style))
    story.append(Paragraph("• <b>Disconnected Inventory & Billing:</b> Paper billing does not automatically track product stock or prevent overselling.", bullet_style))
    story.append(Paragraph("• <b>Disputed Returns & Payments:</b> Processing full or partial returns requires manual recalculations across multiple accounts.", bullet_style))
    story.append(Paragraph("• <b>No Payment Audit Trail:</b> Lack of verified digital proof for cash or UPI claims made by customers.", bullet_style))

    # ================= SECTION 2: OBJECTIVES & SCOPE =================
    story.append(Paragraph("2. OBJECTIVES & SCOPE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("2.1 Project Objectives", h2_style))
    story.append(Paragraph("• Develop a centralized cloud-based Point of Sale (POS) system for fast multi-mode billing (Cash, UPI, Credit, Partial).", bullet_style))
    story.append(Paragraph("• Digitize the customer credit ledger ('Khata') with automated due dates, trust scores, and borrow limit caps.", bullet_style))
    story.append(Paragraph("• Provide customers with a responsive self-service web portal to inspect purchase history and initiate payments.", bullet_style))
    story.append(Paragraph("• Implement full/partial return workflows that automatically restock inventory and credit/deduct customer debt atomically.", bullet_style))
    story.append(Paragraph("• Enforce database atomicity (ACID rollbacks) and rate-limiting security to eliminate dirty writes and vulnerabilities.", bullet_style))

    story.append(Paragraph("2.2 Scope of the System", h2_style))
    story.append(Paragraph(
        "SmartShop encompasses grocery stores, supermarket retail, general provision stores, and local retail outlets. The system supports multi-role access (SuperAdmin, Admin, Customer), payment verification gateways, product catalog management with Cloudinary image hosting, and real-time audit logging.",
        body_style
    ))

    # ================= SECTION 3: SYSTEM ARCHITECTURE & TECH STACK =================
    story.append(Paragraph("3. SYSTEM ARCHITECTURE & TECHNOLOGY STACK", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    tech_data = [
        [Paragraph("<b>Component</b>", meta_label_style), Paragraph("<b>Technology / Tool</b>", meta_label_style), Paragraph("<b>Purpose & Justification</b>", meta_label_style)],
        [Paragraph("Frontend UI", meta_val_style), Paragraph("React 19, Vite, TailwindCSS", meta_val_style), Paragraph("High performance, modular component architecture, and responsive glassmorphism UI.", meta_val_style)],
        [Paragraph("Admin Portal", meta_val_style), Paragraph("React 19, Lucide Icons, Vite", meta_val_style), Paragraph("Dedicated dashboard for POS billing, returns, customer profiles, and analytics.", meta_val_style)],
        [Paragraph("Backend Server", meta_val_style), Paragraph("Node.js, Express.js (ESM)", meta_val_style), Paragraph("RESTful API architecture, asynchronous non-blocking I/O, middleware pipelines.", meta_val_style)],
        [Paragraph("Database", meta_val_style), Paragraph("MongoDB, Mongoose ORM", meta_val_style), Paragraph("Flexible JSON document store with multi-document ACID transactions and atomic operators.", meta_val_style)],
        [Paragraph("Authentication", meta_val_style), Paragraph("JWT (JSON Web Token), Bcrypt.js", meta_val_style), Paragraph("Stateless token-based authorization with hashed password storage.", meta_val_style)],
        [Paragraph("Media Storage", meta_val_style), Paragraph("Cloudinary CDN & Multer", meta_val_style), Paragraph("Optimized cloud image transformation and storage for product catalog and payment proofs.", meta_val_style)],
        [Paragraph("Payment Gateway", meta_val_style), Paragraph("Razorpay API & Webhooks", meta_val_style), Paragraph("Seamless UPI, Netbanking, and Card payment settlement for customer credit accounts.", meta_val_style)],
    ]
    
    tech_table = Table(tech_data, colWidths=[100, 160, 240])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tech_table)

    story.append(PageBreak())

    # ================= SECTION 4: SYSTEM MODULES =================
    story.append(Paragraph("4. SYSTEM MODULE SPECIFICATIONS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    modules = [
        ("4.1 Authentication & Role-Based Access Control (RBAC)", 
         "Manages secure registration, multi-identifier login (Email/Phone/Username), and password lifecycle. Implements role segregation: SuperAdmin (full platform governance), Admin (POS billing, inventory, ledger access), and Customer (view-only personal transactions & payments). Includes single-use password reset tokens with time-bound invalidation."),
        
        ("4.2 Point of Sale (POS) Billing & Sales Engine", 
         "Allows store clerks to quickly build cart items from catalog products or custom walk-in items. Calculates bill totals and supports flexible settlement: 100% Cash, 100% UPI, 100% Credit (Khata), or Partial Payment (e.g. 50% Cash + 50% Credit). Automatically decrements stock atomically with overselling prevention."),
        
        ("4.3 Digital Credit Ledger ('Khata') Management", 
         "Tracks individual customer borrowings, repayment due dates, extension counters, and calculated Trust Scores. Enforces credit limit ceilings (Max Borrow Limit) before approving new credit sales. Real-time balance recalculation ensures zero discrepancy between sales and repayments."),
        
        ("4.4 Payment Processing & Admin Verification", 
         "Facilitates multi-channel payment reconciliation. Customers can submit Cash receipts or upload UPI screenshots with UTR transaction IDs. Store admins review and approve/reject claims. Also integrates Razorpay for automated instant online clearance."),
        
        ("4.5 Returns & Refund Adjustment Module", 
         "Supports both Full and Partial product returns against historical sales. Automatically restocks returned item quantities in inventory and calculates whether refund amount should reduce outstanding credit ledger balance or be returned to customer."),
        
        ("4.6 Inventory & Catalog Management", 
         "Enables complete CRUD operations on store stock items, category categorization (Grocery, Snacks, Dairy, etc.), unit tracking (kg, pack, piece), low stock indicators, and Cloudinary image asset management."),
        
        ("4.7 Real-Time Activity & Audit Logging", 
         "Maintains an immutable timeline of store operations—tracking which admin created sales, modified prices, approved payments, or edited products for total business transparency.")
    ]
    
    for title, desc in modules:
        story.append(Paragraph(title, h2_style))
        story.append(Paragraph(desc, body_style))

    # ================= SECTION 5: DATABASE DESIGN =================
    story.append(Paragraph("5. DATABASE DESIGN & SCHEMA OVERVIEW", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "The system uses MongoDB with Mongoose ODM structured into 8 primary relational-document collections:",
        body_style
    ))
    
    schemas = [
        ("User Schema", "Stores name, username, email, phone, password hash, role ('customer'|'admin'|'superadmin'), isActive status, and password reset token metadata."),
        ("Customer Schema", "Linked to User document; tracks pendingAmount, totalPurchase, trustScore, manualBorrowLimit, and address."),
        ("Product Schema", "Contains name, category, price, stock, unit, imageUrl, available flag, deleted flag, createdBy, and updatedBy user references."),
        ("Sale Schema", "Captures sale invoice number, customerId, adminId, items array (productId, quantity, price, total), paymentType, paidAmount, pendingAmount, and creditId."),
        ("Credit Schema", "Stores customerId, userId, borrowedAmount, paidAmount, pendingAmount, borrowDate, dueDate, extensionCount, and status ('active'|'paid'|'partially_paid'|'overdue')."),
        ("Payment Schema", "Records creditId, customerId, amount, paymentMethod ('cash'|'upi'|'razorpay'), status ('pending'|'approved'|'rejected'), transactionId, paymentProof URL, and verification stamps."),
        ("Return Schema", "Stores saleId, customerId, returnedItems, returnReason, refundAmount, balanceDeducted, and processedBy admin reference.")
    ]
    
    for name, details in schemas:
        story.append(Paragraph(f"• <b>{name}:</b> {details}", bullet_style))

    story.append(PageBreak())

    # ================= SECTION 6: SYSTEM REQUIREMENTS =================
    story.append(Paragraph("6. SYSTEM REQUIREMENTS SPECIFICATION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    req_data = [
        [Paragraph("<b>Hardware Requirements</b>", meta_label_style), Paragraph("<b>Software Requirements</b>", meta_label_style)],
        [
            Paragraph("• Processor: Dual Core 2.0 GHz or higher<br/>• RAM: 4 GB minimum (8 GB recommended)<br/>• Storage: 500 MB free disk space<br/>• Display: 1024x768 or mobile/tablet screen<br/>• Network: Active Internet connection (Broadband/4G)", meta_val_style),
            Paragraph("• Operating System: Windows 10/11, macOS, Linux<br/>• Runtime Environment: Node.js (v18.x or v20.x)<br/>• Database: MongoDB (Atlas / Local v6.0+)<br/>• Browser: Google Chrome, Firefox, Safari, Edge<br/>• Tools: Visual Studio Code, Git, Postman", meta_val_style)
        ]
    ]
    
    req_table = Table(req_data, colWidths=[250, 250])
    req_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(req_table)
    
    story.append(Spacer(1, 10))

    # ================= SECTION 7: TESTING & SECURITY =================
    story.append(Paragraph("7. TESTING, SECURITY & RELIABILITY MEASURES", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("• <b>ACID Transaction Rollbacks:</b> Multi-document write operations (sales, payments, credit settlements, returns) utilize <code>session.withTransaction</code> with fallback handling, guaranteeing complete rollback upon network or validation failures.", bullet_style))
    story.append(Paragraph("• <b>Atomic Concurrency Control:</b> Inventory stock deduction and customer ledger debt reductions use atomic MongoDB <code>$inc</code> operations with <code>{ stock: { $gte: qty } }</code> queries to eliminate overselling and race conditions.", bullet_style))
    story.append(Paragraph("• <b>Security Headers:</b> Protected with response headers (nosniff, frameguard, XSS protection, strict referrer policy).", bullet_style))
    story.append(Paragraph("• <b>Token Lifecycle:</b> JWT stateless tokens with bcrypt password hashing and single-use password reset tokens.", bullet_style))
    story.append(Paragraph("• <b>Build Verification:</b> Both customer frontend and administrative portal verified with clean production builds (0 errors).", bullet_style))

    # ================= SECTION 8: FUTURE ENHANCEMENTS & CONCLUSION =================
    story.append(Paragraph("8. FUTURE ENHANCEMENTS & CONCLUSION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("8.1 Future Scope", h2_style))
    story.append(Paragraph("• <b>Automated WhatsApp/SMS Reminders:</b> Automated notification bot for upcoming or overdue credit due dates.", bullet_style))
    story.append(Paragraph("• <b>Barcode & Thermal Printer Integration:</b> Direct USB/Bluetooth POS thermal receipt printing and barcode scanning.", bullet_style))
    story.append(Paragraph("• <b>AI-Powered Demand Forecasting:</b> Machine learning models predicting product restock needs based on seasonal trends.", bullet_style))
    story.append(Paragraph("• <b>Offline PWA Mode:</b> Progressive Web App capabilities for offline billing during intermittent network outages.", bullet_style))

    story.append(Paragraph("8.2 Conclusion", h2_style))
    story.append(Paragraph(
        "<b>SmartShop</b> successfully modernizes traditional retail shop operations by bridging the gap between in-store POS billing and customer credit management. By replacing error-prone paper ledgers with an ACID-compliant digital ledger, transparent payment tracking, and responsive user interfaces, the project delivers a scalable, practical, and highly robust platform tailored for contemporary retail businesses.",
        body_style
    ))

    # Build PDF with Page Numbers
    doc.build(story, canvasmaker=NumberedCanvas)
    print("Project Synopsis PDF generated at:", pdf_path)

if __name__ == "__main__":
    create_synopsis()
