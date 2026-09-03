from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.tenant import Organization, Entity, Facility
from app.models.auth import User, Role, Permission, UserOrgRole, role_permissions
from app.models.lineage import LineageRecord
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

        print("Database successfully seeded with initial roles, permissions, default org, facilities, and superadmin!")
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_db()
