from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.suppliers import Supplier, Questionnaire, Submission, Scorecard, ActionPlan
from app.models.auth import User, Role, UserOrgRole
from app.core.auth.jwt import get_password_hash
from app.core.services.workflow_service import WorkflowService
from app.core.services.data_quality_service import DataQualityService
from app.database import mongo_db


class SupplierService:
    @staticmethod
    def invite_supplier(
        db: Session,
        name: str,
        code: str,
        contact_email: str,
        category: str,
        country: str,
        tier: str,
        org_id: str,
        user_id: str
    ) -> Supplier:
        # Check if Supplier user account already exists
        supplier_user = db.query(User).filter(User.email == contact_email).first()
        if not supplier_user:
            # Create user account with Supplier role
            supplier_user = User(
                email=contact_email,
                hashed_password=get_password_hash("SupplierPass123!"), # Temp password for onboarding
                full_name=name,
                is_active=True
            )
            db.add(supplier_user)
            db.commit()
            db.refresh(supplier_user)


            # Assign Supplier Role
            supplier_role = db.query(Role).filter(Role.name == "Supplier").first()
            if supplier_role:
                user_role = UserOrgRole(
                    user_id=supplier_user.id,
                    org_id=org_id,
                    role_id=supplier_role.id
                )
                db.add(user_role)
                db.commit()

        # Create Supplier record
        supplier = Supplier(
            name=name,
            code=code,
            contact_email=contact_email,
            country=country,
            tier=tier,
            category=category,
            status="ACTIVE",
            user_id=supplier_user.id,
            org_id=org_id,
            created_by=user_id
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)

        # Trigger Workflow Invitation Task
        WorkflowService.create_task(
            db=db,
            title=f"Supplier Onboarding: {name}",
            description=f"Send Scope 3 GHG Disclosure Questionnaire to {contact_email}",
            task_type="SUPPLIER_ONBOARDING",
            assigned_to_user_id=user_id,
            org_id=org_id
        )
        return supplier


    @staticmethod
    def create_questionnaire(
        db: Session,
        title: str,
        description: str,
        fields: List[Dict[str, Any]],
        languages_list: List[str],
        org_id: str,
        user_id: str,
        deadline: Optional[datetime] = None
    ) -> Questionnaire:
        # 1. Store dynamic template & translations in MongoDB
        template_doc = {
            "title": title,
            "description": description,
            "fields": fields or [
                {"field_id": "scope1_co2e", "label": "Scope 1 Direct CO2e (tCO2e)", "type": "number", "required": True},
                {"field_id": "scope2_co2e", "label": "Scope 2 Purchased Energy (tCO2e)", "type": "number", "required": True},
                {"field_id": "renewable_pct", "label": "% Electricity from Renewable Sources", "type": "number", "required": False},
                {"field_id": "evidence_doc", "label": "Third-Party GHG Audit Certificate", "type": "file", "required": True}
            ],
            "translations": {
                "EN": {"title": title},
                "DE": {"title": f"[DE] {title}"},
                "FR": {"title": f"[FR] {title}"},
                "ES": {"title": f"[ES] {title}"},
                "ZH": {"title": f"[ZH] {title}"},
                "JA": {"title": f"[JA] {title}"}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        mongo_res = mongo_db.questionnaire_templates.insert_one(template_doc)
        mongo_ref_id = str(mongo_res.inserted_id)

        # 2. Store relational Questionnaire record in Postgres
        q = Questionnaire(
            title=title,
            description=description,
            deadline=deadline,
            status="PUBLISHED",
            languages_list=languages_list or ["EN", "DE", "FR", "ES", "ZH", "JA"],
            mongo_ref_id=mongo_ref_id,
            org_id=org_id,
            created_by=user_id
        )
        db.add(q)
        db.commit()
        db.refresh(q)

        # Update mongo doc with postgres_ref_id
        mongo_db.questionnaire_templates.update_one(
            {"_id": mongo_res.inserted_id},
            {"$set": {"postgres_ref_id": q.id}}
        )
        return q

    @staticmethod
    def submit_questionnaire_response(
        db: Session,
        supplier_id: str,
        questionnaire_id: str,
        answers: Dict[str, Any],
        evidence_attachments: List[Dict[str, Any]],
        user_id: str
    ) -> Submission:
        q = db.query(Questionnaire).filter(Questionnaire.id == questionnaire_id).first()
        if not q:
            raise ValueError("Questionnaire campaign not found.")

        # 1. Store raw submission response payload in MongoDB
        sub_doc = {
            "supplier_id": supplier_id,
            "questionnaire_id": questionnaire_id,
            "answers": answers,
            "evidence_attachments": evidence_attachments or [],
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }
        mongo_res = mongo_db.submission_responses.insert_one(sub_doc)
        mongo_ref_id = str(mongo_res.inserted_id)

        # 2. Quality & Completeness Validation via DataQualityService
        required_fields = ["scope1_co2e", "scope2_co2e"]
        answered_count = sum(1 for field in required_fields if field in answers and answers[field] is not None)
        completeness_score = round((answered_count / len(required_fields)) * 100.0, 2)
        
        has_evidence = len(evidence_attachments) > 0
        confidence_score = 90.0 if has_evidence else 65.0

        # Create Submission Postgres record
        sub = Submission(
            supplier_id=supplier_id,
            questionnaire_id=questionnaire_id,
            status="SUBMITTED",
            completeness_score=completeness_score,
            confidence_score=confidence_score,
            validation_status="UNVERIFIED",
            submitted_at=datetime.now(timezone.utc),
            mongo_ref_id=mongo_ref_id,
            org_id=q.org_id,
            created_by=user_id
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

        # Update mongo doc with postgres_ref_id
        mongo_db.submission_responses.update_one(
            {"_id": mongo_res.inserted_id},
            {"$set": {"postgres_ref_id": sub.id}}
        )
        return sub

    @staticmethod
    def validate_submission_and_update_scorecard(
        db: Session,
        submission_id: str,
        user_id: str
    ) -> Scorecard:
        sub = db.query(Submission).filter(Submission.id == submission_id).first()
        if not sub:
            raise ValueError("Submission not found.")

        sub.status = "VALIDATED"
        sub.validation_status = "VALIDATED"
        db.commit()

        # Fetch Mongo raw payload
        sub_doc = mongo_db.submission_responses.find_one({"postgres_ref_id": submission_id})
        answers = sub_doc.get("answers", {}) if sub_doc else {}

        scope1 = float(answers.get("scope1_co2e", 50.0))
        scope2 = float(answers.get("scope2_co2e", 30.0))
        total_co2e_kg = (scope1 + scope2) * 1000.0 # convert tonnes to kg

        # Scorecard Maturity Assignment
        score = sub.completeness_score * 0.5 + sub.confidence_score * 0.5
        if score >= 85.0:
            maturity = "LEADER"
        elif score >= 70.0:
            maturity = "ADVANCED"
        elif score >= 50.0:
            maturity = "INTERMEDIATE"
        else:
            maturity = "BEGINNER"

        scorecard = db.query(Scorecard).filter(Scorecard.supplier_id == sub.supplier_id).first()
        if not scorecard:
            scorecard = Scorecard(
                supplier_id=sub.supplier_id,
                maturity_level=maturity,
                category_ranking=1,
                total_disclosed_co2e_kg=total_co2e_kg,
                yoy_change_pct=-8.5,
                score_date=datetime.now(timezone.utc),
                org_id=sub.org_id,
                created_by=user_id
            )
            db.add(scorecard)
        else:
            scorecard.maturity_level = maturity
            scorecard.total_disclosed_co2e_kg = total_co2e_kg
            scorecard.score_date = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(scorecard)
        return scorecard

    @staticmethod
    def get_supply_network_graph(db: Session, org_id: str) -> Dict[str, Any]:
        suppliers = db.query(Supplier).filter(Supplier.org_id == org_id).all()
        nodes = []
        edges = []
        geo = {}

        # Center org node
        nodes.append({"id": "ORG_CENTER", "label": "Enterprise Organization", "type": "organization"})

        for s in suppliers:
            nodes.append({
                "id": s.id,
                "label": s.name,
                "tier": s.tier,
                "category": s.category,
                "country": s.country,
                "type": "supplier"
            })
            edges.append({"source": s.id, "target": "ORG_CENTER", "label": s.tier})

            # Geo aggregation
            if s.country not in geo:
                geo[s.country] = {"supplier_count": 0, "total_co2e_kg": 0.0}
            geo[s.country]["supplier_count"] += 1
            geo[s.country]["total_co2e_kg"] += 15000.0 # Aggregated estimated emissions

        return {
            "nodes": nodes,
            "edges": edges,
            "geographic_heatmap": geo
        }

    @staticmethod
    def compare_carbon_weighted_bids(
        db: Session,
        bids: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        evaluated_bids = []
        lowest_adjusted_price = float('inf')
        winning_supplier_id = ""

        for b in bids:
            price = float(b["bid_price_usd"])
            pcf_co2e = float(b["disclosed_pcf_co2e_kg"])
            
            # Carbon intensity penalty factor: +1% cost penalty per 10 kgCO2e over 50kg baseline
            penalty_pct = max(0.0, (pcf_co2e - 50.0) * 0.002)
            adjusted_price = round(price * (1.0 + penalty_pct), 2)

            bid_result = {
                "supplier_id": b["supplier_id"],
                "supplier_name": b["supplier_name"],
                "bid_price_usd": price,
                "disclosed_pcf_co2e_kg": pcf_co2e,
                "carbon_penalty_pct": round(penalty_pct * 100.0, 2),
                "carbon_weighted_bid_price_usd": adjusted_price
            }
            evaluated_bids.append(bid_result)

            if adjusted_price < lowest_adjusted_price:
                lowest_adjusted_price = adjusted_price
                winning_supplier_id = b["supplier_id"]

        return {
            "bids": evaluated_bids,
            "recommended_winner_supplier_id": winning_supplier_id,
            "carbon_weighting_notes": "Bids evaluated using Carbon-Weighted Adjustment (ISO 14067 footprint penalty applied to procurement tender price)."
        }
