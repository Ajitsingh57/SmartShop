import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas

def draw_dfd_level_0(output_image_path):
    fig, ax = plt.subplots(figsize=(14, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    # Background
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    # Color palette - Clean Academic Theme
    c_entity_bg = '#f0f9ff'
    c_entity_border = '#0284c7'
    c_proc_bg = '#eff6ff'
    c_proc_border = '#1d4ed8'
    c_gateway_bg = '#fefce8'
    c_gateway_border = '#ca8a04'
    c_text_dark = '#0f172a'
    
    # -------------------------------------------------------------
    # 1. CENTRAL PROCESS 0.0 (Circle / Large Rounded Box)
    # -------------------------------------------------------------
    proc = patches.FancyBboxPatch(
        (35, 34), 30, 32,
        boxstyle="round,pad=1,rounding_size=4",
        facecolor=c_proc_bg, edgecolor=c_proc_border, linewidth=2.5
    )
    ax.add_patch(proc)
    
    # Process ID & Title
    ax.text(50, 58, "0.0", fontsize=15, fontweight='bold', ha='center', va='center', color='#1e40af')
    ax.plot([38, 62], [54, 54], color='#93c5fd', lw=1.5)
    ax.text(50, 48, "SmartShop System", fontsize=16, fontweight='bold', ha='center', va='center', color=c_text_dark)
    ax.text(50, 41, "(Digital Shop Management &\nCustomer Khata POS)", fontsize=11, ha='center', va='center', color='#475569')

    # -------------------------------------------------------------
    # 2. EXTERNAL ENTITIES
    # -------------------------------------------------------------
    # Admin (Top Left)
    admin_box = patches.Rectangle((3, 62), 22, 22, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2)
    ax.add_patch(admin_box)
    ax.text(14, 77, "EXTERNAL ENTITY", fontsize=8.5, fontweight='bold', ha='center', color='#0284c7')
    ax.text(14, 71, "Store Admin /\nShopkeeper", fontsize=12, fontweight='bold', ha='center', va='center', color=c_text_dark)

    # Customer (Bottom Left)
    cust_box = patches.Rectangle((3, 16), 22, 22, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2)
    ax.add_patch(cust_box)
    ax.text(14, 31, "EXTERNAL ENTITY", fontsize=8.5, fontweight='bold', ha='center', color='#0284c7')
    ax.text(14, 25, "Retail Customer", fontsize=12, fontweight='bold', ha='center', va='center', color=c_text_dark)

    # Razorpay Payment Gateway (Top Right)
    rp_box = patches.Rectangle((75, 62), 22, 22, facecolor=c_gateway_bg, edgecolor=c_gateway_border, linewidth=2)
    ax.add_patch(rp_box)
    ax.text(86, 77, "EXTERNAL GATEWAY", fontsize=8.5, fontweight='bold', ha='center', color='#ca8a04')
    ax.text(86, 71, "Razorpay API\n(Online Payment)", fontsize=12, fontweight='bold', ha='center', va='center', color=c_text_dark)

    # Cloudinary CDN (Bottom Right)
    cld_box = patches.Rectangle((75, 16), 22, 22, facecolor='#faf5ff', edgecolor='#9333ea', linewidth=2)
    ax.add_patch(cld_box)
    ax.text(86, 31, "EXTERNAL STORAGE", fontsize=8.5, fontweight='bold', ha='center', color='#9333ea')
    ax.text(86, 25, "Cloudinary CDN\n(Image Storage)", fontsize=12, fontweight='bold', ha='center', va='center', color=c_text_dark)

    # -------------------------------------------------------------
    # 3. DATA FLOW ARROWS & CLEAN LABELS
    # -------------------------------------------------------------
    # Admin -> System
    ax.annotate("", xy=(35, 56), xytext=(25, 72),
                arrowprops=dict(arrowstyle="-|>", color='#1e293b', lw=1.8, mutation_scale=15))
    ax.text(28, 67, "1. Product details, POS Billing,\n    Payment Approvals, Return items", 
            fontsize=9, fontweight='bold', color='#0f172a', rotation=14, ha='center')

    # System -> Admin
    ax.annotate("", xy=(25, 66), xytext=(35, 50),
                arrowprops=dict(arrowstyle="-|>", color='#1e293b', lw=1.8, mutation_scale=15))
    ax.text(28, 55, "2. Sales Invoices, Khata Reports,\n    Activity Logs, Stock Alerts", 
            fontsize=9, fontweight='bold', color='#0f172a', rotation=14, ha='center')

    # Customer -> System
    ax.annotate("", xy=(35, 44), xytext=(25, 28),
                arrowprops=dict(arrowstyle="-|>", color='#1e293b', lw=1.8, mutation_scale=15))
    ax.text(28, 38, "3. Login credentials, Payment claims\n    (Cash/UPI UTR & Screenshot)", 
            fontsize=9, fontweight='bold', color='#0f172a', rotation=-14, ha='center')

    # System -> Customer
    ax.annotate("", xy=(25, 22), xytext=(35, 38),
                arrowprops=dict(arrowstyle="-|>", color='#1e293b', lw=1.8, mutation_scale=15))
    ax.text(28, 26, "4. Real-time Khata Balance, Bills,\n    Payment Verification Status", 
            fontsize=9, fontweight='bold', color='#0f172a', rotation=-14, ha='center')

    # System -> Razorpay
    ax.annotate("", xy=(75, 72), xytext=(65, 56),
                arrowprops=dict(arrowstyle="-|>", color='#ca8a04', lw=1.8, mutation_scale=15))
    ax.text(72, 67, "5. Order ID & Amount", fontsize=9, fontweight='bold', color='#854d0e', rotation=-14, ha='center')

    # Razorpay -> System
    ax.annotate("", xy=(65, 50), xytext=(75, 66),
                arrowprops=dict(arrowstyle="-|>", color='#ca8a04', lw=1.8, mutation_scale=15))
    ax.text(72, 55, "6. Payment Confirmation & Signature", fontsize=9, fontweight='bold', color='#854d0e', rotation=-14, ha='center')

    # System -> Cloudinary
    ax.annotate("", xy=(75, 28), xytext=(65, 44),
                arrowprops=dict(arrowstyle="-|>", color='#9333ea', lw=1.8, mutation_scale=15))
    ax.text(72, 38, "7. Product Image / Proof Upload", fontsize=9, fontweight='bold', color='#6b21a8', rotation=14, ha='center')

    # Cloudinary -> System
    ax.annotate("", xy=(65, 38), xytext=(75, 22),
                arrowprops=dict(arrowstyle="-|>", color='#9333ea', lw=1.8, mutation_scale=15))
    ax.text(72, 27, "8. Secure Image CDN URLs", fontsize=9, fontweight='bold', color='#6b21a8', rotation=14, ha='center')

    plt.title("SmartShop — DFD Level 0 (Context Level Diagram)", fontsize=16, fontweight='bold', pad=20, color='#1e3a8a')
    plt.tight_layout()
    plt.savefig(output_image_path, bbox_inches='tight', dpi=300)
    plt.close()


def draw_dfd_level_1(output_image_path):
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    # Colors
    c_entity_bg = '#f0f9ff'
    c_entity_border = '#0284c7'
    c_proc_bg = '#eff6ff'
    c_proc_border = '#2563eb'
    c_store_bg = '#f0fdf4'
    c_store_line = '#16a34a'
    c_text_dark = '#0f172a'
    c_flow = '#334155'

    # -------------------------------------------------------------
    # 1. EXTERNAL ENTITIES (LEFT COLUMN)
    # -------------------------------------------------------------
    # Admin
    ax.add_patch(patches.Rectangle((2, 68), 16, 24, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2))
    ax.text(10, 86, "EXTERNAL ENTITY", fontsize=8, fontweight='bold', color='#0284c7', ha='center')
    ax.text(10, 79, "Store Admin /\nShopkeeper", fontsize=12, fontweight='bold', color=c_text_dark, ha='center', va='center')
    ax.text(10, 72, "(POS Billing, Stock,\nApprovals, Returns)", fontsize=8.5, color='#475569', ha='center', va='center')

    # Customer
    ax.add_patch(patches.Rectangle((2, 10), 16, 24, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2))
    ax.text(10, 28, "EXTERNAL ENTITY", fontsize=8, fontweight='bold', color='#0284c7', ha='center')
    ax.text(10, 21, "Retail Customer", fontsize=12, fontweight='bold', color=c_text_dark, ha='center', va='center')
    ax.text(10, 14, "(View Bills, Khata\n& Submit Payments)", fontsize=8.5, color='#475569', ha='center', va='center')

    # -------------------------------------------------------------
    # 2. PROCESSES (MIDDLE 2 COLUMNS)
    # -------------------------------------------------------------
    def make_proc(x, y, w, h, pid, ptitle, psub):
        p = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6,rounding_size=2",
                                   facecolor=c_proc_bg, edgecolor=c_proc_border, linewidth=2)
        ax.add_patch(p)
        ax.text(x + w/2, y + h - 2.2, pid, fontsize=10, fontweight='bold', color='#1d4ed8', ha='center')
        ax.plot([x + 2, x + w - 2], [y + h - 4, y + h - 4], color='#bfdbfe', lw=1.2)
        ax.text(x + w/2, y + h/2 - 0.5, ptitle, fontsize=10.5, fontweight='bold', color=c_text_dark, ha='center', va='center')
        ax.text(x + w/2, y + 2.2, psub, fontsize=8, color='#64748b', ha='center')

    # Column 1 Processes (X: 24 to 46)
    make_proc(24, 72, 22, 18, "1.0", "User Authentication\n& Profile Management", "Login, Token, Password Reset")
    make_proc(24, 40, 22, 18, "2.0", "Product & Inventory\nManagement", "Catalog CRUD & Stock Control")
    make_proc(24, 8,  22, 18, "3.0", "POS Sales & Counter\nBilling Engine", "Cash/UPI/Credit/Partial POS")

    # Column 2 Processes (X: 52 to 74)
    make_proc(52, 72, 22, 18, "4.0", "Digital Khata / Credit\nLedger Management", "Due Dates, Dues & Borrow Limits")
    make_proc(52, 40, 22, 18, "5.0", "Payment Claims &\nVerification Engine", "Cash, UPI & Razorpay Settlement")
    make_proc(52, 8,  22, 18, "6.0", "Returns & Ledger\nAdjustment Engine", "Item Restock & Debt Offset")

    # -------------------------------------------------------------
    # 3. DATA STORES (RIGHT COLUMN: X: 80 to 98)
    # -------------------------------------------------------------
    def make_store(y, sid, sname):
        # Open parallel lines
        ax.plot([80, 98], [y + 8, y + 8], color=c_store_line, linewidth=2.2)
        ax.plot([80, 98], [y, y], color=c_store_line, linewidth=2.2)
        bg = patches.Rectangle((80, y), 18, 8, facecolor=c_store_bg, edgecolor='none')
        ax.add_patch(bg)
        ax.text(83, y + 4, sid, fontsize=10, fontweight='bold', color='#15803d', va='center')
        ax.text(89, y + 4, sname, fontsize=9.5, fontweight='bold', color=c_text_dark, va='center')

    make_store(84, "D1", "Users Collection")
    make_store(71, "D2", "Customers Collection")
    make_store(58, "D3", "Products Collection")
    make_store(45, "D4", "Sales Collection")
    make_store(32, "D5", "Credits (Khata) Collection")
    make_store(19, "D6", "Payments Collection")
    make_store(6,  "D7", "Returns Collection")

    # -------------------------------------------------------------
    # 4. CONNECTIONS & FLOW ANNOTATIONS (Clean & Non-overlapping)
    # -------------------------------------------------------------
    # Admin -> 1.0 (Login), 2.0 (Products), 3.0 (Sales), 5.0 (Approve Payments), 6.0 (Returns)
    ax.annotate("", xy=(24, 81), xytext=(18, 81), arrowprops=dict(arrowstyle="-|>", color=c_flow, lw=1.5, mutation_scale=12))
    ax.text(21, 82.5, "Login", fontsize=7.5, fontweight='bold', ha='center')

    ax.annotate("", xy=(24, 52), xytext=(18, 77), arrowprops=dict(arrowstyle="-|>", color=c_flow, lw=1.5, mutation_scale=12))
    ax.text(19.5, 62, "Stock CRUD", fontsize=7.5, fontweight='bold', ha='center', rotation=45)

    ax.annotate("", xy=(24, 20), xytext=(18, 72), arrowprops=dict(arrowstyle="-|>", color=c_flow, lw=1.5, mutation_scale=12))
    ax.text(18.5, 42, "POS Bill items", fontsize=7.5, fontweight='bold', ha='center', rotation=70)

    # Customer -> 1.0 (Auth), 5.0 (Payment Claim)
    ax.annotate("", xy=(24, 76), xytext=(18, 28), arrowprops=dict(arrowstyle="-|>", color=c_flow, lw=1.5, mutation_scale=12))
    ax.text(19, 56, "Auth / Reg", fontsize=7.5, fontweight='bold', ha='center', rotation=-65)

    ax.annotate("", xy=(52, 46), xytext=(18, 20), arrowprops=dict(arrowstyle="-|>", color=c_flow, lw=1.5, mutation_scale=12))
    ax.text(32, 28, "Submit Payment Claim", fontsize=7.5, fontweight='bold', ha='center', rotation=22)

    # Process 1.0 <-> D1, D2
    ax.annotate("", xy=(80, 87), xytext=(46, 84), arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(63, 87, "User credentials / tokens", fontsize=7.5, fontweight='bold', color='#1e40af', ha='center')

    # Process 2.0 <-> D3
    ax.annotate("", xy=(80, 62), xytext=(46, 50), arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(63, 58, "Product info & Stock levels", fontsize=7.5, fontweight='bold', color='#1e40af', ha='center')

    # Process 3.0 -> D3 (Stock dec), D4 (Sale record), 4.0 (If credit sale)
    ax.annotate("", xy=(80, 49), xytext=(46, 17), arrowprops=dict(arrowstyle="-|>", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(66, 36, "Save Sale invoice to D4", fontsize=7.5, fontweight='bold', color='#1e40af', ha='center')

    ax.annotate("", xy=(52, 78), xytext=(35, 26), arrowprops=dict(arrowstyle="-|>", color='#b45309', lw=1.5, mutation_scale=12))
    ax.text(41, 48, "Credit Sale trigger ->", fontsize=7.5, fontweight='bold', color='#b45309', ha='center', rotation=70)

    # Process 4.0 <-> D2, D5
    ax.annotate("", xy=(80, 75), xytext=(74, 81), arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(77, 80, "Customer debt", fontsize=7, fontweight='bold', color='#1e40af', ha='center')

    ax.annotate("", xy=(80, 36), xytext=(74, 76), arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(78, 52, "Credit record", fontsize=7, fontweight='bold', color='#1e40af', ha='center')

    # Process 5.0 <-> D5, D6, D2
    ax.annotate("", xy=(80, 23), xytext=(74, 49), arrowprops=dict(arrowstyle="<->", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(77, 33, "Payment proof", fontsize=7, fontweight='bold', color='#1e40af', ha='center')

    # Process 6.0 <-> D3, D4, D5, D7
    ax.annotate("", xy=(80, 10), xytext=(74, 17), arrowprops=dict(arrowstyle="-|>", color='#2563eb', lw=1.5, mutation_scale=12))
    ax.text(77, 12, "Return record", fontsize=7, fontweight='bold', color='#1e40af', ha='center')

    plt.title("SmartShop — DFD Level 1 (Detailed Functional Decomposition)", fontsize=16, fontweight='bold', pad=20, color='#1e3a8a')
    plt.tight_layout()
    plt.savefig(output_image_path, bbox_inches='tight', dpi=300)
    plt.close()


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
            return  # Skip cover
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header
        self.drawString(45, 11 * inch - 36, "SmartShop — MCA 3rd Semester Mini Project (DFD Specification)")
        self.drawRightString(8.5 * inch - 45, 11 * inch - 36, "Academic Session 2025-2026")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(45, 11 * inch - 42, 8.5 * inch - 45, 11 * inch - 42)
        
        # Footer
        self.line(45, 45, 8.5 * inch - 45, 45)
        self.drawString(45, 32, "Data Flow Diagrams (Level 0 Context & Level 1 Decomposition)")
        self.drawRightString(8.5 * inch - 45, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def create_dfd_pdf():
    os.makedirs("d:/SmartShop/docs", exist_ok=True)
    dfd0_img = "d:/SmartShop/docs/dfd_level_0.png"
    dfd1_img = "d:/SmartShop/docs/dfd_level_1.png"
    pdf_path = "d:/SmartShop/docs/SmartShop_DFD_Level_0_and_Level_1.pdf"
    
    # Generate high-resolution DFD images
    draw_dfd_level_0(dfd0_img)
    draw_dfd_level_1(dfd1_img)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#1e3a8a")
    accent_color = colors.HexColor("#0284c7")
    text_dark = colors.HexColor("#0f172a")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=26,
        alignment=TA_CENTER,
        textColor=primary_color
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        alignment=TA_CENTER,
        textColor=accent_color
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=accent_color,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_JUSTIFY,
        textColor=text_dark,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=TA_LEFT,
        textColor=text_dark,
        leftIndent=12,
        spaceAfter=2
    )

    story = []

    # ================= COVER / INTRO PAGE =================
    story.append(Spacer(1, 10))
    story.append(Paragraph("MCA 3RD SEMESTER MINI PROJECT", ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor("#64748b"), spaceAfter=5)))
    story.append(Paragraph("DATA FLOW DIAGRAMS (DFD) SPECIFICATION", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("SMARTSHOP — Digital Shop Management, POS & Khata Ledger System", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=6, spaceAfter=12))

    story.append(Paragraph("1. DFD NOTATION STANDARD (Yourdon & DeMarco / Gane & Sarson)", h1_style))
    story.append(Paragraph("A Data Flow Diagram (DFD) graphically illustrates how information flows through the system, how processes transform inputs into outputs, and where data is persistently stored in the database.", body_style))
    
    symbols_data = [
        [Paragraph("<b>Notation Symbol</b>", h2_style), Paragraph("<b>DFD Element</b>", h2_style), Paragraph("<b>SmartShop System Mapping</b>", h2_style)],
        [Paragraph("Square / Rectangle", body_style), Paragraph("External Entity", body_style), Paragraph("Actors outside software boundary: <b>Store Admin, Retail Customer, Razorpay API, Cloudinary CDN</b>", body_style)],
        [Paragraph("Rounded Rectangle", body_style), Paragraph("Process / Function", body_style), Paragraph("Core system logic: <b>0.0 (SmartShop), 1.0 (Auth), 2.0 (Stock), 3.0 (POS), 4.0 (Khata), 5.0 (Payments), 6.0 (Returns)</b>", body_style)],
        [Paragraph("Open Parallel Lines", body_style), Paragraph("Data Store", body_style), Paragraph("MongoDB Collections: <b>D1 (Users), D2 (Customers), D3 (Products), D4 (Sales), D5 (Credits), D6 (Payments), D7 (Returns)</b>", body_style)],
        [Paragraph("Directed Arrow", body_style), Paragraph("Data Flow", body_style), Paragraph("Input/Output data paths (credentials, invoices, ledger dues, payment proofs, refund status)", body_style)],
    ]
    
    sym_table = Table(symbols_data, colWidths=[110, 110, 300])
    sym_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(sym_table)
    story.append(Spacer(1, 8))

    # ================= DFD LEVEL 0 PAGE =================
    story.append(PageBreak())
    story.append(Paragraph("2. DFD LEVEL 0 — CONTEXT LEVEL DIAGRAM", h1_style))
    story.append(Paragraph("The Level 0 context diagram defines the boundary of the SmartShop system, showing all external actors and their interactions with the central system process.", body_style))
    story.append(Spacer(1, 4))
    
    story.append(Image(dfd0_img, width=6.9*inch, height=4.15*inch))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Detailed Data Inflows & Outflows:</b>", h2_style))
    story.append(Paragraph("• <b>Store Admin -> System:</b> Product catalog entries, counter sales items, payment approval/rejection actions, return orders, customer borrow limit updates.", bullet_style))
    story.append(Paragraph("• <b>System -> Store Admin:</b> Real-time sales receipts, customer khata ledger reports, activity logs, low stock indicators.", bullet_style))
    story.append(Paragraph("• <b>Customer -> System:</b> Login credentials, cash claim submissions, UPI transaction IDs and receipt screenshot proofs, online payment tokens.", bullet_style))
    story.append(Paragraph("• <b>System -> Customer:</b> Itemized purchase invoices, real-time pending khata balance, payment clearance status.", bullet_style))
    story.append(Paragraph("• <b>System <-> Razorpay & Cloudinary:</b> Razorpay checkout order verification; Cloudinary CDN image streaming & secure URLs.", bullet_style))

    # ================= DFD LEVEL 1 PAGE =================
    story.append(PageBreak())
    story.append(Paragraph("3. DFD LEVEL 1 — DETAILED FUNCTIONAL DECOMPOSITION", h1_style))
    story.append(Paragraph("The Level 1 diagram decomposes the system into <b>6 core processes</b> and maps their direct interactions with the <b>7 MongoDB collections (D1 to D7)</b>.", body_style))
    story.append(Spacer(1, 4))

    story.append(Image(dfd1_img, width=7.0*inch, height=4.6*inch))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Process Explanations & Database Interactions:</b>", h2_style))
    story.append(Paragraph("• <b>1.0 User Authentication & Profile:</b> Handles login and role-based access. Reads/writes <b>D1 (Users)</b> and links customer profiles in <b>D2 (Customers)</b>.", bullet_style))
    story.append(Paragraph("• <b>2.0 Product & Inventory Management:</b> Manages product catalog, prices, units, and Cloudinary CDN URLs in <b>D3 (Products)</b>.", bullet_style))
    story.append(Paragraph("• <b>3.0 POS Sales & Counter Billing:</b> Builds counter bills, performs atomic stock deduction in <b>D3 (Products)</b>, saves sales in <b>D4 (Sales)</b>, and triggers credit creation in Process 4.0 if sale is on credit.", bullet_style))
    story.append(Paragraph("• <b>4.0 Digital Khata / Credit Ledger:</b> Tracks borrowed amounts, repayment deadlines, borrow limit validation, and updates debt in <b>D2 (Customers)</b> and <b>D5 (Credits)</b>.", bullet_style))
    story.append(Paragraph("• <b>5.0 Payment Claims & Verification:</b> Saves payment claims in <b>D6 (Payments)</b> and decrements customer pending dues atomically in <b>D5 (Credits)</b> and <b>D2 (Customers)</b> upon admin approval or Razorpay confirmation.", bullet_style))
    story.append(Paragraph("• <b>6.0 Returns & Ledger Adjustment:</b> Restores item quantities in <b>D3 (Products)</b>, saves return records in <b>D7 (Returns)</b>, and deducts outstanding credit debt in <b>D5 (Credits)</b>.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("DFD Level 0 & Level 1 PDF generated successfully at:", pdf_path)


if __name__ == "__main__":
    create_dfd_pdf()
