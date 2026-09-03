from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.models.audit import AuditBase

class Product(AuditBase):
    __tablename__ = "products"
    
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=False, unique=True)
    category = Column(String(100), nullable=False) # Consumer Electronics, Automotive, Apparel, Industrial
    functional_unit = Column(String(100), default="1 Unit")
    description = Column(Text, nullable=True)

    skus = relationship("SKU", back_populates="product", cascade="all, delete-orphan")
    boms = relationship("BOM", back_populates="product", cascade="all, delete-orphan")
    lcas = relationship("LCA", back_populates="product", cascade="all, delete-orphan")
    pcfs = relationship("PCF", back_populates="product", cascade="all, delete-orphan")

class SKU(AuditBase):
    __tablename__ = "skus"
    
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku_code = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    weight_kg = Column(Float, nullable=False, default=1.0)
    unit = Column(String(20), default="PCS")

    product = relationship("Product", back_populates="skus")

class Material(AuditBase):
    __tablename__ = "materials"
    
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # Metals, Plastics, Bio-based, Textiles
    default_emission_factor_id = Column(String(36), ForeignKey("emission_factors.id"), nullable=True)
    recycled_content_pct = Column(Float, default=0.0)

    default_emission_factor = relationship("EmissionFactor")

class Process(AuditBase):
    __tablename__ = "processes"
    
    name = Column(String(255), nullable=False)
    process_type = Column(String(100), nullable=False) # Manufacturing, Machining, Injection Molding, Assembly
    energy_kwh_per_unit = Column(Float, default=0.0)
    default_emission_factor_id = Column(String(36), ForeignKey("emission_factors.id"), nullable=True)

class Route(AuditBase):
    __tablename__ = "routes"
    
    name = Column(String(255), nullable=False)
    transport_mode = Column(String(50), nullable=False) # Road, Sea, Air, Rail
    distance_km = Column(Float, nullable=False)
    weight_tonnes = Column(Float, default=1.0)

class Packaging(AuditBase):
    __tablename__ = "packagings"
    
    name = Column(String(255), nullable=False)
    material_type = Column(String(100), nullable=False) # Cardboard, PET Plastic, Wood, Aluminum
    weight_kg = Column(Float, nullable=False)
    recyclable_pct = Column(Float, default=100.0)

class FunctionalUnit(AuditBase):
    __tablename__ = "functional_units"
    
    name = Column(String(255), nullable=False) # e.g. "1 Smartphone for 3 Years of Use"
    amount = Column(Float, default=1.0)
    unit = Column(String(50), default="unit")
    description = Column(Text, nullable=True)

class BOM(AuditBase):
    __tablename__ = "boms"
    
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_bom_id = Column(String(36), ForeignKey("boms.id"), nullable=True) # For nested sub-assemblies
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=True)
    component_name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False) # e.g. kg, grams, PCS
    loss_rate_pct = Column(Float, default=0.0) # Manufacturing scrap / scrap rate

    product = relationship("Product", back_populates="boms")
    material = relationship("Material")
    parent_bom = relationship("BOM", remote_side="BOM.id", backref="sub_components")

class LCA(AuditBase):
    __tablename__ = "lcas"
    
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    boundary_type = Column(String(50), nullable=False, default="cradle-to-gate") # cradle-to-gate, gate-to-gate, cradle-to-grave
    functional_unit_id = Column(String(36), ForeignKey("functional_units.id"), nullable=True)
    system_boundary_description = Column(Text, nullable=True)

    product = relationship("Product", back_populates="lcas")

class PCF(AuditBase):
    __tablename__ = "pcfs"
    
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku_id = Column(String(36), ForeignKey("skus.id"), nullable=True)
    lca_id = Column(String(36), ForeignKey("lcas.id"), nullable=True)
    
    total_co2e_kg = Column(Float, nullable=False)
    material_co2e_kg = Column(Float, default=0.0)
    manufacturing_co2e_kg = Column(Float, default=0.0)
    packaging_co2e_kg = Column(Float, default=0.0)
    transport_co2e_kg = Column(Float, default=0.0)
    energy_co2e_kg = Column(Float, default=0.0)
    eol_co2e_kg = Column(Float, default=0.0)
    
    lineage_id = Column(String(36), nullable=False, index=True)
    status = Column(String(50), default="APPROVED") # APPROVED, SUPERSEDED
    
    product = relationship("Product", back_populates="pcfs")

class ScenarioPCF(AuditBase):
    __tablename__ = "scenario_pcf" # Strict scenario_ prefix convention
    
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    forked_from_pcf_id = Column(String(36), ForeignKey("pcfs.id"), nullable=False, index=True)
    scenario_name = Column(String(255), nullable=False)
    alternative_material_id = Column(String(36), ForeignKey("materials.id"), nullable=True)
    
    total_co2e_kg = Column(Float, nullable=False)
    reduction_co2e_kg = Column(Float, nullable=False)
    reduction_pct = Column(Float, nullable=False)
    assumptions_json = Column(JSON, default=dict)
