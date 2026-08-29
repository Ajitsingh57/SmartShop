import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas

def roman_numeral(num):
    val = [
        1000, 900, 500, 400,
        100, 90, 50, 40,
        10, 9, 5, 4,
        1
    ]
    syb = [
        "m", "cm", "d", "cd",
        "c", "xc", "l", "xl",
        "x", "ix", "v", "iv",
        "i"
    ]
    roman_num = ''
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

class MCASynopsisCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(MCASynopsisCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        # Introduction starts on page 9 (index 8) in our layout
        # Preliminary pages are pages 2 to 8 (7 pages) -> i, ii, iii, iv, v, vi, vii
        for page_idx, state in enumerate(self._saved_page_states):
            self.__dict__.update(state)
            page_num = page_idx + 1
            
            if page_num == 1:
                # Cover Page: No page number, no header/footer
                pass
            elif 2 <= page_num <= 8:
                # Preliminary Pages: Roman numerals (i to vii)
                self.saveState()
                self.setFont("Times-Roman", 10)
                roman_str = roman_numeral(page_num - 1)
                self.drawRightString(A4[0] - 72, 45, roman_str)
                self.restoreState()
            else:
                # Main Content: Arabic numerals (1, 2, 3...)
                arabic_page = page_num - 8
                self.saveState()
                self.setFont("Times-Roman", 10)
                
                # Header
                self.drawString(90, A4[1] - 45, "SmartShop — MCA 3rd Semester Project Synopsis")
                self.drawRightString(A4[0] - 72, A4[1] - 45, "Session 2026–2027")
                self.setLineWidth(0.5)
                self.setStrokeColor(colors.HexColor("#94a3b8"))
                self.line(90, A4[1] - 50, A4[0] - 72, A4[1] - 50)
                
                # Footer
                self.line(90, 55, A4[0] - 72, 55)
                self.drawString(90, 42, "Department of Computer Applications")
                self.drawRightString(A4[0] - 72, 42, str(arabic_page))
                self.restoreState()
                
            super(MCASynopsisCanvas, self).showPage()
        super(MCASynopsisCanvas, self).save()

def generate_synopsis():
    os.makedirs("d:/SmartShop/docs", exist_ok=True)
    pdf_path = "d:/SmartShop/docs/SmartShop_Project_Synopsis.pdf"
    
    # Ensure diagrams are available
    arch_img = "d:/SmartShop/docs/system_architecture.png"
    uc_img = "d:/SmartShop/docs/use_case_diagram.png"
    dfd0_img = "d:/SmartShop/docs/dfd_level_0.png"
    dfd1_img = "d:/SmartShop/docs/dfd_level_1.png"
    er_img = "d:/SmartShop/docs/er_diagram.png"

    # Strict Margins from Guideline: Left = 1.25 in (90pt), Right = 1.0 in (72pt), Top = 1.0 in (72pt), Bottom = 1.0 in (72pt)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=90,
        rightMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # Times New Roman based styling matching exact guidelines
    t_bold = "Times-Bold"
    t_norm = "Times-Roman"
    t_italic = "Times-Italic"

    cover_college = ParagraphStyle('CoverCollege', fontName=t_bold, fontSize=16, leading=22, alignment=TA_CENTER, textColor=colors.black)
    cover_title = ParagraphStyle('CoverTitle', fontName=t_bold, fontSize=19, leading=25, alignment=TA_CENTER, textColor=colors.HexColor("#0f172a"))
    cover_sub = ParagraphStyle('CoverSub', fontName=t_bold, fontSize=14, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#1e3a8a"))
    cover_norm = ParagraphStyle('CoverNorm', fontName=t_norm, fontSize=12, leading=16, alignment=TA_CENTER, textColor=colors.black)
    cover_bold = ParagraphStyle('CoverBold', fontName=t_bold, fontSize=12, leading=16, alignment=TA_CENTER, textColor=colors.black)

    h1_style = ParagraphStyle('MainHeading', fontName=t_bold, fontSize=16, leading=20, alignment=TA_LEFT, textColor=colors.black, spaceBefore=14, spaceAfter=6, keepWithNext=True)
    h2_style = ParagraphStyle('SubHeading', fontName=t_bold, fontSize=14, leading=18, alignment=TA_LEFT, textColor=colors.HexColor("#1e3a8a"), spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h3_style = ParagraphStyle('SubSubHeading', fontName=t_bold, fontSize=12, leading=16, alignment=TA_LEFT, textColor=colors.black, spaceBefore=8, spaceAfter=3, keepWithNext=True)

    body_style = ParagraphStyle('BodyText', fontName=t_norm, fontSize=12, leading=17, alignment=TA_JUSTIFY, textColor=colors.black, spaceAfter=6, spaceBefore=0)
    bullet_style = ParagraphStyle('BulletText', fontName=t_norm, fontSize=12, leading=17, alignment=TA_LEFT, textColor=colors.black, leftIndent=18, spaceAfter=3)
    
    fr_code_style = ParagraphStyle('FRCode', fontName=t_bold, fontSize=12, leading=16, textColor=colors.HexColor("#1e3a8a"), spaceBefore=6, spaceAfter=2, keepWithNext=True)
    fr_desc_style = ParagraphStyle('FRDesc', fontName=t_norm, fontSize=12, leading=16, alignment=TA_JUSTIFY, textColor=colors.black, leftIndent=12, spaceAfter=6)

    caption_style = ParagraphStyle('FigCaption', fontName=t_bold, fontSize=11, leading=14, alignment=TA_CENTER, textColor=colors.HexColor("#1e293b"), spaceBefore=6, spaceAfter=10)
    tbl_cell_bold = ParagraphStyle('TCellBold', fontName=t_bold, fontSize=11, leading=14, textColor=colors.black)
    tbl_cell_norm = ParagraphStyle('TCellNorm', fontName=t_norm, fontSize=11, leading=14, textColor=colors.black)

    story = []

    # =========================================================================
    # S. NO. 1: COVER PAGE / TITLE PAGE
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("DEPARTMENT OF COMPUTER APPLICATIONS", cover_college))
    story.append(Paragraph("FACULTY OF COMPUTER SCIENCE & INFORMATION TECHNOLOGY", cover_bold))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("A PROJECT SYNOPSIS", cover_sub))
    story.append(Paragraph("ON", cover_norm))
    story.append(Spacer(1, 6))
    story.append(Paragraph("SMARTSHOP: A DIGITAL SHOP MANAGEMENT, POINT-OF-SALE (POS) & CUSTOMER KHATA LEDGER SYSTEM", cover_title))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="90%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceBefore=4, spaceAfter=20))
    
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the degree of", cover_norm))
    story.append(Paragraph("MASTER OF COMPUTER APPLICATIONS (MCA)", cover_bold))
    story.append(Paragraph("Semester – III (Mini Project)", cover_norm))
    story.append(Spacer(1, 25))

    # Meta Table
    meta_table_data = [
        [Paragraph("<b>Submitted By:</b>", tbl_cell_bold), Paragraph("<b>Under the Guidance of:</b>", tbl_cell_bold)],
        [Paragraph("<b>Ajit Kumar</b><br/>Roll No: 2504280140008<br/>Enrollment No: EN2504280140008<br/>MCA 3rd Semester", tbl_cell_norm),
         Paragraph("<b>Project Guide / Faculty Coordinator</b><br/>Assistant Professor<br/>Department of Computer Applications", tbl_cell_norm)]
    ]
    meta_tbl = Table(meta_table_data, colWidths=[210, 220])
    meta_tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 35))
    story.append(Paragraph("<b>Academic Session: 2026–2027</b>", cover_bold))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 2: CERTIFICATE
    # =========================================================================
    story.append(Paragraph("CERTIFICATE", ParagraphStyle('CertTitle', fontName=t_bold, fontSize=16, alignment=TA_CENTER, spaceAfter=15)))
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "This is to certify that the Project Synopsis entitled <b>\"SmartShop: A Digital Shop Management, Point-of-Sale (POS) & Customer Khata Ledger System\"</b> submitted by <b>Ajit Kumar</b> (Roll No: 2504280140008, Enrollment No: EN2504280140008) in partial fulfillment of the requirements for the award of the degree of <b>Master of Computer Applications (MCA – 3rd Semester)</b> from the Department of Computer Applications, is an authentic record of project work carried out under my supervision and guidance.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "To the best of my knowledge, the matter embodied in this project synopsis has not been submitted to any other University or Institute for the award of any other degree or diploma.",
        body_style
    ))
    story.append(Spacer(1, 60))
    
    cert_sign_data = [
        [Paragraph("<b>________________________</b><br/><b>Project Guide / Supervisor</b><br/>Department of Computer Applications", tbl_cell_norm),
         Paragraph("<b>________________________</b><br/><b>Head of Department (HOD)</b><br/>Department of Computer Applications", tbl_cell_norm)]
    ]
    cert_tbl = Table(cert_sign_data, colWidths=[220, 210])
    cert_tbl.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(cert_tbl)
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 3: DECLARATION
    # =========================================================================
    story.append(Paragraph("DECLARATION", ParagraphStyle('DeclTitle', fontName=t_bold, fontSize=16, alignment=TA_CENTER, spaceAfter=15)))
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "I hereby declare that the project synopsis entitled <b>\"SmartShop: A Digital Shop Management, Point-of-Sale (POS) & Customer Khata Ledger System\"</b> is an original work done by me under the guidance of our Project Guide in the Department of Computer Applications.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "I further declare that this synopsis represents my genuine understanding and design of the proposed MCA 3rd semester mini project, and it has not formed the basis for the award of any degree, diploma, fellowship or other similar title to any candidate of any University.",
        body_style
    ))
    story.append(Spacer(1, 60))
    story.append(Paragraph("Date: _______________", tbl_cell_norm))
    story.append(Paragraph("Place: _______________", tbl_cell_norm))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Ajit Kumar</b><br/>Roll No: 2504280140008<br/>MCA 3rd Semester", ParagraphStyle('SignRight', fontName=t_norm, fontSize=12, leading=16, alignment=TA_RIGHT)))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 4: ACKNOWLEDGEMENT
    # =========================================================================
    story.append(Paragraph("ACKNOWLEDGEMENT", ParagraphStyle('AckTitle', fontName=t_bold, fontSize=16, alignment=TA_CENTER, spaceAfter=15)))
    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "I express my deepest gratitude and sincere thanks to our respected Project Guide, Department of Computer Applications, for providing continuous guidance, valuable suggestions, and constant encouragement throughout the preparation of this project synopsis.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "I also extend my sincere thanks to our Head of Department (HOD) and all faculty members of the Department of Computer Applications for providing the necessary laboratory facilities, academic support, and constructive feedback.",
        body_style
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Finally, I would like to thank my parents, team members, and fellow classmates whose continuous moral support, discussions, and help made the completion of this synopsis possible.",
        body_style
    ))
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>Ajit Kumar</b><br/>MCA 3rd Semester", ParagraphStyle('AckSign', fontName=t_norm, fontSize=12, leading=16, alignment=TA_RIGHT)))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 5: TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("TABLE OF CONTENTS", ParagraphStyle('TocTitle', fontName=t_bold, fontSize=16, alignment=TA_CENTER, spaceAfter=15)))
    story.append(Spacer(1, 10))

    toc_data = [
        [Paragraph("<b>S. No.</b>", tbl_cell_bold), Paragraph("<b>Topic / Section Title</b>", tbl_cell_bold), Paragraph("<b>Page No.</b>", tbl_cell_bold)],
        [Paragraph("—", tbl_cell_norm), Paragraph("Certificate", tbl_cell_norm), Paragraph("i", tbl_cell_norm)],
        [Paragraph("—", tbl_cell_norm), Paragraph("Declaration", tbl_cell_norm), Paragraph("ii", tbl_cell_norm)],
        [Paragraph("—", tbl_cell_norm), Paragraph("Acknowledgement", tbl_cell_norm), Paragraph("iii", tbl_cell_norm)],
        [Paragraph("—", tbl_cell_norm), Paragraph("List of Figures", tbl_cell_norm), Paragraph("v", tbl_cell_norm)],
        [Paragraph("—", tbl_cell_norm), Paragraph("List of Tables", tbl_cell_norm), Paragraph("vi", tbl_cell_norm)],
        [Paragraph("—", tbl_cell_norm), Paragraph("Abstract / Project Summary", tbl_cell_norm), Paragraph("vii", tbl_cell_norm)],
        [Paragraph("1.", tbl_cell_norm), Paragraph("Introduction", tbl_cell_norm), Paragraph("1", tbl_cell_norm)],
        [Paragraph("2.", tbl_cell_norm), Paragraph("Problem Statement", tbl_cell_norm), Paragraph("2", tbl_cell_norm)],
        [Paragraph("3.", tbl_cell_norm), Paragraph("Existing System", tbl_cell_norm), Paragraph("3", tbl_cell_norm)],
        [Paragraph("4.", tbl_cell_norm), Paragraph("Limitations of Existing System", tbl_cell_norm), Paragraph("3", tbl_cell_norm)],
        [Paragraph("5.", tbl_cell_norm), Paragraph("Proposed System", tbl_cell_norm), Paragraph("4", tbl_cell_norm)],
        [Paragraph("6.", tbl_cell_norm), Paragraph("Objectives of the Project", tbl_cell_norm), Paragraph("5", tbl_cell_norm)],
        [Paragraph("7.", tbl_cell_norm), Paragraph("Scope of the Project (Current vs Future Scope)", tbl_cell_norm), Paragraph("5", tbl_cell_norm)],
        [Paragraph("8.", tbl_cell_norm), Paragraph("Users and Roles", tbl_cell_norm), Paragraph("6", tbl_cell_norm)],
        [Paragraph("9.", tbl_cell_norm), Paragraph("Modules of the System", tbl_cell_norm), Paragraph("7", tbl_cell_norm)],
        [Paragraph("10.", tbl_cell_norm), Paragraph("Functional Requirements (FR-01 to FR-12)", tbl_cell_norm), Paragraph("8", tbl_cell_norm)],
        [Paragraph("11.", tbl_cell_norm), Paragraph("Non-Functional Requirements", tbl_cell_norm), Paragraph("9", tbl_cell_norm)],
        [Paragraph("12.", tbl_cell_norm), Paragraph("Technology Stack", tbl_cell_norm), Paragraph("10", tbl_cell_norm)],
        [Paragraph("13.", tbl_cell_norm), Paragraph("Development Methodology (Agile)", tbl_cell_norm), Paragraph("10", tbl_cell_norm)],
        [Paragraph("14.", tbl_cell_norm), Paragraph("System Architecture", tbl_cell_norm), Paragraph("11", tbl_cell_norm)],
        [Paragraph("15.", tbl_cell_norm), Paragraph("Use Case Diagram", tbl_cell_norm), Paragraph("12", tbl_cell_norm)],
        [Paragraph("16.", tbl_cell_norm), Paragraph("DFD Level 0 (Context Level Diagram)", tbl_cell_norm), Paragraph("13", tbl_cell_norm)],
        [Paragraph("17.", tbl_cell_norm), Paragraph("DFD Level 1 (Functional Decomposition)", tbl_cell_norm), Paragraph("14", tbl_cell_norm)],
        [Paragraph("18.", tbl_cell_norm), Paragraph("ER Diagram", tbl_cell_norm), Paragraph("15", tbl_cell_norm)],
        [Paragraph("19.", tbl_cell_norm), Paragraph("Database Design (MongoDB Collections)", tbl_cell_norm), Paragraph("16", tbl_cell_norm)],
        [Paragraph("20.", tbl_cell_norm), Paragraph("Hardware and Software Requirements", tbl_cell_norm), Paragraph("17", tbl_cell_norm)],
        [Paragraph("21.", tbl_cell_norm), Paragraph("Project Development Timeline", tbl_cell_norm), Paragraph("18", tbl_cell_norm)],
        [Paragraph("22.", tbl_cell_norm), Paragraph("Expected Outcome", tbl_cell_norm), Paragraph("18", tbl_cell_norm)],
        [Paragraph("23.", tbl_cell_norm), Paragraph("Limitations of Current System", tbl_cell_norm), Paragraph("19", tbl_cell_norm)],
        [Paragraph("24.", tbl_cell_norm), Paragraph("Future Scope (OTP Login, Password Reset, WhatsApp)", tbl_cell_norm), Paragraph("19", tbl_cell_norm)],
        [Paragraph("25.", tbl_cell_norm), Paragraph("Conclusion", tbl_cell_norm), Paragraph("20", tbl_cell_norm)],
        [Paragraph("26.", tbl_cell_norm), Paragraph("References / Bibliography", tbl_cell_norm), Paragraph("21", tbl_cell_norm)],
    ]
    toc_tbl = Table(toc_data, colWidths=[45, 330, 55])
    toc_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(toc_tbl)
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 6 & 7: LIST OF FIGURES & LIST OF TABLES
    # =========================================================================
    story.append(Paragraph("LIST OF FIGURES", ParagraphStyle('LofTitle', fontName=t_bold, fontSize=14, alignment=TA_CENTER, spaceAfter=10)))
    lof_data = [
        [Paragraph("<b>Figure No.</b>", tbl_cell_bold), Paragraph("<b>Figure Name</b>", tbl_cell_bold), Paragraph("<b>Page No.</b>", tbl_cell_bold)],
        [Paragraph("Figure 1", tbl_cell_norm), Paragraph("SmartShop 3-Tier System Architecture Diagram", tbl_cell_norm), Paragraph("11", tbl_cell_norm)],
        [Paragraph("Figure 2", tbl_cell_norm), Paragraph("UML Use Case Diagram (Admin & Customer Actions)", tbl_cell_norm), Paragraph("12", tbl_cell_norm)],
        [Paragraph("Figure 3", tbl_cell_norm), Paragraph("Data Flow Diagram — Level 0 (Context Level Diagram)", tbl_cell_norm), Paragraph("13", tbl_cell_norm)],
        [Paragraph("Figure 4", tbl_cell_norm), Paragraph("Data Flow Diagram — Level 1 (Functional Decomposition)", tbl_cell_norm), Paragraph("14", tbl_cell_norm)],
        [Paragraph("Figure 5", tbl_cell_norm), Paragraph("Entity-Relationship (ER) Diagram", tbl_cell_norm), Paragraph("15", tbl_cell_norm)],
    ]
    lof_tbl = Table(lof_data, colWidths=[70, 310, 50])
    lof_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(lof_tbl)
    story.append(Spacer(1, 20))

    story.append(Paragraph("LIST OF TABLES", ParagraphStyle('LotTitle', fontName=t_bold, fontSize=14, alignment=TA_CENTER, spaceAfter=10)))
    lot_data = [
        [Paragraph("<b>Table No.</b>", tbl_cell_bold), Paragraph("<b>Table Name</b>", tbl_cell_bold), Paragraph("<b>Page No.</b>", tbl_cell_bold)],
        [Paragraph("Table 1", tbl_cell_norm), Paragraph("Technology Stack Specifications", tbl_cell_norm), Paragraph("10", tbl_cell_norm)],
        [Paragraph("Table 2", tbl_cell_norm), Paragraph("Hardware & Software Requirements (SRS)", tbl_cell_norm), Paragraph("17", tbl_cell_norm)],
        [Paragraph("Table 3", tbl_cell_norm), Paragraph("Project Development Timeline Schedule", tbl_cell_norm), Paragraph("18", tbl_cell_norm)],
    ]
    lot_tbl = Table(lot_data, colWidths=[70, 310, 50])
    lot_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(lot_tbl)
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 8: ABSTRACT / PROJECT SUMMARY
    # =========================================================================
    story.append(Paragraph("ABSTRACT / PROJECT SUMMARY", ParagraphStyle('AbsTitle', fontName=t_bold, fontSize=16, alignment=TA_CENTER, spaceAfter=15)))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "In the local neighborhood retail ecosystem, small grocery and provision shopkeepers heavily depend on manual paper notebooks (Khata bahi) to record daily customer credit sales ('Udhar'), cash billing, and inventory stock. Concurrently, customers face the practical inconvenience of not knowing whether a desired grocery item is in stock without physically walking to the shop. Furthermore, handwritten records frequently suffer from mathematical calculation errors, torn pages, lost credit dues, and complete lack of payment proof transparency.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>SmartShop</b> is an integrated fullstack web application built using the <b>MERN Stack (MongoDB, Express.js, React 19, Node.js)</b> to solve these real-world retail challenges. The system enables customers to check real-time product catalog availability, prices, and stock indicators from their homes on mobile devices before visiting the store. At the store counter, the shopkeeper utilizes an intuitive Point-of-Sale (POS) billing interface to process sales via Full Cash, Full UPI, Full Credit (Khata), or Partial Payment splits. The digital ledger tracks borrowed amounts, repayment due dates, and borrow limits. Customers can view itemized receipts and submit payment claims (Cash/UPI screenshot proofs/Razorpay) which the admin verifies. Product returns automatically restock inventory and deduct customer debt. Built with ACID transaction rollbacks, SmartShop delivers an efficient, transparent, and modern solution for retail shop operations.",
        body_style
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Keywords:</b> Shop Management System, Point of Sale (POS), Digital Khata Ledger, MERN Stack, React 19, MongoDB Transactions, Customer Self-Service Portal.", ParagraphStyle('Kw', fontName=t_italic, fontSize=11, leading=15)))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 9: 1. INTRODUCTION (Arabic Page 1)
    # =========================================================================
    story.append(Paragraph("1. INTRODUCTION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    
    story.append(Paragraph("1.1 Background of the Project", h2_style))
    story.append(Paragraph(
        "Neighborhood retail stores, grocery shops, and local provision merchants represent the primary source of daily household commodities across Indian towns and cities. One of the most distinctive features of this retail sector is the informal credit mechanism ('Udhar' / 'Khata'), where regular customers take household goods daily and settle their accumulated debt weekly or monthly. While this credit facility fosters strong customer loyalty, managing these financial transactions on physical paper notebooks is highly cumbersome, error-prone, and inefficient.",
        body_style
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "With the rapid penetration of smartphones and digital payment infrastructure (such as UPI), retail customers increasingly expect transparency and digital accessibility. However, most existing commercial Point-of-Sale (POS) software solutions are designed exclusively for large supermarket chains—they focus solely on instant card/cash payments, require expensive proprietary hardware terminals, and completely lack built-in customer credit khata management.",
        body_style
    ))

    story.append(Paragraph("1.2 Domain of the Project", h2_style))
    story.append(Paragraph(
        "SmartShop belongs to the domain of <b>Enterprise Web Application Development & Point of Sale (POS) Information Systems</b>. It bridges customer-facing self-service information with administrative shopkeeper workflows using contemporary web technologies.",
        body_style
    ))

    story.append(Paragraph("1.3 Purpose and Need of the System", h2_style))
    story.append(Paragraph(
        "The fundamental purpose of SmartShop is to replace chaotic, manual paper-based retail management with a centralized, reliable, and accessible cloud web system. Specifically, the system addresses three core operational needs:",
        body_style
    ))
    story.append(Paragraph("1. <b>Customer Product Availability Check:</b> Allows customers to browse store inventory and check whether items are in stock from their home before physically visiting the store.", bullet_style))
    story.append(Paragraph("2. <b>Fast POS Counter Billing:</b> Enables shopkeepers to generate multi-item bills in seconds supporting cash, UPI, credit, and partial payment combinations.", bullet_style))
    story.append(Paragraph("3. <b>Automated Khata Ledger & Payment Tracking:</b> Maintains an accurate ledger of customer borrowings, due dates, borrow limits, and verifies payment proofs to avoid financial disputes.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 10, 11, 12: PROBLEM STATEMENT, EXISTING SYSTEM & LIMITATIONS
    # =========================================================================
    story.append(Paragraph("2. PROBLEM STATEMENT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "In traditional local retail stores, two critical problems severely degrade daily operations:",
        body_style
    ))
    story.append(Paragraph(
        "<b>Problem 1 (Customer Inconvenience):</b> Customers frequently make trips to the neighborhood shop only to discover that necessary products are out of stock. There is currently no simple mechanism for a customer to verify product availability and pricing from home without making phone calls or physically walking to the shop.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Problem 2 (Ledger Errors & Disputes):</b> Shopkeepers record credit sales in handwritten notebooks. These paper ledgers are prone to arithmetic errors during manual daily addition, physical page tearing, and ink fading. Moreover, customers have zero visibility into their itemized dues, leading to frequent arguments during monthly settlements.",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. EXISTING SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "In the existing retail setup, the workflow is entirely manual and unorganized:",
        body_style
    ))
    story.append(Paragraph("• <b>Stock Verification:</b> Shopkeeper manually checks physical shelves when a customer asks for an item.", bullet_style))
    story.append(Paragraph("• <b>Billing:</b> Calculated on a handheld calculator and written on paper slips.", bullet_style))
    story.append(Paragraph("• <b>Credit Recording:</b> Amount is scribbled under the customer's page in a paper bahi-khata.", bullet_style))
    story.append(Paragraph("• <b>Payments:</b> Customer gives cash or transfers via UPI without any permanent itemized link to specific credit entries.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("4. LIMITATIONS OF EXISTING SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("• <b>Heavy Manual Work:</b> Time-consuming record keeping and daily ledger total recalculations.", bullet_style))
    story.append(Paragraph("• <b>Risk of Data Loss:</b> Physical register damage from moisture, fire, tearing, or misplacement.", bullet_style))
    story.append(Paragraph("• <b>Zero Customer Self-Service:</b> Customers cannot check their debt history or stock availability online.", bullet_style))
    story.append(Paragraph("• <b>No Stock Synchronization:</b> Stock levels are not decremented when items are sold on credit.", bullet_style))
    story.append(Paragraph("• <b>Disputed Returns:</b> Product returns require manual recalculations across multiple register pages.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 13, 14, 15: PROPOSED SYSTEM, OBJECTIVES & SCOPE
    # =========================================================================
    story.append(Paragraph("5. PROPOSED SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "<b>SmartShop</b> is proposed as a centralized, fullstack digital shop management and point-of-sale platform designed to overcome the limitations of manual registers:",
        body_style
    ))
    story.append(Paragraph("• <b>Home Stock Availability Check:</b> Customers can log into their mobile portal from home, search categories (Grocery, Snacks, Dairy, Personal Care), check prices, and verify whether items are in stock before going to the shop.", bullet_style))
    story.append(Paragraph("• <b>Multi-Mode Counter Billing:</b> Shopkeeper can quickly bill items and choose Full Cash, Full UPI, Full Credit (Khata), or Partial Payment splits.", bullet_style))
    story.append(Paragraph("• <b>Automated Digital Khata:</b> Credit balances are calculated automatically with repayment due dates and customer borrow limits.", bullet_style))
    story.append(Paragraph("• <b>Payment Claims Verification:</b> Customers can submit cash receipts or upload UPI screenshot proofs with UTR IDs, which the shopkeeper verifies and approves with one click.", bullet_style))
    story.append(Paragraph("• <b>Full & Partial Returns:</b> Returned items are automatically restocked into inventory and deducted from customer debt in an atomic transaction.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("6. OBJECTIVES OF THE PROJECT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("1. To develop a web-based Point of Sale (POS) system for fast counter billing supporting cash, UPI, credit, and partial payments.", bullet_style))
    story.append(Paragraph("2. To provide customers with a real-time product catalog to check store item availability and pricing from home.", bullet_style))
    story.append(Paragraph("3. To digitize customer credit accounts ('Khata') with automated due dates, borrow limits, and repayment tracking.", bullet_style))
    story.append(Paragraph("4. To enable payment verification where customers submit cash/UPI proofs and shopkeepers review and approve them.", bullet_style))
    story.append(Paragraph("5. To implement automated product return workflows that restore inventory stock and reduce debt balances atomically.", bullet_style))
    story.append(Paragraph("6. To ensure high database reliability by implementing multi-document ACID transaction rollbacks on write failures.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("7. SCOPE OF THE PROJECT", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("<b>7.1 Current Scope (Implemented in Current Project):</b>", h3_style))
    story.append(Paragraph("• Multi-role authentication (Admin, SuperAdmin, Customer) with JWT and single-use password reset tokens.", bullet_style))
    story.append(Paragraph("• Complete inventory catalog management with Cloudinary image hosting.", bullet_style))
    story.append(Paragraph("• POS sales counter with cash/UPI/credit/partial billing and atomic stock deduction.", bullet_style))
    story.append(Paragraph("• Digital khata credit ledger with borrow limits, due dates, and FIFO payment settlements.", bullet_style))
    story.append(Paragraph("• Payment claims approval dashboard and Razorpay payment gateway integration.", bullet_style))
    story.append(Paragraph("• Full and partial product return engine with stock restoration.", bullet_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>7.2 Future Scope (Planned in Subsequent Versions):</b>", h3_style))
    story.append(Paragraph("• OTP-based mobile number login for customer portal.", bullet_style))
    story.append(Paragraph("• OTP-based secure password reset verification.", bullet_style))
    story.append(Paragraph("• Automated WhatsApp and SMS invoice receipts and payment due date reminders.", bullet_style))
    story.append(Paragraph("• Thermal POS receipt printer integration for instant physical billing slips.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 16, 17: USERS & ROLES, MODULES OF SYSTEM
    # =========================================================================
    story.append(Paragraph("8. USERS AND ROLES", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The system defines three distinct user roles with specific permissions:", body_style))
    story.append(Paragraph("1. <b>Store Admin / Shopkeeper:</b> Manages daily operations including counter POS sales, inventory stock updates, customer credit limits, payment approvals, and return processing.", bullet_style))
    story.append(Paragraph("2. <b>Retail Customer:</b> Accesses self-service portal to browse product catalog availability from home, view itemized purchase invoices, track pending khata debt, and submit payment claims.", bullet_style))
    story.append(Paragraph("3. <b>SuperAdmin:</b> Platform administrator with system-wide oversight, admin account creation, and global store configuration control.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("9. MODULES OF THE SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    
    modules_desc = [
        ("9.1 Authentication & Profile Module", "Manages user registration, login via email/phone/username, role segregation, JWT token generation, and single-use password reset invalidation."),
        ("9.2 Product Catalog & Inventory Module", "Provides product CRUD operations, category filters (Grocery, Dairy, Snacks, etc.), stock quantity tracking, price management, and Cloudinary CDN image uploads."),
        ("9.3 POS Sales & Billing Engine", "Enables shopkeeper to build counter bills, select customer, deduct stock atomically, and settle via Cash, UPI, Credit (Khata), or Partial Payment splits."),
        ("9.4 Digital Khata / Credit Ledger Module", "Maintains customer debt records, tracks borrowed vs paid amounts, evaluates maximum borrow limits, and monitors repayment due dates."),
        ("9.5 Payment Reconciliation Module", "Allows customers to submit cash claims or upload UPI payment screenshots with UTR IDs. Shopkeeper verifies and approves claims, which decrements debt atomically."),
        ("9.6 Returns & Balance Adjustment Module", "Handles full or partial item returns against historical invoices, automatically restocks inventory, and offsets outstanding credit debt."),
        ("9.7 Activity & Audit Logging Module", "Maintains a chronological audit log of all store transactions and admin actions for complete transparency.")
    ]
    for mtitle, mdesc in modules_desc:
        story.append(Paragraph(f"• <b>{mtitle}:</b> {mdesc}", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 18, 19: FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS
    # =========================================================================
    story.append(Paragraph("10. FUNCTIONAL REQUIREMENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The functional requirements of SmartShop are specified in standard format:", body_style))
    
    fr_list = [
        ("FR-01: User Registration", "The system shall allow new customers to create an account using their name, email, phone number, and password."),
        ("FR-02: User Authentication", "The system shall authenticate registered users using email, phone, or username with secure password verification and JWT token issuance."),
        ("FR-03: Product Catalog & Stock View", "The system shall allow customers to browse categories, view product pricing, and check real-time stock availability from home."),
        ("FR-04: Inventory Management", "The system shall allow authorized store admins to add, update, view, and soft-delete products with Cloudinary image uploads."),
        ("FR-05: POS Sales Billing", "The system shall allow store admins to create sales invoices with catalog or custom items and choose Cash, UPI, Credit, or Partial payment."),
        ("FR-06: Atomic Stock Deduction", "The system shall atomically decrement product stock upon sale completion and mark products out-of-stock when inventory reaches zero."),
        ("FR-07: Borrow Limit Enforcement", "The system shall check customer outstanding credit against their maximum borrow limit before approving new credit sales."),
        ("FR-08: Customer Khata Ledger", "The system shall maintain an individual ledger for each customer displaying total borrowed amount, amount paid, and net pending dues."),
        ("FR-09: Payment Claims Submission", "The system shall allow customers to submit Cash payment claims or upload UPI payment screenshots with UTR transaction IDs."),
        ("FR-10: Admin Payment Verification", "The system shall provide admins with a verification queue to inspect payment proofs and approve or reject claims with atomic balance updates."),
        ("FR-11: Product Returns Processing", "The system shall allow admins to process full or partial item returns, automatically restocking inventory and reducing customer credit dues."),
        ("FR-12: Single-Use Password Reset", "The system shall generate secure, time-bound password reset tokens and invalidate them immediately after password update.")
    ]
    for code, desc in fr_list:
        story.append(Paragraph(code, fr_code_style))
        story.append(Paragraph(desc, fr_desc_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("11. NON-FUNCTIONAL REQUIREMENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("• <b>Security:</b> Passwords encrypted with bcrypt hashing, stateless JWT session tokens, and security response headers (XSS, frameguard, nosniff).", bullet_style))
    story.append(Paragraph("• <b>Reliability & Atomicity:</b> Multi-document write operations wrapped in MongoDB ACID transactions to guarantee zero corrupted financial ledgers.", bullet_style))
    story.append(Paragraph("• <b>Performance:</b> Lightweight Vite build and indexed database queries ensuring API response times under 200ms.", bullet_style))
    story.append(Paragraph("• <b>Usability:</b> Modern responsive UI built with TailwindCSS and glassmorphism styling, fully usable on smartphones, tablets, and desktop computers.", bullet_style))
    story.append(Paragraph("• <b>Availability:</b> 24/7 cloud accessibility for customer ledger inquiry and store operations.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 20, 21: TECHNOLOGY STACK & METHODOLOGY
    # =========================================================================
    story.append(Paragraph("12. TECHNOLOGY STACK", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Table 1 summarizes the technologies selected for the development of SmartShop:", body_style))
    
    tech_tbl_data = [
        [Paragraph("<b>Layer / Tier</b>", tbl_cell_bold), Paragraph("<b>Technology / Tool</b>", tbl_cell_bold), Paragraph("<b>Reason for Selection</b>", tbl_cell_bold)],
        [Paragraph("Frontend (Customer)", tbl_cell_norm), Paragraph("React 19, Vite, TailwindCSS", tbl_cell_norm), Paragraph("Component-based architecture, ultra-fast rendering, and responsive UI.", tbl_cell_norm)],
        [Paragraph("Frontend (Admin)", tbl_cell_norm), Paragraph("React 19, Lucide Icons, Vite", tbl_cell_norm), Paragraph("Clean administrative POS interface, charts, and verification views.", tbl_cell_norm)],
        [Paragraph("Backend Server", tbl_cell_norm), Paragraph("Node.js, Express.js (ESM)", tbl_cell_norm), Paragraph("Asynchronous non-blocking I/O, RESTful API architecture, modular routes.", tbl_cell_norm)],
        [Paragraph("Database", tbl_cell_norm), Paragraph("MongoDB, Mongoose ORM", tbl_cell_norm), Paragraph("Flexible JSON document store supporting multi-document ACID transactions.", tbl_cell_norm)],
        [Paragraph("Authentication", tbl_cell_norm), Paragraph("JWT, Bcrypt.js", tbl_cell_norm), Paragraph("Stateless cryptographic token auth with salted password hashing.", tbl_cell_norm)],
        [Paragraph("Media Storage", tbl_cell_norm), Paragraph("Cloudinary CDN & Multer", tbl_cell_norm), Paragraph("Cloud image optimization and secure hosting for product catalog and proofs.", tbl_cell_norm)],
        [Paragraph("Payment Gateway", tbl_cell_norm), Paragraph("Razorpay API", tbl_cell_norm), Paragraph("Seamless UPI, Netbanking, and Card payment clearance for credit settlements.", tbl_cell_norm)],
        [Paragraph("Version Control & IDE", tbl_cell_norm), Paragraph("Git, GitHub, VS Code", tbl_cell_norm), Paragraph("Industry-standard version tracking, branch management, and development IDE.", tbl_cell_norm)],
    ]
    tech_t = Table(tech_tbl_data, colWidths=[100, 130, 205])
    tech_t.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(tech_t)
    story.append(Paragraph("<b>Table 1: Technology Stack Specifications</b>", caption_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("13. DEVELOPMENT METHODOLOGY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "SmartShop was developed following the <b>Agile Software Development Methodology</b>. Agile was selected because it enables iterative feature building, frequent testing, and rapid incorporation of feedback across sprints:",
        body_style
    ))
    story.append(Paragraph("1. <b>Sprint 1 (Requirement Analysis & Database Schema):</b> Gathered local store pain points and designed 7 relational MongoDB collections.", bullet_style))
    story.append(Paragraph("2. <b>Sprint 2 (Backend REST APIs & Auth):</b> Developed JWT authentication, RBAC middleware, and product/sales controllers.", bullet_style))
    story.append(Paragraph("3. <b>Sprint 3 (Frontend POS & Customer Portal):</b> Built responsive React 19 interfaces for counter billing, catalog view, and khata ledger.", bullet_style))
    story.append(Paragraph("4. <b>Sprint 4 (Payments, Returns & Transactions):</b> Integrated Razorpay, payment verification queue, and atomic MongoDB transactions.", bullet_style))
    story.append(Paragraph("5. <b>Sprint 5 (Testing & Security Hardening):</b> Verified 0-error production builds, rate limiting, and single-use password reset tokens.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 22: 14. SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("14. SYSTEM ARCHITECTURE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "SmartShop implements a classic <b>3-Tier Architecture</b> consisting of the Presentation Tier, Application Tier, and Database/Cloud Services Tier, as illustrated in Figure 1:",
        body_style
    ))
    story.append(Spacer(1, 4))
    if os.path.exists(arch_img):
        story.append(Image(arch_img, width=6.2*inch, height=4.2*inch))
        story.append(Paragraph("<b>Figure 1: SmartShop 3-Tier System Architecture Diagram</b>", caption_style))
    story.append(Paragraph(
        "• <b>Tier 1 (Presentation):</b> Single Page Applications (SPAs) built in React 19 for Customer and Admin portals communicating via JSON HTTP requests.<br/>"
        "• <b>Tier 2 (Application):</b> Express.js server executing business controllers, role-based authorization, and MongoDB transactional sessions.<br/>"
        "• <b>Tier 3 (Database & Cloud):</b> MongoDB database storing persistent documents, alongside Cloudinary CDN and Razorpay API.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 23: 15. USE CASE DIAGRAM
    # =========================================================================
    story.append(Paragraph("15. USE CASE DIAGRAM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "Figure 2 depicts the UML Use Case Diagram showing the primary actors (Store Admin and Retail Customer) and their interactions with the major functional use cases of the SmartShop system:",
        body_style
    ))
    story.append(Spacer(1, 4))
    if os.path.exists(uc_img):
        story.append(Image(uc_img, width=6.0*inch, height=4.5*inch))
        story.append(Paragraph("<b>Figure 2: UML Use Case Diagram for SmartShop</b>", caption_style))
    story.append(Paragraph(
        "The diagram illustrates that both actors share authentication and ledger inspection use cases, while operational POS billing, inventory CRUD, returns, and payment verification are restricted to the Store Admin actor.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 24: 16. DFD LEVEL 0 (CONTEXT DIAGRAM)
    # =========================================================================
    story.append(Paragraph("16. DATA FLOW DIAGRAM — LEVEL 0 (CONTEXT DIAGRAM)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "The DFD Level 0 Context Diagram (Figure 3) defines the high-level boundary of the SmartShop system, showing all external entities and their major data inflows and outflows:",
        body_style
    ))
    story.append(Spacer(1, 4))
    if os.path.exists(dfd0_img):
        story.append(Image(dfd0_img, width=6.2*inch, height=3.8*inch))
        story.append(Paragraph("<b>Figure 3: Data Flow Diagram — Level 0 (Context Level Diagram)</b>", caption_style))
    story.append(Paragraph(
        "• <b>Store Admin:</b> Sends product catalog details, counter sales items, payment approvals, and return actions; receives sales receipts, khata reports, and activity logs.<br/>"
        "• <b>Retail Customer:</b> Sends login credentials, cash/UPI payment claims with screenshot proofs; receives real-time product stock view, purchase invoices, and balance clearance status.<br/>"
        "• <b>Razorpay API & Cloudinary:</b> Facilitates online payment signature verification and secure cloud image asset hosting.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 25: 17. DFD LEVEL 1 (FUNCTIONAL DECOMPOSITION)
    # =========================================================================
    story.append(Paragraph("17. DATA FLOW DIAGRAM — LEVEL 1 (DECOMPOSITION)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "Figure 4 decomposes the main system into <b>6 core functional sub-processes</b> and maps their read/write interactions with the <b>7 MongoDB data stores (D1 to D7)</b>:",
        body_style
    ))
    story.append(Spacer(1, 4))
    if os.path.exists(dfd1_img):
        story.append(Image(dfd1_img, width=6.2*inch, height=4.2*inch))
        story.append(Paragraph("<b>Figure 4: Data Flow Diagram — Level 1 (Functional Decomposition)</b>", caption_style))
    story.append(Paragraph(
        "• <b>1.0 Auth & Profile:</b> Interacts with D1 (Users) and D2 (Customers).<br/>"
        "• <b>2.0 Products & Stock:</b> Manages product catalog and stock levels in D3 (Products).<br/>"
        "• <b>3.0 POS Sales Engine:</b> Reads D3, writes invoices to D4 (Sales), and triggers credit in 4.0.<br/>"
        "• <b>4.0 Digital Khata Ledger:</b> Manages customer debt balances in D2 (Customers) and D5 (Credits).<br/>"
        "• <b>5.0 Payment Verification:</b> Writes claims to D6 (Payments) and decrements dues in D5 and D2.<br/>"
        "• <b>6.0 Returns Engine:</b> Restores stock in D3, records returns in D7, and offsets debt in D5.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 26: 18. ER DIAGRAM
    # =========================================================================
    story.append(Paragraph("18. ENTITY-RELATIONSHIP (ER) DIAGRAM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "Figure 5 illustrates the primary entities, attributes, primary keys, foreign key references, and cardinality relationships across the SmartShop database structure:",
        body_style
    ))
    story.append(Spacer(1, 4))
    if os.path.exists(er_img):
        story.append(Image(er_img, width=6.2*inch, height=4.0*inch))
        story.append(Paragraph("<b>Figure 5: Entity-Relationship (ER) Diagram</b>", caption_style))
    story.append(Paragraph(
        "• <b>User to Customer:</b> 1-to-1 relationship linking login credentials to customer financial records.<br/>"
        "• <b>Customer to Sale:</b> 1-to-Many relationship where one customer can make multiple purchases.<br/>"
        "• <b>Sale to Credit:</b> 1-to-1 optional relationship linking credit-based sales to individual credit loans.<br/>"
        "• <b>Credit to Payment:</b> 1-to-Many relationship where a single credit debt can be settled via multiple partial payments.",
        body_style
    ))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 27: 19. DATABASE DESIGN (MongoDB Collections)
    # =========================================================================
    story.append(Paragraph("19. DATABASE DESIGN (COLLECTION SCHEMAS)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The system implements 7 primary MongoDB collections structured with Mongoose schemas:", body_style))
    
    schema_tables = [
        ("Users Collection (D1)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key (Auto generated)"],
            ["name", "String", "Full user name (Required)"],
            ["email / phone", "String", "Unique login identifiers (Sparse)"],
            ["password", "String", "Bcrypt hashed password (Required)"],
            ["role", "String", "Enum: 'customer' | 'admin' | 'superadmin'"],
            ["resetPasswordToken", "String", "Single-use token with expiration timestamp"]
        ]),
        ("Customers Collection (D2)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["userId", "ObjectId", "Foreign Key -> Users._id (Required)"],
            ["pendingAmount", "Number", "Total outstanding credit balance"],
            ["totalPurchase", "Number", "Cumulative lifetime purchase amount"],
            ["trustScore", "Number", "Computed customer repayment rating"],
            ["manualBorrowLimit", "Number", "Max credit debt ceiling configured by admin"]
        ]),
        ("Products Collection (D3)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["name", "String", "Product item name (Required)"],
            ["category", "String", "Category: Grocery, Snacks, Dairy, etc."],
            ["price", "Number", "Unit retail price (Required)"],
            ["stock", "Number", "Current available inventory quantity"],
            ["imageUrl", "String", "Cloudinary CDN hosted asset URL"],
            ["available", "Boolean", "Auto set to false when stock = 0"],
            ["deleted", "Boolean", "Soft-delete flag to protect sales history"]
        ]),
        ("Sales Collection (D4)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["customerId", "ObjectId", "Foreign Key -> Customers._id"],
            ["items", "Array", "[{ productId, quantity, price, total }]"],
            ["totalAmount", "Number", "Invoice bill total amount"],
            ["paymentType", "String", "Enum: 'cash' | 'upi' | 'credit' | 'partial'"],
            ["paidAmount", "Number", "Amount paid instantly at counter"],
            ["pendingAmount", "Number", "Amount added to customer credit ledger"]
        ]),
        ("Credits Collection (D5)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["customerId", "ObjectId", "Foreign Key -> Customers._id"],
            ["borrowedAmount", "Number", "Original credit loan amount"],
            ["paidAmount", "Number", "Cumulative amount settled towards credit"],
            ["pendingAmount", "Number", "Net remaining debt balance"],
            ["dueDate", "Date", "Repayment deadline"],
            ["status", "String", "Enum: 'active' | 'partially_paid' | 'paid' | 'overdue'"]
        ]),
        ("Payments Collection (D6)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["creditId", "ObjectId", "Foreign Key -> Credits._id"],
            ["amount", "Number", "Payment submission amount"],
            ["paymentMethod", "String", "Enum: 'cash' | 'upi' | 'razorpay'"],
            ["status", "String", "Enum: 'pending' | 'approved' | 'rejected'"],
            ["transactionId", "String", "UPI UTR ID or Razorpay Payment ID"],
            ["paymentProof", "String", "Cloudinary image URL of receipt screenshot"]
        ]),
        ("Returns Collection (D7)", [
            ["Field", "Type", "Constraints & Description"],
            ["_id", "ObjectId", "Primary Key"],
            ["saleId", "ObjectId", "Foreign Key -> Sales._id"],
            ["returnedItems", "Array", "[{ productId, quantity, refundAmount }]"],
            ["refundAmount", "Number", "Total calculated return refund value"],
            ["balanceDeducted", "Number", "Amount offset from customer credit debt"],
            ["processedBy", "ObjectId", "Foreign Key -> Users._id (Admin)"]
        ])
    ]

    for s_name, rows in schema_tables:
        story.append(Paragraph(f"<b>{s_name}</b>", h3_style))
        tbl_data = []
        for r_idx, row in enumerate(rows):
            style = tbl_cell_bold if r_idx == 0 else tbl_cell_norm
            tbl_data.append([Paragraph(row[0], style), Paragraph(row[1], style), Paragraph(row[2], style)])
        t = Table(tbl_data, colWidths=[90, 80, 265])
        t.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ]))
        story.append(t)
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 28, 29, 30: REQUIREMENTS, TIMELINE & EXPECTED OUTCOME
    # =========================================================================
    story.append(Paragraph("20. HARDWARE AND SOFTWARE REQUIREMENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Table 2 outlines the minimum and recommended system requirements:", body_style))
    
    srs_data = [
        [Paragraph("<b>Hardware Requirements</b>", tbl_cell_bold), Paragraph("<b>Software Requirements</b>", tbl_cell_bold)],
        [
            Paragraph("• <b>Processor:</b> Intel Core i3 / AMD Ryzen 3 or higher<br/>• <b>RAM:</b> 4 GB (8 GB Recommended)<br/>• <b>Storage:</b> 500 MB free hard disk space<br/>• <b>Display:</b> Responsive on Mobile, Tablet & Desktop<br/>• <b>Network:</b> Active 4G / Broadband Internet", tbl_cell_norm),
            Paragraph("• <b>Operating System:</b> Windows 10/11, Linux, macOS<br/>• <b>Runtime:</b> Node.js (v18.x / v20.x)<br/>• <b>Database:</b> MongoDB Atlas / Local v6.0+<br/>• <b>Web Browser:</b> Chrome, Edge, Firefox, Safari<br/>• <b>Version Control:</b> Git & GitHub", tbl_cell_norm)
        ]
    ]
    srs_tbl = Table(srs_data, colWidths=[215, 220])
    srs_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(srs_tbl)
    story.append(Paragraph("<b>Table 2: Hardware & Software Requirements (SRS)</b>", caption_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("21. PROJECT DEVELOPMENT TIMELINE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Table 3 outlines the 12-week development schedule for the project:", body_style))
    
    timeline_data = [
        [Paragraph("<b>Week</b>", tbl_cell_bold), Paragraph("<b>Activity / Milestone</b>", tbl_cell_bold), Paragraph("<b>Outcome / Deliverable</b>", tbl_cell_bold)],
        [Paragraph("Week 1", tbl_cell_norm), Paragraph("Requirement Analysis & Literature Survey", tbl_cell_norm), Paragraph("Requirement Specification Document", tbl_cell_norm)],
        [Paragraph("Week 2", tbl_cell_norm), Paragraph("System Requirements Specification (SRS)", tbl_cell_norm), Paragraph("Finalized SRS Document", tbl_cell_norm)],
        [Paragraph("Week 3", tbl_cell_norm), Paragraph("System Architecture & Diagram Design", tbl_cell_norm), Paragraph("Use Case, DFD & Architecture Diagrams", tbl_cell_norm)],
        [Paragraph("Week 4", tbl_cell_norm), Paragraph("Database Schema Design & ER Modeling", tbl_cell_norm), Paragraph("MongoDB Mongoose Collections", tbl_cell_norm)],
        [Paragraph("Week 5–6", tbl_cell_norm), Paragraph("Backend API Development & Auth", tbl_cell_norm), Paragraph("REST API Endpoints & JWT Security", tbl_cell_norm)],
        [Paragraph("Week 7–8", tbl_cell_norm), Paragraph("Frontend Customer & Admin UI", tbl_cell_norm), Paragraph("React 19 Responsive Web Pages", tbl_cell_norm)],
        [Paragraph("Week 9", tbl_cell_norm), Paragraph("System Integration (Razorpay, Cloudinary)", tbl_cell_norm), Paragraph("Working Fullstack Integration", tbl_cell_norm)],
        [Paragraph("Week 10", tbl_cell_norm), Paragraph("Testing & Transaction Rollback Hardening", tbl_cell_norm), Paragraph("Zero-error Builds & Validation", tbl_cell_norm)],
        [Paragraph("Week 11", tbl_cell_norm), Paragraph("Deployment & GitHub Repository Setup", tbl_cell_norm), Paragraph("Live Cloud Deployment", tbl_cell_norm)],
        [Paragraph("Week 12", tbl_cell_norm), Paragraph("Documentation & Synopsis Preparation", tbl_cell_norm), Paragraph("Final Synopsis & Presentation PPT", tbl_cell_norm)],
    ]
    time_tbl = Table(timeline_data, colWidths=[65, 190, 180])
    time_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
    ]))
    story.append(time_tbl)
    story.append(Paragraph("<b>Table 3: Project Development Timeline Schedule</b>", caption_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("22. EXPECTED OUTCOME", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("Upon successful deployment, SmartShop delivers direct benefits to both shopkeepers and customers:", body_style))
    story.append(Paragraph("• <b>For Retail Customers:</b> Eliminates unnecessary physical store trips by allowing them to check real-time stock and prices from home. Provides 24/7 transparent access to itemized purchase invoices and khata dues.", bullet_style))
    story.append(Paragraph("• <b>For Store Shopkeepers:</b> Reduces counter billing time by over 80%, eliminates paper register damage, prevents forgotten credit dues, and enforces credit limits automatically.", bullet_style))
    story.append(Paragraph("• <b>Academic Outcome:</b> Demonstrates practical mastery of fullstack MERN development, database transactions, and responsive interface engineering.", bullet_style))
    story.append(PageBreak())

    # =========================================================================
    # S. NO. 31, 32, 33, 34: LIMITATIONS, FUTURE SCOPE, CONCLUSION, REFERENCES
    # =========================================================================
    story.append(Paragraph("23. LIMITATIONS OF CURRENT SYSTEM", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The current prototype has the following realistic limitations:", body_style))
    story.append(Paragraph("• <b>Internet Dependency:</b> Requires an active internet connection for live cloud synchronization.", bullet_style))
    story.append(Paragraph("• <b>Manual Camera Barcode:</b> Product addition is currently catalog-based and does not yet scan barcodes via hardware laser scanners.", bullet_style))
    story.append(Paragraph("• <b>Single Store Focus:</b> Designed for single-store retail operations rather than multi-branch enterprise chains in the initial version.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("24. FUTURE SCOPE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph("The following features are planned for subsequent development phases:", body_style))
    story.append(Paragraph("1. <b>OTP-Based Customer Login:</b> Implementation of passwordless phone number OTP login via SMS gateway for rapid mobile access.", bullet_style))
    story.append(Paragraph("2. <b>OTP-Based Password Reset:</b> Enhancing password recovery with time-sensitive SMS/Email OTP verification.", bullet_style))
    story.append(Paragraph("3. <b>Automated WhatsApp / SMS Invoices:</b> Automatic delivery of bill receipts and payment due date reminders directly to customers' WhatsApp numbers.", bullet_style))
    story.append(Paragraph("4. <b>Thermal POS Receipt Printing:</b> Adding direct USB and Bluetooth thermal printer drivers for physical paper invoice slips.", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("25. CONCLUSION", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    story.append(Paragraph(
        "<b>SmartShop</b> provides a practical, robust, and modern digital platform that solves persistent operational bottlenecks in traditional retail shop management. By enabling customers to check stock availability from home, streamlining counter POS sales with multi-payment mode flexibility, digitizing customer credit khata records, and automating return adjustments, the project successfully replaces error-prone paper notebooks with an ACID-compliant cloud web system. The project strictly satisfies all academic requirements for an MCA 3rd Semester Mini Project and establishes a solid foundation for future retail software enhancements.",
        body_style
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("26. REFERENCES / BIBLIOGRAPHY", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1e3a8a"), spaceBefore=2, spaceAfter=8))
    references = [
        "[1] V. Subramanian, <i>Pro MERN Stack: Full Stack Web App Development with Mongo, Express, React, and Node</i>, 2nd ed., Apress, 2019.",
        "[2] R. Elmasri and S. B. Navathe, <i>Fundamentals of Database Systems</i>, 7th ed., Pearson, 2016.",
        "[3] R. S. Pressman and B. R. Maxim, <i>Software Engineering: A Practitioner's Approach</i>, 8th ed., McGraw-Hill Education, 2014.",
        "[4] React 19 Official Documentation, \"React – A JavaScript library for building user interfaces,\" https://react.dev/",
        "[5] MongoDB Inc., \"MongoDB Manual: Multi-Document ACID Transactions,\" https://www.mongodb.com/docs/manual/core/transactions/",
        "[6] Express.js Foundation, \"Fast, unopinionated, minimalist web framework for Node.js,\" https://expressjs.com/",
        "[7] Tailwind Labs, \"Tailwind CSS – Rapidly build modern websites without ever leaving your HTML,\" https://tailwindcss.com/",
        "[8] Razorpay Software Private Limited, \"Razorpay Payment Gateway API Documentation,\" https://razorpay.com/docs/"
    ]
    for ref in references:
        story.append(Paragraph(ref, bullet_style))

    # Build PDF with MCA Canvas
    doc.build(story, canvasmaker=MCASynopsisCanvas)
    print("MCA Project Synopsis PDF generated successfully at:", pdf_path)

if __name__ == "__main__":
    generate_synopsis()
