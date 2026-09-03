import os
from PIL import Image, ImageDraw, ImageFont

def generate_er_diagram():
    # Dimensions
    width = 2400
    height = 1600
    
    # Colors (Dark Theme / Slate & Emerald)
    BG_COLOR = (15, 23, 42)          # Slate 900
    BOX_BG = (30, 41, 59)           # Slate 800
    BOX_BORDER = (51, 65, 85)        # Slate 700
    HEADER_BG = (13, 148, 136)       # Teal 600
    HEADER_TEXT = (255, 255, 255)
    TEXT_MAIN = (241, 245, 249)      # Slate 100
    TEXT_SUB = (148, 163, 184)       # Slate 400
    LINE_COLOR = (16, 185, 129)      # Emerald 500
    PK_COLOR = (251, 191, 36)        # Amber 400
    FK_COLOR = (56, 189, 248)        # Sky 400

    img = Image.new('RGB', (width, height), color=BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Load Fonts
    try:
        font_title = ImageFont.truetype("arial.ttf", 36)
        font_header = ImageFont.truetype("arialbd.ttf", 20)
        font_body = ImageFont.truetype("arial.ttf", 16)
        font_sub = ImageFont.truetype("arial.ttf", 14)
    except:
        font_title = font_header = font_body = font_sub = ImageFont.load_default()

    # Title Banner
    draw.text((60, 40), "Nexgile-DecarbX Enterprise Database ER Diagram", fill=(20, 184, 166), font=font_title)
    draw.text((60, 90), "Hybrid Polyglot Schema Architecture (PostgreSQL Core Ledger + MongoDB Document Store)", fill=TEXT_SUB, font=font_sub)

    # Boxes Definitions (x, y, w, h, title, fields)
    tables = [
        # Module 0: Multi-Tenant Org
        {"id": "org", "x": 60, "y": 160, "w": 320, "h": 220, "title": "organizations", "fields": [("id (PK)", PK_COLOR), ("name", TEXT_MAIN), ("code (UNIQUE)", TEXT_MAIN), ("country", TEXT_MAIN), ("currency", TEXT_MAIN)]},
        {"id": "entity", "x": 440, "y": 160, "w": 320, "h": 220, "title": "entities", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("name", TEXT_MAIN), ("code", TEXT_MAIN), ("equity_share_pct", TEXT_MAIN)]},
        {"id": "facility", "x": 820, "y": 160, "w": 340, "h": 240, "title": "facilities", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("entity_id (FK)", FK_COLOR), ("name", TEXT_MAIN), ("code", TEXT_MAIN), ("operational_control", TEXT_MAIN)]},
        {"id": "user", "x": 60, "y": 440, "w": 320, "h": 220, "title": "users & rbac_roles", "fields": [("id (PK)", PK_COLOR), ("email", TEXT_MAIN), ("full_name", TEXT_MAIN), ("role_name", TEXT_MAIN), ("is_superadmin", TEXT_MAIN)]},

        # Module 1: Carbon Accounting
        {"id": "activity", "x": 1220, "y": 160, "w": 360, "h": 280, "title": "activity_data", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("facility_id (FK)", FK_COLOR), ("scope (Scope 1,2,3)", TEXT_MAIN), ("activity_type", TEXT_MAIN), ("quantity", TEXT_MAIN), ("unit", TEXT_MAIN), ("status", TEXT_MAIN)]},
        {"id": "factor", "x": 1640, "y": 160, "w": 340, "h": 260, "title": "emission_factors", "fields": [("id (PK)", PK_COLOR), ("name", TEXT_MAIN), ("scope", TEXT_MAIN), ("co2e_factor", TEXT_MAIN), ("unit", TEXT_MAIN), ("version (EPA/DEFRA)", TEXT_MAIN)]},
        {"id": "lineage", "x": 1220, "y": 480, "w": 360, "h": 260, "title": "lineage_records", "fields": [("lineage_id (PK)", PK_COLOR), ("target_entity_type", TEXT_MAIN), ("target_entity_id", TEXT_MAIN), ("source (Raw Invoice)", TEXT_MAIN), ("formula", TEXT_MAIN), ("factor_version", TEXT_MAIN)]},

        # Module 2: Products & PCF
        {"id": "product", "x": 60, "y": 740, "w": 320, "h": 220, "title": "products & skus", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("code", TEXT_MAIN), ("name", TEXT_MAIN), ("functional_unit", TEXT_MAIN)]},
        {"id": "bom", "x": 440, "y": 740, "w": 320, "h": 240, "title": "boms (Bill of Materials)", "fields": [("id (PK)", PK_COLOR), ("product_id (FK)", FK_COLOR), ("parent_bom_id (Self-FK)", FK_COLOR), ("component_name", TEXT_MAIN), ("quantity", TEXT_MAIN), ("loss_rate_pct", TEXT_MAIN)]},
        {"id": "pcf", "x": 820, "y": 740, "w": 340, "h": 240, "title": "pcfs & scenario_pcf", "fields": [("id (PK)", PK_COLOR), ("product_id (FK)", FK_COLOR), ("total_co2e_kg", TEXT_MAIN), ("material_co2e_kg", TEXT_MAIN), ("lineage_id (FK)", FK_COLOR), ("scenario_name", TEXT_MAIN)]},

        # Module 3: Suppliers
        {"id": "supplier", "x": 60, "y": 1040, "w": 320, "h": 220, "title": "suppliers", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("name", TEXT_MAIN), ("category", TEXT_MAIN), ("tier (1 or 2)", TEXT_MAIN)]},
        {"id": "bid", "x": 440, "y": 1040, "w": 320, "h": 240, "title": "procurement_bids", "fields": [("id (PK)", PK_COLOR), ("supplier_id (FK)", FK_COLOR), ("bid_amount_usd", TEXT_MAIN), ("offered_pcf_co2e_kg", TEXT_MAIN), ("carbon_weighted_score", TEXT_MAIN)]},
        {"id": "mongo", "x": 820, "y": 1040, "w": 340, "h": 240, "title": "MongoDB: survey_submissions", "fields": [("_id (Mongo ObjectId)", PK_COLOR), ("postgres_ref_id (FK)", FK_COLOR), ("dynamic_questionnaire_json", TEXT_MAIN), ("raw_ocr_extraction", TEXT_MAIN)]},

        # Module 6 & 8: Compliance & Verification
        {"id": "disclosure", "x": 1640, "y": 480, "w": 340, "h": 260, "title": "disclosure_datapoints", "fields": [("id (PK)", PK_COLOR), ("disclosure_id (FK)", FK_COLOR), ("code (ESRS E1-6)", TEXT_MAIN), ("xbrl_tag", TEXT_MAIN), ("lineage_id (FK)", FK_COLOR)]},
        {"id": "audit", "x": 1640, "y": 780, "w": 340, "h": 240, "title": "lineage_verifications", "fields": [("id (PK)", PK_COLOR), ("lineage_id (FK)", FK_COLOR), ("auditor_user_id (FK)", FK_COLOR), ("verification_status", TEXT_MAIN), ("notes", TEXT_MAIN)]},
        {"id": "macc", "x": 1220, "y": 780, "w": 360, "h": 240, "title": "reduction_initiatives (MACC)", "fields": [("id (PK)", PK_COLOR), ("title", TEXT_MAIN), ("category", TEXT_MAIN), ("expected_reduction_co2e_kg", TEXT_MAIN), ("capex_cost_usd", TEXT_MAIN), ("abatement_cost_per_tco2e", TEXT_MAIN)]},
        {"id": "finance", "x": 1220, "y": 1070, "w": 360, "h": 220, "title": "carbon_budgets & icp", "fields": [("id (PK)", PK_COLOR), ("org_id (FK)", FK_COLOR), ("annual_budget_tco2e", TEXT_MAIN), ("internal_price_per_tco2e", TEXT_MAIN), ("credit_offset_id", TEXT_MAIN)]},
        {"id": "connect", "x": 1640, "y": 1070, "w": 340, "h": 220, "title": "integration_connections", "fields": [("id (PK)", PK_COLOR), ("name", TEXT_MAIN), ("system_type (CSV/REST)", TEXT_MAIN), ("status", TEXT_MAIN), ("credentials_vault_ref", TEXT_MAIN)]}
    ]

    # Draw Tables
    box_lookup = {}
    for t in tables:
        bx, by, bw, bh = t["x"], t["y"], t["w"], t["h"]
        box_lookup[t["id"]] = (bx, by, bw, bh)
        
        # Outer Card
        draw.rectangle([bx, by, bx + bw, by + bh], fill=BOX_BG, outline=BOX_BORDER, width=2)
        # Header Banner
        draw.rectangle([bx, by, bx + bw, by + 36], fill=HEADER_BG)
        draw.text((bx + 12, by + 8), t["title"], fill=HEADER_TEXT, font=font_header)
        
        # Fields
        fy = by + 48
        for fname, fcolor in t["fields"]:
            draw.text((bx + 14, fy), f"• {fname}", fill=fcolor, font=font_body)
            fy += 26

    # Draw Relationships (Lines with Connectors)
    connections = [
        ("org", "entity"),
        ("entity", "facility"),
        ("facility", "activity"),
        ("activity", "lineage"),
        ("factor", "activity"),
        ("product", "bom"),
        ("product", "pcf"),
        ("supplier", "bid"),
        ("supplier", "mongo"),
        ("lineage", "disclosure"),
        ("lineage", "audit")
    ]

    for src, tgt in connections:
        if src in box_lookup and tgt in box_lookup:
            sx, sy, sw, sh = box_lookup[src]
            tx, ty, tw, th = box_lookup[tgt]
            
            start_point = (sx + sw, sy + sh // 2)
            end_point = (tx, ty + th // 2)
            
            draw.line([start_point, end_point], fill=LINE_COLOR, width=3)

    # Save Output
    output_filename = "Nexgile_DecarbX_ER_Diagram.png"
    img.save(output_filename)
    print(f"ER Diagram image successfully saved: {output_filename}")

if __name__ == "__main__":
    generate_er_diagram()
