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
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas

def draw_dfd_level_0(output_image_path):
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    # Colors
    c_entity_bg = '#e0f2fe'
    c_entity_border = '#0284c7'
    c_proc_bg = '#dbeafe'
    c_proc_border = '#1e40af'
    c_arrow = '#334155'
    
    # Central Process 0.0
    proc = patches.FancyBboxPatch((36, 38), 28, 24, boxstyle="round,pad=1.5,rounding_size=3", 
                                  facecolor=c_proc_bg, edgecolor=c_proc_border, linewidth=2.5)
    ax.add_patch(proc)
    ax.text(50, 54, "0.0", fontsize=13, fontweight='bold', ha='center', va='center', color='#1e3a8a')
    ax.text(50, 48, "SmartShop", fontsize=15, fontweight='bold', ha='center', va='center', color='#0f172a')
    ax.text(50, 42, "Digital Shop & POS Management System", fontsize=10, ha='center', va='center', color='#475569')

    # Entity 1: Store Admin (Left Top)
    admin_box = patches.Rectangle((4, 62), 22, 18, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2)
    ax.add_patch(admin_box)
    ax.text(15, 73, "EXTERNAL ENTITY", fontsize=8, fontweight='bold', ha='center', color='#0369a1')
    ax.text(15, 68, "Store Admin / SuperAdmin", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

    # Entity 2: Customer (Left Bottom)
    cust_box = patches.Rectangle((4, 20), 22, 18, facecolor=c_entity_bg, edgecolor=c_entity_border, linewidth=2)
    ax.add_patch(cust_box)
    ax.text(15, 31, "EXTERNAL ENTITY", fontsize=8, fontweight='bold', ha='center', color='#0369a1')
    ax.text(15, 26, "Retail Customer", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

    # Entity 3: Razorpay Payment Gateway (Right Top)
    rp_box = patches.Rectangle((74, 62), 22, 18, facecolor='#fef3c7', edgecolor='#d97706', linewidth=2)
    ax.add_patch(rp_box)
    ax.text(85, 73, "EXTERNAL SERVICE", fontsize=8, fontweight='bold', ha='center', color='#b45309')
    ax.text(85, 68, "Razorpay Gateway", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

    # Entity 4: Cloudinary Media CDN (Right Bottom)
    cld_box = patches.Rectangle((74, 20), 22, 18, facecolor='#f3e8ff', edgecolor='#9333ea', linewidth=2)
    ax.add_patch(cld_box)
    ax.text(85, 31, "EXTERNAL SERVICE", fontsize=8, fontweight='bold', ha='center', color='#7e22ce')
    ax.text(85, 26, "Cloudinary CDN", fontsize=11, fontweight='bold', ha='center', color='#0f172a')

    # Arrows: Admin -> System
    ax.annotate("Products, POS Sales,\nPayment Approvals, Returns", xy=(36, 56), xytext=(26, 68),
                arrowprops=dict(arrowstyle="->", color=c_arrow, lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#1e293b', fontweight='semibold', ha='right')

    # Arrows: System -> Admin
    ax.annotate("Sales Bills, Credit Ledger Alerts,\nActivity Audit Logs", xy=(26, 64), xytext=(36, 52),
                arrowprops=dict(arrowstyle="->", color=c_arrow, lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#1e293b', fontweight='semibold', ha='left')

    # Arrows: Customer -> System
    ax.annotate("Auth, Payment Claims (Cash/UPI),\nCredit Inquiry", xy=(36, 44), xytext=(26, 32),
                arrowprops=dict(arrowstyle="->", color=c_arrow, lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#1e293b', fontweight='semibold', ha='right')

    # Arrows: System -> Customer
    ax.annotate("Ledger Balance, Bills,\nVerification Status", xy=(26, 28), xytext=(36, 40),
                arrowprops=dict(arrowstyle="->", color=c_arrow, lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#1e293b', fontweight='semibold', ha='left')

    # Arrows: System <-> Razorpay
    ax.annotate("Order Creation & Amount", xy=(74, 73), xytext=(64, 57),
                arrowprops=dict(arrowstyle="->", color='#b45309', lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#78350f', fontweight='semibold', ha='right')
    ax.annotate("Captured Signature & Confirmation", xy=(64, 53), xytext=(74, 65),
                arrowprops=dict(arrowstyle="->", color='#b45309', lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#78350f', fontweight='semibold', ha='left')

    # Arrows: System <-> Cloudinary
    ax.annotate("Product & Proof Upload Stream", xy=(74, 30), xytext=(64, 44),
                arrowprops=dict(arrowstyle="->", color='#7e22ce', lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#581c87', fontweight='semibold', ha='right')
    ax.annotate("Optimized Secure Image URLs", xy=(64, 40), xytext=(74, 25),
                arrowprops=dict(arrowstyle="->", color='#7e22ce', lw=1.5, shrinkA=5, shrinkB=5),
                fontsize=8.5, color='#581c87', fontweight='semibold', ha='left')

    plt.title("SmartShop — DFD Level 0 (Context Diagram)", fontsize=15, fontweight='bold', pad=15, color='#1e3a8a')
    plt.tight_layout()
    plt.savefig(output_image_path, bbox_inches='tight', dpi=300)
    plt.close()


def draw_dfd_level_1(output_image_path):
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    # Process box helper
    def draw_proc(x, y, w, h, pid, name):
        p = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.8,rounding_size=2",
                                   facecolor='#eff6ff', edgecolor='#2563eb', linewidth=1.8)
        ax.add_patch(p)
        ax.text(x + w/2, y + h - 2.5, pid, fontsize=9, fontweight='bold', color='#1e40af', ha='center')
        ax.text(x + w/2, y + h/2 - 1, name, fontsize=10, fontweight='bold', color='#0f172a', ha='center', va='center')

    # Store helper (parallel lines)
    def draw_store(x, y, w, h, sid, sname):
        # Top line
        ax.plot([x, x + w], [y + h, y + h], color='#047857', linewidth=2)
        # Bottom line
        ax.plot([x, x + w], [y, y], color='#047857', linewidth=2)
        # Fill background
        store_rect = patches.Rectangle((x, y), w, h, facecolor='#ecfdf5', edgecolor='none')
        ax.add_patch(store_rect)
        ax.text(x + 3, y + h/2, sid, fontsize=8.5, fontweight='bold', color='#065f46', va='center')
        ax.text(x + 10, y + h/2, sname, fontsize=9, fontweight='bold', color='#0f172a', va='center')

    # External Entities
    # Admin
    ax.add_patch(patches.Rectangle((3, 75), 16, 18, facecolor='#e0f2fe', edgecolor='#0284c7', linewidth=2))
    ax.text(11, 86, "ENTITY", fontsize=7.5, fontweight='bold', color='#0369a1', ha='center')
    ax.text(11, 81, "Store Admin", fontsize=10, fontweight='bold', color='#0f172a', ha='center')

    # Customer
    ax.add_patch(patches.Rectangle((3, 10), 16, 18, facecolor='#e0f2fe', edgecolor='#0284c7', linewidth=2))
    ax.text(11, 21, "ENTITY", fontsize=7.5, fontweight='bold', color='#0369a1', ha='center')
    ax.text(11, 16, "Customer", fontsize=10, fontweight='bold', color='#0f172a', ha='center')

    # 6 Processes
    draw_proc(26, 76, 21, 15, "1.0", "Auth & RBAC\nManagement")
    draw_proc(26, 45, 21, 15, "2.0", "Inventory &\nProducts")
    draw_proc(26, 14, 21, 15, "3.0", "POS Sales &\nBilling Engine")

    draw_proc(55, 76, 21, 15, "4.0", "Credit Ledger\n(Khata) Engine")
    draw_proc(55, 45, 21, 15, "5.0", "Payment Claims\n& Verification")
    draw_proc(55, 14, 21, 15, "6.0", "Returns & Refund\nAdjustment")

    # Data Stores on Right
    draw_store(80, 84, 18, 7, "D1", "Users")
    draw_store(80, 71, 18, 7, "D2", "Customers")
    draw_store(80, 58, 18, 7, "D3", "Products")
    draw_store(80, 45, 18, 7, "D4", "Sales")
    draw_store(80, 32, 18, 7, "D5", "Credits (Khata)")
    draw_store(80, 19, 18, 7, "D6", "Payments")
    draw_store(80, 6,  18, 7, "D7", "Returns")

    # Connections / Data Flows
    c_flow = '#334155'
    
    # Admin -> 1.0, 2.0, 3.0, 5.0, 6.0
    ax.annotate("", xy=(26, 84), xytext=(19, 84), arrowprops=dict(arrowstyle="->", color=c_flow, lw=1.2))
    ax.annotate("", xy=(26, 55), xytext=(19, 80), arrowprops=dict(arrowstyle="->", color=c_flow, lw=1.2))
    ax.annotate("", xy=(26, 24), xytext=(19, 78), arrowprops=dict(arrowstyle="->", color=c_flow, lw=1.2))

    # Customer -> 1.0, 5.0
    ax.annotate("", xy=(26, 80), xytext=(19, 22), arrowprops=dict(arrowstyle="->", color=c_flow, lw=1.2))
    ax.annotate("", xy=(55, 50), xytext=(19, 18), arrowprops=dict(arrowstyle="->", color=c_flow, lw=1.2))

    # 1.0 <-> D1, D2
    ax.annotate("", xy=(80, 87), xytext=(47, 85), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))
    ax.annotate("", xy=(80, 74), xytext=(47, 81), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))

    # 2.0 <-> D3
    ax.annotate("", xy=(80, 61), xytext=(47, 52), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))

    # 3.0 -> D3 (stock ded), D4 (sale), D5 (credit), 4.0
    ax.annotate("", xy=(80, 48), xytext=(47, 24), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.2))
    ax.annotate("", xy=(55, 80), xytext=(37, 29), arrowprops=dict(arrowstyle="->", color='#b45309', lw=1.2))

    # 4.0 <-> D2, D5
    ax.annotate("", xy=(80, 73), xytext=(76, 83), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))
    ax.annotate("", xy=(80, 36), xytext=(76, 78), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))

    # 5.0 <-> D5, D6, D2
    ax.annotate("", xy=(80, 23), xytext=(76, 52), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))
    ax.annotate("", xy=(80, 34), xytext=(76, 55), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))

    # 6.0 <-> D3, D4, D5, D7
    ax.annotate("", xy=(80, 10), xytext=(76, 21), arrowprops=dict(arrowstyle="<->", color='#0284c7', lw=1.2))
    ax.annotate("", xy=(80, 59), xytext=(65, 29), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.2))

    plt.title("SmartShop — DFD Level 1 (Functional Decomposition Diagram)", fontsize=15, fontweight='bold', pad=15, color='#1e3a8a')
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
        self.drawString(54, 11 * inch - 36, "SmartShop — Data Flow Diagrams (DFD Documentation)")
        self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Academic Year 2025-2026")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        self.line(54, 48, 8.5 * inch - 54, 48)
        self.drawString(54, 34, "Level 0 (Context) & Level 1 (Functional Decomposition)")
        self.drawRightString(8.5 * inch - 54, 34, f"Page {self._pageNumber} of {page_count}")
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
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=primary_color
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        alignment=TA_CENTER,
        textColor=accent_color
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_color,
        spaceBefore=8,
        spaceAfter=3,
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
        spaceAfter=5
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
    story.append(Spacer(1, 15))
    story.append(Paragraph("DATA FLOW DIAGRAMS (DFD) SPECIFICATION", ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, alignment=TA_CENTER, textColor=colors.HexColor("#64748b"), spaceAfter=6)))
    story.append(Paragraph("SMARTSHOP", title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Level 0 (Context Diagram) and Level 1 (Functional Decomposition)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=6, spaceAfter=15))

    story.append(Paragraph("1. DFD NOTATION STANDARD (Yourdon & DeMarco / Gane & Sarson)", h1_style))
    story.append(Paragraph("A Data Flow Diagram (DFD) models the graphical transformation of data through an information system. The SmartShop DFD adheres to academic engineering standards utilizing four primary symbols:", body_style))
    
    symbols_data = [
        [Paragraph("<b>Symbol</b>", h2_style), Paragraph("<b>Notation Element</b>", h2_style), Paragraph("<b>Representation in SmartShop</b>", h2_style)],
        [Paragraph("Rectangle", body_style), Paragraph("External Entity", body_style), Paragraph("Actors outside system boundary: <b>Store Admin, Retail Customer, Razorpay, Cloudinary</b>", body_style)],
        [Paragraph("Rounded Box / Circle", body_style), Paragraph("Process / Function", body_style), Paragraph("Transformational operations: <b>0.0 (System), 1.0 (Auth), 3.0 (POS Sales), 4.0 (Khata), etc.</b>", body_style)],
        [Paragraph("Open Parallel Lines", body_style), Paragraph("Data Store", body_style), Paragraph("Persistent MongoDB collections: <b>D1 (Users) through D7 (Returns)</b>", body_style)],
        [Paragraph("Directed Arrow", body_style), Paragraph("Data Flow", body_style), Paragraph("Flow of inputs, outputs, credentials, invoice data, and receipts", body_style)],
    ]
    
    sym_table = Table(symbols_data, colWidths=[110, 120, 290])
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
    story.append(Spacer(1, 10))

    # ================= DFD LEVEL 0 PAGE =================
    story.append(PageBreak())
    story.append(Paragraph("2. DFD LEVEL 0 — CONTEXT LEVEL DIAGRAM", h1_style))
    story.append(Paragraph("The Level 0 context diagram defines the boundary of the SmartShop system, showing external actors and major data flows interacting with the single top-level process <b>0.0 SmartShop System</b>.", body_style))
    story.append(Spacer(1, 5))
    
    story.append(Image(dfd0_img, width=6.8*inch, height=4.25*inch))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Detailed Data Inflows & Outflows:</b>", h2_style))
    story.append(Paragraph("• <b>Store Admin -> System:</b> Product catalog details, POS cart items, payment claim approval/rejections, return orders, customer borrow limits.", bullet_style))
    story.append(Paragraph("• <b>System -> Store Admin:</b> Real-time sales invoices, pending credit balance reports, activity audit trail, low-stock alerts.", bullet_style))
    story.append(Paragraph("• <b>Customer -> System:</b> Registration/login credentials, cash payment claims, UPI transaction IDs and screenshot proofs, online payment tokens.", bullet_style))
    story.append(Paragraph("• <b>System -> Customer:</b> Itemized purchase receipts, live Khata debt balance, payment verification receipts.", bullet_style))
    story.append(Paragraph("• <b>System <-> Razorpay / Cloudinary:</b> Online checkout order IDs & captured signature verification; Cloudinary CDN media upload streams & secure image asset URLs.", bullet_style))

    # ================= DFD LEVEL 1 PAGE =================
    story.append(PageBreak())
    story.append(Paragraph("3. DFD LEVEL 1 — FUNCTIONAL DECOMPOSITION DIAGRAM", h1_style))
    story.append(Paragraph("The Level 1 DFD decomposes the central system process into <b>6 core functional sub-processes</b> and maps their read/write interactions with <b>7 persistent database collections (D1–D7)</b>.", body_style))
    story.append(Spacer(1, 5))

    story.append(Image(dfd1_img, width=7.0*inch, height=4.6*inch))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Process Decomposition & Data Store Mapping:</b>", h2_style))
    story.append(Paragraph("• <b>1.0 User Authentication & RBAC:</b> Authenticates customers and admins. Reads/writes <b>D1 (Users)</b> and <b>D2 (Customers)</b>.", bullet_style))
    story.append(Paragraph("• <b>2.0 Product & Inventory Management:</b> Manages product CRUD, prices, units, and Cloudinary image assets in <b>D3 (Products)</b>.", bullet_style))
    story.append(Paragraph("• <b>3.0 POS Sales & Billing Engine:</b> Processes counter bills. Deducts stock in <b>D3</b>, creates invoices in <b>D4 (Sales)</b>, and triggers credit creation in <b>4.0</b>.", bullet_style))
    story.append(Paragraph("• <b>4.0 Credit / Digital Khata Engine:</b> Calculates trust scores, evaluates borrow limits, and updates debt records in <b>D2 (Customers)</b> and <b>D5 (Credits)</b>.", bullet_style))
    story.append(Paragraph("• <b>5.0 Payment Reconciliation:</b> Records cash/UPI/Razorpay claims in <b>D6 (Payments)</b> and decrements customer pending dues atomically in <b>D5</b> and <b>D2</b>.", bullet_style))
    story.append(Paragraph("• <b>6.0 Returns & Refund Engine:</b> Restores product quantities in <b>D3 (Products)</b>, records return slips in <b>D7 (Returns)</b>, and offsets outstanding debt in <b>D5 (Credits)</b>.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("DFD Level 0 & Level 1 PDF generated at:", pdf_path)


if __name__ == "__main__":
    create_dfd_pdf()
