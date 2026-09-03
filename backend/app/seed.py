from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User, Role, Permission, UserOrgRole, role_permissions
from app.models.carbon import EmissionFactor, ActivityData, Calculation
from app.models.products import Product, SKU, Material, BOM, LCA, PCF

from app.models.suppliers import Supplier, Questionnaire, Submission, Scorecard
from app.models.ai_analytics import ScenarioForecast, ReductionInitiative, DocumentIngestion
from app.models.finance import CarbonBudget, InternalCarbonPrice, CreditOffset, ProjectEconomics, TCFDFinancialImpact
from app.models.compliance import Framework, Disclosure, DisclosureDataPoint, CBAMDeclaration, EUTaxonomyAlignment
from app.models.integrations import IntegrationConnection, FieldMapping, SyncRun, ReconciliationLog

from app.models.lineage import LineageRecord
from app.database import mongo_db






from app.models.data_quality import DataQualityFlag
from app.models.governance import EmissionFactorVersion, FormulaVersion, CalculationVersion
from app.models.workflow import Task, Approval, Notification
from app.core.auth.jwt import get_password_hash

def seed_db(db_session: Session = None):
    Base.metadata.create_all(bind=engine)
    db: Session = db_session if db_session else SessionLocal()
    should_close = db_session is None
    try:

        # 1. Seed Roles
        seed_role_names = [
            ("SuperAdmin", "Platform Super Administrator with full system access"),
            ("CSO", "Chief Sustainability Officer with strategic disclosure & approval access"),
            ("SustainabilityAnalyst", "Sustainability Analyst managing carbon calculations & quality"),
            ("FacilityManager", "Facility Manager entering site activity data"),
            ("ProcurementUser", "Procurement user managing suppliers & Scope 3 questionnaires"),
            ("FinanceUser", "Finance user overseeing carbon budgets & credits"),
            ("Supplier", "External vendor submitting product footprints & data"),
            ("Auditor", "External auditor with read-only audit trail verification access"),
            ("Consultant", "External consultant assisting on reduction planning")
        ]
        
        role_objs = {}
        for r_name, r_desc in seed_role_names:
            role = db.query(Role).filter(Role.name == r_name).first()
            if not role:
                role = Role(name=r_name, description=r_desc, is_system_role=True)
                db.add(role)
                db.flush()
            role_objs[r_name] = role

        # 2. Seed Permissions
        permissions_data = [
            ("org:manage", "admin", "Manage organizations"),
            ("entity:manage", "admin", "Manage legal entities"),
            ("facility:manage", "admin", "Manage physical facilities"),
            ("user:manage", "admin", "Manage users and role assignments"),
            ("carbon:read", "carbon", "Read carbon accounting data"),
            ("carbon:write", "carbon", "Write carbon accounting data"),
            ("lineage:read", "lineage", "View audit lineage records")
        ]
        
        perm_objs = []
        for code, mod, desc in permissions_data:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(code=code, module=mod, description=desc)
                db.add(perm)
                db.flush()
            perm_objs.append(perm)

        # Assign all permissions to SuperAdmin role
        super_role = role_objs["SuperAdmin"]
        for p in perm_objs:
            if p not in super_role.permissions:
                super_role.permissions.append(p)

        # Assign facility & carbon read/write to FacilityManager
        fac_mgr_role = role_objs["FacilityManager"]
        for p in perm_objs:
            if p.code in ["carbon:read", "carbon:write", "facility:manage"]:
                if p not in fac_mgr_role.permissions:
                    fac_mgr_role.permissions.append(p)

        db.commit()

        # 3. Seed Default Organization, Entity, Facility
        org = db.query(Organization).filter(Organization.code == "GLOBAL_DECARB").first()
        if not org:
            org = Organization(
                name="Global Decarb Corporation",
                code="GLOBAL_DECARB",
                country="United States",
                currency="USD"
            )
            db.add(org)
            db.commit()
            db.refresh(org)

        entity = db.query(Entity).filter(Entity.code == "NA_OPS").first()
        if not entity:
            entity = Entity(
                org_id=org.id,
                name="North America Operations",
                code="NA_OPS",
                country="United States",
                legal_structure="LLC",
                equity_share_pct=100
            )
            db.add(entity)
            db.commit()
            db.refresh(entity)

        facility_a = db.query(Facility).filter(Facility.code == "FAC_TEXAS").first()
        if not facility_a:
            facility_a = Facility(
                org_id=org.id,
                entity_id=entity.id,
                name="Texas Clean Tech Plant",
                code="FAC_TEXAS",
                facility_type="Manufacturing",
                city="Austin",
                country="United States",
                gross_floor_area_sqm=25000,
                operational_control=True
            )
            db.add(facility_a)
            db.commit()
            db.refresh(facility_a)

        facility_b = db.query(Facility).filter(Facility.code == "FAC_OREGON").first()
        if not facility_b:
            facility_b = Facility(
                org_id=org.id,
                entity_id=entity.id,
                name="Oregon Solar Warehouse",
                code="FAC_OREGON",
                facility_type="Warehouse",
                city="Portland",
                country="United States",
                gross_floor_area_sqm=18000,
                operational_control=True
            )
            db.add(facility_b)
            db.commit()
            db.refresh(facility_b)

        # 4. Seed Default SuperAdmin User
        admin_user = db.query(User).filter(User.email == "admin@nexgile.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@nexgile.com",
                hashed_password=get_password_hash("AdminPass123!"),
                full_name="Platform SuperAdmin",
                is_active=True,
                is_superadmin=True,
                default_org_id=org.id
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            u_role = UserOrgRole(
                user_id=admin_user.id,
                org_id=org.id,
                role_id=super_role.id
            )
            db.add(u_role)
            db.commit()

        # 5. Seed Emission Factors Library (15+ Real Sample Countries + Scope 1/2/3 Categories)

        sample_factors = [
            # Scope 2 Grid Electricity (15 Countries)
            ("GRID_ELEC_US", "US Grid Electricity (eGRID)", "v2024.1", 0.385, "kWh", "United States", "Scope 2", "Grid Electricity (Location-Based)", "eGRID 2024"),
            ("GRID_ELEC_CA", "Canada Grid Electricity", "v2024.1", 0.120, "kWh", "Canada", "Scope 2", "Grid Electricity (Location-Based)", "Environment Canada"),
            ("GRID_ELEC_UK", "UK National Grid Electricity", "v2024.1", 0.207, "kWh", "United Kingdom", "Scope 2", "Grid Electricity (Location-Based)", "DEFRA 2024"),
            ("GRID_ELEC_DE", "Germany Grid Electricity", "v2024.1", 0.375, "kWh", "Germany", "Scope 2", "Grid Electricity (Location-Based)", "UBA Germany"),
            ("GRID_ELEC_FR", "France Nuclear-Dominant Grid", "v2024.1", 0.052, "kWh", "France", "Scope 2", "Grid Electricity (Location-Based)", "ADEME France"),
            ("GRID_ELEC_JP", "Japan Power Grid", "v2024.1", 0.462, "kWh", "Japan", "Scope 2", "Grid Electricity (Location-Based)", "MOE Japan"),
            ("GRID_ELEC_CN", "China Regional Grid", "v2024.1", 0.581, "kWh", "China", "Scope 2", "Grid Electricity (Location-Based)", "MEE China"),
            ("GRID_ELEC_IN", "India National Grid", "v2024.1", 0.716, "kWh", "India", "Scope 2", "Grid Electricity (Location-Based)", "CEA India"),
            ("GRID_ELEC_BR", "Brazil Hydro-Dominant Grid", "v2024.1", 0.085, "kWh", "Brazil", "Scope 2", "Grid Electricity (Location-Based)", "MCTI Brazil"),
            ("GRID_ELEC_AU", "Australia NEM Grid", "v2024.1", 0.680, "kWh", "Australia", "Scope 2", "Grid Electricity (Location-Based)", "DISER Australia"),
            ("GRID_ELEC_SG", "Singapore Grid Electricity", "v2024.1", 0.405, "kWh", "Singapore", "Scope 2", "Grid Electricity (Location-Based)", "EMA Singapore"),
            ("GRID_ELEC_MX", "Mexico National Grid", "v2024.1", 0.430, "kWh", "Mexico", "Scope 2", "Grid Electricity (Location-Based)", "SEMARNAT"),
            ("GRID_ELEC_IT", "Italy Power Grid", "v2024.1", 0.260, "kWh", "Italy", "Scope 2", "Grid Electricity (Location-Based)", "ISPRA Italy"),
            ("GRID_ELEC_ES", "Spain Power Grid", "v2024.1", 0.175, "kWh", "Spain", "Scope 2", "Grid Electricity (Location-Based)", "MITECO Spain"),
            ("GRID_ELEC_NL", "Netherlands Power Grid", "v2024.1", 0.310, "kWh", "Netherlands", "Scope 2", "Grid Electricity (Location-Based)", "RVO Netherlands"),

            # Scope 1 Fuels & Processes
            ("NAT_GAS_US", "Natural Gas Stationary Combustion", "v2024.1", 0.202, "kWh", "United States", "Scope 1", "Stationary Combustion", "EPA AP-42"),
            ("DIESEL_MOBILE", "Diesel Fuel Mobile Combustion", "v2024.1", 2.680, "liter", "GLOBAL", "Scope 1", "Mobile Combustion", "DEFRA 2024"),
            ("REFRIGERANT_R410A", "R-410A Fugitive Refrigerant", "v2024.1", 2088.0, "kg", "GLOBAL", "Scope 1", "Fugitive Emissions", "IPCC AR5"),

            # Scope 3 Categories (15 GHG Protocol Categories)
            ("SPEND_PURCHASED_GOODS", "Category 1: Purchased Goods & Services (Spend-Based)", "v2024.1", 0.450, "USD", "GLOBAL", "Scope 3", "Category 1: Purchased Goods", "EXIOBASE v3.8"),
            ("SPEND_CAPITAL_GOODS", "Category 2: Capital Goods (Spend-Based)", "v2024.1", 0.620, "USD", "GLOBAL", "Scope 3", "Category 2: Capital Goods", "EXIOBASE v3.8"),
            ("AIR_TRAVEL_LONG", "Category 6: Long-Haul Business Flight", "v2024.1", 0.150, "passenger-km", "GLOBAL", "Scope 3", "Category 6: Business Travel", "DEFRA 2024"),
            ("WASTE_LANDFILL", "Category 5: Commercial Municipal Solid Waste", "v2024.1", 0.380, "kg", "GLOBAL", "Scope 3", "Category 5: Waste Generated", "DEFRA 2024"),
        ]

        factor_objs = {}
        for f_key, f_name, f_ver, f_val, f_unit, f_country, f_scope, f_cat, f_src in sample_factors:
            ef = db.query(EmissionFactor).filter(EmissionFactor.factor_key == f_key).first()
            if not ef:
                ef = EmissionFactor(
                    factor_key=f_key,
                    name=f_name,
                    version_tag=f_ver,
                    co2e_factor=f_val,
                    unit=f_unit,
                    country=f_country,
                    scope=f_scope,
                    category=f_cat,
                    source_library=f_src,
                    org_id=org.id,
                    created_by=admin_user.id
                )
                db.add(ef)
                db.flush()
            factor_objs[f_key] = ef

        # 6. Seed Materials, Products, SKUs, and BOMs
        mat_alum = db.query(Material).filter(Material.name == "Virgin Aluminum 6061").first()
        if not mat_alum:
            mat_alum = Material(
                name="Virgin Aluminum 6061",
                category="Metals",
                recycled_content_pct=0.0,
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(mat_alum)
            
        mat_steel = db.query(Material).filter(Material.name == "Structural Steel").first()
        if not mat_steel:
            mat_steel = Material(
                name="Structural Steel",
                category="Metals",
                recycled_content_pct=15.0,
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(mat_steel)

        mat_recycled_alum = db.query(Material).filter(Material.name == "100% Recycled Eco-Aluminum").first()
        if not mat_recycled_alum:
            mat_recycled_alum = Material(
                name="100% Recycled Eco-Aluminum",
                category="Metals",
                recycled_content_pct=100.0,
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(mat_recycled_alum)

        db.commit()

        prod = db.query(Product).filter(Product.code == "PROD_SENSOR_X").first()
        if not prod:
            prod = Product(
                name="DecarbX Pro Environmental Sensor",
                code="PROD_SENSOR_X",
                category="Consumer Electronics",
                functional_unit="1 Sensor for 5 Years Operation",
                description="Industrial IoT smart emission monitoring sensor unit",
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)

            sku = SKU(
                product_id=prod.id,
                sku_code="SKU-DXS-001",
                name="DecarbX Pro Sensor Standard Pack",
                weight_kg=1.8,
                unit="PCS",
                org_id=org.id
            )
            db.add(sku)

            # BOM Items
            bom1 = BOM(
                product_id=prod.id,
                material_id=mat_alum.id,
                component_name="Aluminum Enclosure Shell",
                quantity=1.2,
                unit="kg",
                loss_rate_pct=5.0,
                org_id=org.id
            )
            bom2 = BOM(
                product_id=prod.id,
                material_id=mat_steel.id,
                component_name="Mounting Bracket",
                quantity=0.5,
                unit="kg",
                loss_rate_pct=2.0,
                org_id=org.id
            )
            db.add_all([bom1, bom2])

            lca = LCA(
                product_id=prod.id,
                name="Cradle-to-Gate LCA Baseline",
                boundary_type="cradle-to-gate",
                system_boundary_description="Includes raw material extraction, refining, and facility assembly",
                org_id=org.id
            )
            db.add(lca)
            db.commit()

        # 7. Seed Suppliers & Questionnaires
        sup_user = db.query(User).filter(User.email == "supplier@acme.com").first()
        if not sup_user:
            sup_user = User(
                email="supplier@acme.com",
                hashed_password=get_password_hash("SupplierPass123!"),
                full_name="Acme Materials Vendor Representative",
                is_active=True
            )
            db.add(sup_user)
            db.commit()
            db.refresh(sup_user)


            supplier_role = db.query(Role).filter(Role.name == "Supplier").first()
            if supplier_role:
                db.add(UserOrgRole(user_id=sup_user.id, org_id=org.id, role_id=supplier_role.id))
                db.commit()

        sup = db.query(Supplier).filter(Supplier.code == "SUP-ACME-001").first()
        if not sup:
            sup = Supplier(
                name="Acme Eco-Materials Corp",
                code="SUP-ACME-001",
                contact_email="supplier@acme.com",
                country="Germany",
                tier="Tier 1",
                category="Raw Materials",
                status="ACTIVE",
                user_id=sup_user.id,
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(sup)
            db.commit()
            db.refresh(sup)

            # Questionnaire Campaign
            q = Questionnaire(
                title="2025 Corporate Scope 3 GHG & Product Carbon Footprint Survey",
                description="Mandatory annual ESG & carbon footprint disclosure campaign for key Tier-1 & Tier-2 suppliers.",
                status="PUBLISHED",
                languages_list=["EN", "DE", "FR", "ES", "ZH", "JA"],
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(q)
            db.commit()
            db.refresh(q)

            # Seed Mongo Template
            template_doc = {
                "postgres_ref_id": q.id,
                "title": q.title,
                "fields": [
                    {"field_id": "scope1_co2e", "label": "Scope 1 Direct CO2e (tCO2e)", "type": "number", "required": True},
                    {"field_id": "scope2_co2e", "label": "Scope 2 Purchased Energy (tCO2e)", "type": "number", "required": True},
                    {"field_id": "renewable_pct", "label": "% Renewable Electricity", "type": "number", "required": False},
                    {"field_id": "evidence_doc", "label": "ISO 14064 Audit Certificate", "type": "file", "required": True}
                ]
            }
            mongo_res = mongo_db.questionnaire_templates.insert_one(template_doc)
            q.mongo_ref_id = str(mongo_res.inserted_id)
            db.commit()

        # 8. Seed Reduction Initiatives & OCR Drafts
        init_solar = db.query(ReductionInitiative).filter(ReductionInitiative.title == "Texas Plant Rooftop Solar PV Installation").first()
        if not init_solar:
            init_solar = ReductionInitiative(
                title="Texas Plant Rooftop Solar PV Installation",
                description="Install 1.5MW rooftop solar PV array to displace 45% of Scope 2 grid electricity.",
                category="Renewable Energy",
                expected_reduction_co2e_kg=350000.0,
                capex_cost_usd=450000.0,
                opex_cost_usd=12000.0,
                abatement_cost_per_tco2e=32.50, # $32.50 / tCO2e avoided
                timeline_year=2026,
                owner_user_id=admin_user.id,
                roi_pct=22.4,
                status="IN_PROGRESS",
                org_id=org.id,
                created_by=admin_user.id
            )
            init_heat = ReductionInitiative(
                title="Industrial Waste Heat Recovery Retrofit",
                description="Capture furnace exhaust heat for facility space heating and hot water pre-heating.",
                category="Energy Efficiency",
                expected_reduction_co2e_kg=180000.0,
                capex_cost_usd=120000.0,
                opex_cost_usd=5000.0,
                abatement_cost_per_tco2e=-15.20, # Negative cost! Saves money over lifespan ($ -15.20 / tCO2e)
                timeline_year=2025,
                owner_user_id=admin_user.id,
                roi_pct=38.0,
                status="PLANNED",
                org_id=org.id,
                created_by=admin_user.id
            )
            init_mat = ReductionInitiative(
                title="Switch Enclosures to 100% Recycled Eco-Aluminum",
                description="Replace virgin aluminum 6061 with certified 100% post-consumer recycled aluminum alloy.",
                category="Material Circularity",
                expected_reduction_co2e_kg=220000.0,
                capex_cost_usd=60000.0,
                opex_cost_usd=15000.0,
                abatement_cost_per_tco2e=18.40,
                timeline_year=2026,
                owner_user_id=admin_user.id,
                roi_pct=19.5,
                status="PLANNED",
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add_all([init_solar, init_heat, init_mat])
            db.commit()

        # Seed AI Anomaly Flag
        anom = db.query(DataQualityFlag).filter(DataQualityFlag.flag_type == "AI_ANOMALY").first()
        if not anom:
            anom = DataQualityFlag(
                org_id=org.id,
                target_entity_type="ActivityData",
                target_entity_id="act-sample-001",
                flag_type="AI_ANOMALY",
                message="Field quantity 12500.0 kWh for Natural Gas exceeds 3-sigma historical mean (3200.0 kWh) by +290%. AI recommends verifying meter reading or checking for pipeline leakage.",
                severity="HIGH",
                status="OPEN",
                created_by=admin_user.id
            )
            db.add(anom)
            db.commit()


        # 9. Seed Carbon Finance Data
        budget = db.query(CarbonBudget).filter(CarbonBudget.fiscal_year == 2026).first()
        if not budget:
            fac = db.query(Facility).filter(Facility.org_id == org.id).first()
            budget = CarbonBudget(
                facility_id=fac.id if fac else None,
                fiscal_year=2026,
                allocated_co2e_kg=250000.0,
                consumed_co2e_kg=157500.0,
                status="ON_TRACK",
                linked_initiative_id=init_solar.id if init_solar else None,
                org_id=org.id,
                created_by=admin_user.id
            )

            icp_shadow = InternalCarbonPrice(
                scenario_name="Corporate Shadow Carbon Price",
                price_per_tco2e_usd=85.00,
                price_type="SHADOW_PRICE",
                effective_year=2026,
                scope_coverage="Scope 1, Scope 2, Scope 3",
                org_id=org.id,
                created_by=admin_user.id
            )
            icp_fee = InternalCarbonPrice(
                scenario_name="Internal Carbon Fee (CapEx Re-investment)",
                price_per_tco2e_usd=35.00,
                price_type="CARBON_FEE",
                effective_year=2026,
                scope_coverage="Scope 1, Scope 2",
                org_id=org.id,
                created_by=admin_user.id
            )
            offset1 = CreditOffset(
                project_name="Rimba Raya Biodiversity Reserve REDD+ Project",
                registry="Verra VCS",
                serial_number="VCS-1184-2025-001-99823",
                quantity_tco2e=500.0,
                cost_per_tco2e_usd=18.50,
                status="ACTIVE",
                org_id=org.id,
                created_by=admin_user.id
            )
            offset2 = CreditOffset(
                project_name="Northern Kenya Rangeland Carbon Project",
                registry="Gold Standard",
                serial_number="GS-4820-2024-884-10294",
                quantity_tco2e=250.0,
                cost_per_tco2e_usd=24.00,
                status="RETIRED",
                retirement_date=datetime.now(timezone.utc),
                retirement_evidence_url="https://registry.goldstandard.org/credit-res/GS-4820-2024-884",
                org_id=org.id,
                created_by=admin_user.id
            )
            tcfd1 = TCFDFinancialImpact(
                risk_category="TRANSITION_POLICY",
                scenario_climate="1.5C_NET_ZERO",
                estimated_financial_loss_usd=450000.0,
                mitigation_strategy="Accelerate Scope 2 renewable PPA procurement to eliminate carbon tax liability.",
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add_all([budget, icp_shadow, icp_fee, offset1, offset2, tcfd1])
            db.commit()

        # 10. Seed Regulatory Compliance Frameworks & Disclosures
        fw_csrd = db.query(Framework).filter(Framework.name == "CSRD_ESRS").first()
        if not fw_csrd:
            fw_csrd = Framework(name="CSRD_ESRS", version="ESRS-2024.1", description="EU Corporate Sustainability Reporting Directive", org_id=org.id, created_by=admin_user.id)
            fw_cbam = Framework(name="CBAM", version="EU-2026.1", description="EU Carbon Border Adjustment Mechanism", org_id=org.id, created_by=admin_user.id)
            fw_tcfd = Framework(name="TCFD", version="2023.1", description="Task Force on Climate-related Financial Disclosures", org_id=org.id, created_by=admin_user.id)
            fw_tax = Framework(name="EU_TAXONOMY", version="2024.2", description="EU Sustainable Finance Taxonomy Alignment", org_id=org.id, created_by=admin_user.id)
            fw_sec = Framework(name="SEC_CLIMATE", version="SEC-2024.1", description="US SEC Climate-Related Disclosure Rules", org_id=org.id, created_by=admin_user.id)
            fw_cdp = Framework(name="CDP", version="2025.1", description="Carbon Disclosure Project Climate Questionnaire", org_id=org.id, created_by=admin_user.id)
            db.add_all([fw_csrd, fw_cbam, fw_tcfd, fw_tax, fw_sec, fw_cdp])
            db.commit()

        # Seed sample CSRD disclosure draft
        disc_csrd = db.query(Disclosure).filter(Disclosure.reporting_year == 2026).first()
        if not disc_csrd and fw_csrd:
            disc_csrd = Disclosure(
                framework_id=fw_csrd.id,
                reporting_year=2026,
                status="DRAFT",
                double_materiality_json={
                    "climate_change_mitigation": {"impact_materiality": True, "financial_materiality": True, "score": "HIGH"},
                    "circular_economy": {"impact_materiality": True, "financial_materiality": False, "score": "MEDIUM"}
                },
                transition_plan_json={
                    "target_year": 2030,
                    "interim_reduction_pct": 45.0,
                    "decarbonization_levers": ["Scope 2 PPA Solar", "Scope 3 Supplier Engagement"],
                    "sbti_aligned": True
                },
                org_id=org.id,
                created_by=admin_user.id
            )
            db.add(disc_csrd)
            db.commit()

            # Seed sample DataPoints with XBRL tags
            calc_sample = db.query(Calculation).first()
            if calc_sample:
                dp1 = DisclosureDataPoint(
                    disclosure_id=disc_csrd.id,
                    section="ESRS E1-6 Gross Scopes 1, 2, 3 Emissions",
                    requirement_code="ESRS_E1_6_SCOPE1",
                    xbrl_tag="esrs-e1:GrossScope1GHGEmissions",
                    source_record_type="CALCULATION",
                    source_record_id=calc_sample.id,
                    lineage_id=calc_sample.lineage_id,
                    value_json={"co2e_kg": calc_sample.calculated_co2e_kg, "scope": "Scope 1"},
                    verification_status="VERIFIED_INTERNAL",
                    org_id=org.id,
                    created_by=admin_user.id
                )
                db.add(dp1)
                db.commit()

        # 11. Seed Integration Connections & Field Mappings (Module 7)
        conn_csv = db_session.query(IntegrationConnection).filter(IntegrationConnection.name == "Utility Meter CSV Feed").first()
        if not conn_csv:
            org_item = db_session.query(Organization).first()
            admin_item = db_session.query(User).filter(User.email == "admin@nexgile.com").first()

            conn_csv = IntegrationConnection(
                id="conn-csv-001",
                name="Utility Meter CSV Feed",
                system_type="CSV_FILE",
                credentials_vault_ref="vault://enc_csv_key_stub",
                status="ACTIVE",
                org_id=org_item.id,
                created_by=admin_item.id
            )
            db_session.add(conn_csv)

            conn_sap = IntegrationConnection(
                id="conn-sap-001",
                name="SAP S/4HANA ERP Connector",
                system_type="REST_API",
                credentials_vault_ref="vault://enc_sap_oauth_token",
                status="ACTIVE",
                org_id=org_item.id,
                created_by=admin_item.id
            )
            db_session.add(conn_sap)
            db_session.commit()

            mapping_csv = FieldMapping(
                id="map-csv-001",
                connection_id=conn_csv.id,
                target_entity="ActivityData",
                mapping_json={
                    "kwh_used": "quantity",
                    "fuel_type": "activity_type",
                    "scope_type": "scope",
                    "unit_type": "unit"
                },
                org_id=org_item.id,
                created_by=admin_item.id
            )
            db_session.add(mapping_csv)
            db_session.commit()


        print("Database successfully seeded with initial roles, permissions, default org, facilities, emission factors, materials, products, suppliers, reduction initiatives, carbon budgets, regulatory frameworks, integration connections, and superadmin!")

    finally:
        if should_close:
            db.close()






if __name__ == "__main__":
    seed_db()
