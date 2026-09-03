import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf():
    pdf_filename = "Nexgile_DecarbX_Database_Design_Specification.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0D9488")     # Teal 600
    SECONDARY = colors.HexColor("#0F172A")   # Slate 900
    ACCENT = colors.HexColor("#059669")      # Emerald 600
    DARK_BG = colors.HexColor("#1E293B")     # Slate 800
    LIGHT_BG = colors.HexColor("#F8FAFC")    # Slate 50
    TEXT_DARK = colors.HexColor("#334155")   # Slate 700

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=15
    )

    heading1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6
    )

    heading2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F766E"),
        backColor=colors.HexColor("#F1F5F9"),
        borderColor=colors.HexColor("#CBD5E1"),
        borderWidth=0.5,
        borderPadding=4,
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("Nexgile–DecarbX Platform", title_style))
    story.append(Paragraph("<b>Enterprise Data Model & Database Architecture Specification</b><br/>Version 1.0 | Feature Complete Release", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=15))

    # Executive Overview
    story.append(Paragraph("1. System Architecture Overview", heading1_style))
    story.append(Paragraph(
        "Nexgile-DecarbX is built on a <b>Polyglot Hybrid Database Architecture</b> combining PostgreSQL (Relational Engine) and MongoDB (Unstructured Document Engine). This dual-store strategy ensures strict ACID transactional integrity for carbon calculations and audit logs while providing dynamic schema flexibility for multi-language vendor questionnaires and raw OCR document extractions.",
        body_style
    ))

    overview_table_data = [
        [Paragraph("<b>Database Engine</b>", body_style), Paragraph("<b>Primary Function</b>", body_style), Paragraph("<b>Core Domain Models</b>", body_style)],
        [Paragraph("<b>PostgreSQL 15+</b><br/>(SQLAlchemy ORM)", body_style), Paragraph("Relational Storage, Multi-Tenant Scoping, Carbon Accounting Ledger, BOM Trees, Finance & Audit Lineage", body_style), Paragraph("Organizations, Facilities, ActivityData, EmissionFactors, PCF, CSRD Disclosures, LineageRecord", body_style)],
        [Paragraph("<b>MongoDB 6+</b><br/>(Motor / PyMongo)", body_style), Paragraph("Document Store, Dynamic Vendor ESG Survey Schemas, Raw Utility PDF Invoice OCR Extractions", body_style), Paragraph("questionnaire_templates, supplier_submissions, raw_ocr_extractions", body_style)]
    ]
    t_overview = Table(overview_table_data, colWidths=[1.8*inch, 2.7*inch, 2.7*inch])
    t_overview.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), LIGHT_BG),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_overview)
    story.append(Spacer(1, 12))

    # High Level ER Schema Summary
    story.append(Paragraph("2. Core Domain Schema Breakdown (Modules 0 to 8)", heading1_style))
    story.append(Paragraph("The platform datastore is structured into 9 modular schema packages:", body_style))

    modules_summary = [
        ("Module 0: Platform Foundation", "Multi-Tenant Hierarchy (Orgs, Entities, Facilities), RBAC (Users, Roles, Permissions), Governance (LineageRecord, DataQualityFlag, Workflow Tasks)"),
        ("Module 1: Carbon Accounting", "Scopes 1, 2, and 3 Activity Data Ledger, Emission Factors Library (15+ countries), Calculation Engine"),
        ("Module 2: Product LCA & PCF", "Product Catalog, SKUs, Bill of Materials (BOM) Tree, PCF Engine, Scenario Isolation (@no_actuals_mutation)"),
        ("Module 3: Supplier Scope 3", "Supplier Master, ESG Campaigns, Questionnaire Submissions (MongoDB), Carbon-Weighted Bidding"),
        ("Module 4: AI Analytics & Decarb", "Time-Series Forecasts, 3-Sigma Anomaly Detector, Invoice OCR Extractions, Monte Carlo Simulations, MACC Curve"),
        ("Module 5: Dashboards & Finance", "Executive Aggregations, Operational Drill-Down Tree, Carbon Budgets, Internal Carbon Pricing, Credit Offsets"),
        ("Module 6: Compliance & Disclosure", "CSRD/ESRS Double Materiality, XBRL DataPoint Tags, CBAM Declarations, EU Taxonomy DNSH Checklist"),
        ("Module 7: Data Integrations", "Integration Connections (CSV, REST API, Webhooks), Field Mappings, Sync Runs, Reconciliation Audit Logs"),
        ("Module 8: Platform Hardening", "Global TSVector Search Queries, Scheduled Reports, Lineage Verification Seals, Admin Audit Logs")
    ]

    for mod_title, mod_desc in modules_summary:
        story.append(Paragraph(f"• <b>{mod_title}</b>: {mod_desc}", bullet_style))

    story.append(Spacer(1, 12))

    # Detailed Table Specifications
    story.append(Paragraph("3. Detailed Entity Relationship & Field Specification", heading1_style))

    def make_table(title, columns_data):
        res = [Paragraph(f"<b>Table: {title}</b>", heading2_style)]
        t_data = [[Paragraph("<b>Column Name</b>", body_style), Paragraph("<b>Data Type</b>", body_style), Paragraph("<b>Constraints</b>", body_style), Paragraph("<b>Description & Business Logic</b>", body_style)]]
        for col, dt, const, desc in columns_data:
            t_data.append([
                Paragraph(f"<code>{col}</code>", body_style),
                Paragraph(dt, body_style),
                Paragraph(const, body_style),
                Paragraph(desc, body_style)
            ])
        t = Table(t_data, colWidths=[1.6*inch, 1.1*inch, 1.3*inch, 3.2*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        res.append(t)
        res.append(Spacer(1, 10))
        return res

    # 1. Organizations & Facilities
    story.extend(make_table("organizations (Organization)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Unique multi-tenant organization root identifier"),
        ("name", "VARCHAR(255)", "NOT NULL", "Corporate legal name (e.g. Global Decarb Corporation)"),
        ("code", "VARCHAR(100)", "UNIQUE, NOT NULL", "Short tenant code (e.g. GLOBAL_DECARB)"),
        ("country", "VARCHAR(100)", "NOT NULL", "Headquarters country location"),
        ("currency", "VARCHAR(10)", "DEFAULT 'USD'", "Base reporting currency for carbon financial pricing")
    ]))

    story.extend(make_table("facilities (Facility)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Unique physical site identifier"),
        ("org_id", "VARCHAR(36)", "FK -> orgs.id", "Parent tenant organization reference"),
        ("entity_id", "VARCHAR(36)", "FK -> entities.id", "Parent legal entity reference"),
        ("name", "VARCHAR(255)", "NOT NULL", "Site name (e.g. Texas Clean Tech Plant)"),
        ("code", "VARCHAR(100)", "UNIQUE", "Facility code (e.g. FAC_TEXAS)"),
        ("gross_floor_area_sqm", "FLOAT", "DEFAULT 0.0", "Physical area in square meters for intensity metrics"),
        ("operational_control", "BOOLEAN", "DEFAULT TRUE", "Scope GHG consolidation methodology boundary flag")
    ]))

    # 2. ActivityData & EmissionFactors
    story.extend(make_table("activity_data (ActivityData)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Unique activity record identifier"),
        ("org_id", "VARCHAR(36)", "FK -> orgs.id", "Multi-tenant organization boundary"),
        ("facility_id", "VARCHAR(36)", "FK -> facilities.id", "Physical facility generating the activity"),
        ("scope", "VARCHAR(50)", "NOT NULL", "Scope 1, Scope 2, or Scope 3 category designation"),
        ("category", "VARCHAR(100)", "NOT NULL", "Stationary Combustion, Mobile Fleet, Grid Energy, etc."),
        ("activity_type", "VARCHAR(100)", "NOT NULL", "Specific fuel/energy type (Natural Gas, Electricity Grid)"),
        ("quantity", "FLOAT", "NOT NULL", "Raw input quantity consumed"),
        ("unit", "VARCHAR(50)", "NOT NULL", "Measurement unit (kWh, m3, liters, kg, USD)"),
        ("source_type", "VARCHAR(50)", "NOT NULL", "MANUAL_INPUT, BULK_CSV, CONNECTOR_REST_API, OCR_INVOICE"),
        ("status", "VARCHAR(50)", "DEFAULT 'APPROVED'", "APPROVED, PENDING_REVIEW, REJECTED")
    ]))

    story.extend(make_table("emission_factors (EmissionFactor)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Unique emission factor library entry"),
        ("name", "VARCHAR(255)", "NOT NULL", "Factor name (e.g. EPA eGRID Texas Subregion ERCT)"),
        ("scope", "VARCHAR(50)", "NOT NULL", "Scope 1, Scope 2, or Scope 3"),
        ("co2e_factor", "FLOAT", "NOT NULL", "Numerical emissions multiplier value (e.g. 0.3851)"),
        ("unit", "VARCHAR(50)", "NOT NULL", "Denominator unit (e.g. kgCO2e/kWh, kgCO2e/m3)"),
        ("country", "VARCHAR(100)", "NOT NULL", "Geographic country applicability (15+ countries)"),
        ("version", "VARCHAR(50)", "NOT NULL", "Source edition tag (e.g. EPA 2026.1, DEFRA 2025, IEA 2025)")
    ]))

    # 3. LineageRecord & Auditor Verification
    story.extend(make_table("lineage_records (LineageRecord)", [
        ("lineage_id", "VARCHAR(36)", "PK, UUID", "Cryptographic audit trail lineage citation identifier"),
        ("target_entity_type", "VARCHAR(100)", "NOT NULL", "Target model class (ActivityData, Calculation, Disclosure)"),
        ("target_entity_id", "VARCHAR(36)", "NOT NULL", "Target primary key reference"),
        ("source", "VARCHAR(255)", "NOT NULL", "Raw input invoice filename or connector system name"),
        ("methodology", "VARCHAR(255)", "NOT NULL", "GHG Protocol Corporate Standard / ISO 14064"),
        ("formula", "VARCHAR(255)", "NOT NULL", "Exact mathematical calculation formula representation"),
        ("factor_version", "VARCHAR(50)", "NOT NULL", "Exact grid emission factor edition tag used"),
        ("user_id", "VARCHAR(36)", "NOT NULL", "User ID of creator/calculator")
    ]))

    story.extend(make_table("lineage_verifications (LineageVerification)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Auditor verification record primary key"),
        ("lineage_id", "VARCHAR(36)", "FK -> lineage_records", "Target lineage citation record audited"),
        ("auditor_user_id", "VARCHAR(36)", "FK -> users.id", "User ID of external auditor"),
        ("verification_status", "VARCHAR(50)", "NOT NULL", "VERIFIED, FLAGGED, REJECTED"),
        ("notes", "TEXT", "NULLABLE", "Auditor assurance commentary and verification notes"),
        ("verified_at", "DATETIME", "NOT NULL", "Timestamp of audit sign-off")
    ]))

    # 4. Products & PCFs
    story.extend(make_table("products (Product) & boms (BOM)", [
        ("product.id", "VARCHAR(36)", "PK, UUID", "Product master catalog record"),
        ("product.code", "VARCHAR(100)", "UNIQUE", "Product SKU/Code (e.g. PROD-SOLAR-X1)"),
        ("bom.product_id", "VARCHAR(36)", "FK -> products.id", "Parent product reference"),
        ("bom.parent_bom_id", "VARCHAR(36)", "Self-FK", "Nested sub-assembly hierarchy linkage"),
        ("bom.component_name", "VARCHAR(255)", "NOT NULL", "Component name (e.g. Aluminum Enclosure Frame)"),
        ("bom.quantity", "FLOAT", "NOT NULL", "Bill of Materials component quantity"),
        ("bom.loss_rate_pct", "FLOAT", "DEFAULT 0.0", "Manufacturing scrap rate percentage loss")
    ]))

    # 5. Compliance Disclosures
    story.extend(make_table("disclosure_datapoints (DisclosureDataPoint)", [
        ("id", "VARCHAR(36)", "PK, UUID", "Specific regulatory disclosure requirement data point"),
        ("disclosure_id", "VARCHAR(36)", "FK -> disclosures.id", "Parent regulatory report (CSRD, CBAM, TCFD)"),
        ("code", "VARCHAR(100)", "NOT NULL", "Requirement code (e.g. ESRS E1-6 Scope 1 Emissions)"),
        ("xbrl_tag", "VARCHAR(100)", "NOT NULL", "Regulatory XBRL taxonomy tag for automated filing"),
        ("lineage_id", "VARCHAR(36)", "NOT NULL", "Primitive LineageRecord citation proving regulatory value")
    ]))

    story.append(Paragraph("4. Data Security & Multi-Tenant Isolation Rules", heading1_style))
    story.append(Paragraph("1. <b>Strict Tenant Scoping</b>: Every database query enforces <code>org_id == current_user.org_id</code> filtering.", bullet_style))
    story.append(Paragraph("2. <b>Immutable Lineage Citations</b>: <code>LineageRecord</code> table entries are append-only. They are never updated or deleted.", bullet_style))
    story.append(Paragraph("3. <b>Scenario Isolation (@no_actuals_mutation)</b>: What-if and alternative material simulation runs write exclusively to <code>scenario_pcf</code> and <code>scenario_forecasts</code>, guaranteeing core ledgers are never mutated.", bullet_style))

    doc.build(story)
    print(f"PDF successfully generated: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
