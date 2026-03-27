"""SQLAlchemy ORM models — 7 tables matching BACKEND_STRUCTURE.md"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime,
    ForeignKey, UniqueConstraint, Index
)
from db.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(15), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False)
    language = Column(String(5), default="en")
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Shop(Base):
    __tablename__ = "shops"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shop_name = Column(String(255), nullable=False)
    city = Column(String(50), nullable=False)
    categories = Column(Text, default="[]")  # JSON array as text
    gstin = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    unit = Column(String(20), default="kg")
    selling_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=True)
    stock_qty = Column(Float, default=0)
    agmarknet_commodity = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SalesEntry(Base):
    __tablename__ = "sales_entries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    entry_date = Column(DateTime, nullable=False)
    entry_source = Column(String(20), default="voice")  # voice | csv | ocr | benchmark
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("shop_id", "product_id", "entry_date", name="uq_shop_product_date"),
        Index("idx_sales_shop_date", "shop_id", "entry_date"),
    )


class MLForecast(Base):
    __tablename__ = "ml_forecasts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    forecast_date = Column(DateTime, nullable=False)
    predicted_qty = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_pct = Column(Float, default=0)
    model_version = Column(String(20), default="xgb-v1")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_forecast_shop_product", "shop_id", "product_id"),
    )


class MarketPrice(Base):
    __tablename__ = "market_prices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    commodity = Column(String(100), nullable=False)
    city = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    source = Column(String(20), default="agmarknet")  # agmarknet | tavily | user_report
    fetched_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_market_commodity_city", "commodity", "city"),
    )


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    items = Column(Text, nullable=False)  # JSON array as text
    subtotal = Column(Float, nullable=False)
    cgst = Column(Float, nullable=False)
    sgst = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    pdf_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_invoices_shop_id", "shop_id"),
    )
