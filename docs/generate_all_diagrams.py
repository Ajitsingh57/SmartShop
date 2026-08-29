import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_diagrams():
    os.makedirs("d:/SmartShop/docs", exist_ok=True)

    # =========================================================================
    # 1. SYSTEM ARCHITECTURE DIAGRAM
    # =========================================================================
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    # Title
    ax.text(50, 95, "SmartShop — 3-Tier System Architecture", fontsize=15, fontweight='bold', color='#1e3a8a', ha='center')

    # Tier 1: Client / Presentation Tier
    t1 = patches.FancyBboxPatch((5, 64), 90, 24, boxstyle="round,pad=1,rounding_size=2", facecolor='#f0f9ff', edgecolor='#0284c7', lw=1.8)
    ax.add_patch(t1)
    ax.text(8, 84, "PRESENTATION TIER (CLIENT)", fontsize=10, fontweight='bold', color='#0369a1')
    
    # Client Sub-boxes
    c1 = patches.Rectangle((8, 68), 26, 13, facecolor='#ffffff', edgecolor='#38bdf8', lw=1.2)
    ax.add_patch(c1)
    ax.text(21, 76, "Customer Web Portal", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(21, 71, "(Catalog Browse, Bills,\nKhata Balance & Payments)", fontsize=8, ha='center', color='#475569')

    c2 = patches.Rectangle((37, 68), 26, 13, facecolor='#ffffff', edgecolor='#38bdf8', lw=1.2)
    ax.add_patch(c2)
    ax.text(50, 76, "Admin POS Dashboard", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 71, "(Counter POS Billing, Stock,\nReturns & Payment Approval)", fontsize=8, ha='center', color='#475569')

    c3 = patches.Rectangle((66, 68), 26, 13, facecolor='#ffffff', edgecolor='#38bdf8', lw=1.2)
    ax.add_patch(c3)
    ax.text(79, 76, "Responsive Engine", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(79, 71, "React 19 + TailwindCSS\n(Mobile / Tablet / PC)", fontsize=8, ha='center', color='#475569')

    # Tier 2: Application / Server Tier
    t2 = patches.FancyBboxPatch((5, 34), 90, 24, boxstyle="round,pad=1,rounding_size=2", facecolor='#eff6ff', edgecolor='#2563eb', lw=1.8)
    ax.add_patch(t2)
    ax.text(8, 54, "APPLICATION TIER (REST API BACKEND)", fontsize=10, fontweight='bold', color='#1d4ed8')

    s1 = patches.Rectangle((8, 38), 26, 13, facecolor='#ffffff', edgecolor='#60a5fa', lw=1.2)
    ax.add_patch(s1)
    ax.text(21, 46, "Node.js & Express API", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(21, 41, "REST Endpoints, JSON Parser,\nError Middleware", fontsize=8, ha='center', color='#475569')

    s2 = patches.Rectangle((37, 38), 26, 13, facecolor='#ffffff', edgecolor='#60a5fa', lw=1.2)
    ax.add_patch(s2)
    ax.text(50, 46, "Security & Auth Layer", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 41, "JWT Tokens, Bcrypt Hashing,\nRBAC, Single-Use Reset", fontsize=8, ha='center', color='#475569')

    s3 = patches.Rectangle((66, 38), 26, 13, facecolor='#ffffff', edgecolor='#60a5fa', lw=1.2)
    ax.add_patch(s3)
    ax.text(79, 46, "Business Controllers", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(79, 41, "Sales, Khata Ledger, Returns,\nAtomic Stock & Debt Handler", fontsize=8, ha='center', color='#475569')

    # Tier 3: Database & External Services Tier
    t3 = patches.FancyBboxPatch((5, 4), 90, 24, boxstyle="round,pad=1,rounding_size=2", facecolor='#f0fdf4', edgecolor='#16a34a', lw=1.8)
    ax.add_patch(t3)
    ax.text(8, 24, "DATABASE & EXTERNAL CLOUD SERVICES TIER", fontsize=10, fontweight='bold', color='#15803d')

    d1 = patches.Rectangle((8, 8), 26, 13, facecolor='#ffffff', edgecolor='#4ade80', lw=1.2)
    ax.add_patch(d1)
    ax.text(21, 16, "MongoDB Database", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(21, 11, "Mongoose ODM, ACID Sessions,\n7 Core Collections", fontsize=8, ha='center', color='#475569')

    d2 = patches.Rectangle((37, 8), 26, 13, facecolor='#ffffff', edgecolor='#4ade80', lw=1.2)
    ax.add_patch(d2)
    ax.text(50, 16, "Cloudinary CDN", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 11, "Cloud Product Images &\nPayment Screenshot Proofs", fontsize=8, ha='center', color='#475569')

    d3 = patches.Rectangle((66, 8), 26, 13, facecolor='#ffffff', edgecolor='#4ade80', lw=1.2)
    ax.add_patch(d3)
    ax.text(79, 16, "Razorpay Gateway", fontsize=10, fontweight='bold', ha='center', color='#0f172a')
    ax.text(79, 11, "Online Payment Gateway,\nWebhooks & Verification", fontsize=8, ha='center', color='#475569')

    # Connecting Arrows
    ax.annotate("", xy=(50, 58), xytext=(50, 64), arrowprops=dict(arrowstyle="<->", color='#0f172a', lw=2, mutation_scale=15))
    ax.text(51.5, 61, "HTTPS / JSON REST API", fontsize=8.5, fontweight='bold', color='#1e3a8a')

    ax.annotate("", xy=(50, 28), xytext=(50, 34), arrowprops=dict(arrowstyle="<->", color='#0f172a', lw=2, mutation_scale=15))
    ax.text(51.5, 31, "Mongoose Driver / Cloud SDK", fontsize=8.5, fontweight='bold', color='#15803d')

    plt.tight_layout()
    plt.savefig("d:/SmartShop/docs/system_architecture.png", bbox_inches='tight', dpi=300)
    plt.close()

    # =========================================================================
    # 2. USE CASE DIAGRAM
    # =========================================================================
    fig, ax = plt.subplots(figsize=(12, 9), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(50, 96, "SmartShop — UML Use Case Diagram", fontsize=15, fontweight='bold', color='#1e3a8a', ha='center')

    # System boundary box
    sys_box = patches.Rectangle((25, 4), 50, 88, facecolor='#fafafa', edgecolor='#475569', lw=1.8, linestyle='--')
    ax.add_patch(sys_box)
    ax.text(50, 89, "SmartShop Web System Boundary", fontsize=11, fontweight='bold', color='#334155', ha='center')

    # Actors
    # Actor 1: Admin (Left)
    ax.add_patch(patches.Rectangle((4, 45), 18, 16, facecolor='#dbeafe', edgecolor='#1e40af', lw=1.5))
    ax.text(13, 56, "ACTOR", fontsize=8, fontweight='bold', ha='center', color='#1e40af')
    ax.text(13, 50, "Store Admin /\nShopkeeper", fontsize=10, fontweight='bold', ha='center', color='#0f172a')

    # Actor 2: Customer (Right)
    ax.add_patch(patches.Rectangle((78, 45), 18, 16, facecolor='#dbeafe', edgecolor='#1e40af', lw=1.5))
    ax.text(87, 56, "ACTOR", fontsize=8, fontweight='bold', ha='center', color='#1e40af')
    ax.text(87, 50, "Retail Customer", fontsize=10, fontweight='bold', ha='center', color='#0f172a')

    # Use Cases (Ovals in center)
    use_cases = [
        (78, "UC-01: User Login & Authentication", "both"),
        (69, "UC-02: Check Product Catalog & Stock from Home", "cust"),
        (60, "UC-03: Manage Products & Inventory (CRUD)", "admin"),
        (51, "UC-04: Create POS Sale Invoice (Cash/UPI/Credit)", "admin"),
        (42, "UC-05: View Purchase Bills & Khata Debt Ledger", "both"),
        (33, "UC-06: Submit Payment Proof (Cash/UPI/Razorpay)", "cust"),
        (24, "UC-07: Verify & Approve Payment Claims", "admin"),
        (15, "UC-08: Process Full / Partial Product Returns", "admin"),
        (6,  "UC-09: View Store Activity & Audit Logs", "admin"),
    ]

    for y, uctext, actor in use_cases:
        oval = patches.FancyBboxPatch((30, y), 40, 6.5, boxstyle="round,pad=0.5,rounding_size=3.2", facecolor='#e0f2fe', edgecolor='#0284c7', lw=1.2)
        ax.add_patch(oval)
        ax.text(50, y + 3.2, uctext, fontsize=8.5, fontweight='bold', ha='center', va='center', color='#0f172a')

        if actor in ["admin", "both"]:
            ax.plot([18, 30], [53, y + 3.2], color='#0284c7', lw=1.2)
        if actor in ["cust", "both"]:
            ax.plot([82, 70], [53, y + 3.2], color='#0284c7', lw=1.2)

    plt.tight_layout()
    plt.savefig("d:/SmartShop/docs/use_case_diagram.png", bbox_inches='tight', dpi=300)
    plt.close()

    # =========================================================================
    # 3. ENTITY RELATIONSHIP (ER) DIAGRAM
    # =========================================================================
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(50, 96, "SmartShop — Entity-Relationship (ER) Diagram", fontsize=15, fontweight='bold', color='#1e3a8a', ha='center')

    def draw_entity(x, y, w, h, name, attrs, pk, fk=None):
        box = patches.Rectangle((x, y), w, h, facecolor='#f8fafc', edgecolor='#1e40af', lw=1.5)
        ax.add_patch(box)
        # Header
        hdr = patches.Rectangle((x, y + h - 4.5), w, 4.5, facecolor='#dbeafe', edgecolor='#1e40af', lw=1.5)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - 2.5, name.upper(), fontsize=9.5, fontweight='bold', color='#1e3a8a', ha='center')
        
        # Attributes
        curr_y = y + h - 7.5
        ax.text(x + 2, curr_y, f"PK: {pk}", fontsize=8, fontweight='bold', color='#b91c1c')
        curr_y -= 3.5
        if fk:
            for f in fk:
                ax.text(x + 2, curr_y, f"FK: {f}", fontsize=8, fontweight='bold', color='#0369a1')
                curr_y -= 3.5
        for a in attrs:
            ax.text(x + 2, curr_y, f"• {a}", fontsize=7.5, color='#334155')
            curr_y -= 3.2

    # Entities
    draw_entity(5, 62, 26, 28, "User", ["name", "email, phone", "username", "password (hash)", "role ('customer'|'admin')", "resetPasswordToken"], "_id")
    draw_entity(37, 62, 26, 28, "Customer", ["pendingAmount", "totalPurchase", "trustScore", "manualBorrowLimit", "address"], "_id", ["userId (ref: User)"])
    draw_entity(69, 62, 26, 28, "Product", ["name, category", "price, unit", "stock (qty)", "imageUrl (Cloudinary)", "available, deleted"], "_id", ["createdBy, updatedBy"])

    draw_entity(5, 12, 26, 38, "Sale", ["paymentType (cash|upi|credit|part)", "totalAmount", "paidAmount, pendingAmount", "items: [{productId, qty, price}]", "status ('completed')"], "_id", ["customerId", "adminId", "creditId"])
    draw_entity(37, 12, 26, 38, "Credit (Khata)", ["borrowedAmount", "paidAmount", "pendingAmount", "dueDate", "extensionCount", "status (active|paid|overdue)"], "_id", ["customerId", "userId", "saleId"])
    draw_entity(69, 12, 26, 38, "Payment", ["amount", "paymentMethod (cash|upi|razor)", "status (pending|approved)", "transactionId / UTR", "paymentProof (Cloudinary URL)", "paidAt, verifiedAt"], "_id", ["creditId", "customerId", "verifiedBy"])

    # Relationship Connectors
    # User -> Customer (1 to 1)
    ax.annotate("1 : 1", xy=(37, 76), xytext=(31, 76), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.5), fontsize=8, fontweight='bold', color='#0284c7')

    # Customer -> Sale (1 to N)
    ax.annotate("1 : N", xy=(18, 50), xytext=(45, 62), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.5), fontsize=8, fontweight='bold', color='#0284c7')

    # Sale -> Credit (1 to 1 optional)
    ax.annotate("1 : 1", xy=(37, 30), xytext=(31, 30), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.5), fontsize=8, fontweight='bold', color='#0284c7')

    # Credit -> Payment (1 to N)
    ax.annotate("1 : N", xy=(69, 30), xytext=(63, 30), arrowprops=dict(arrowstyle="->", color='#0284c7', lw=1.5), fontsize=8, fontweight='bold', color='#0284c7')

    plt.tight_layout()
    plt.savefig("d:/SmartShop/docs/er_diagram.png", bbox_inches='tight', dpi=300)
    plt.close()

    print("All 5 project diagrams generated successfully in d:/SmartShop/docs/")

if __name__ == "__main__":
    generate_diagrams()
