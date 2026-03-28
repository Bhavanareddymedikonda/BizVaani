"""Dashboard route — real DB queries.

GET /api/dashboard → aggregated shop data: products, alerts, totals.
Ref: BACKEND_STRUCTURE.md Section 4 (GET /api/dashboard)
"""
from datetime import date, datetime, time, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.models import Shop, Product, SalesEntry, MarketPrice, MLForecast, User, StockTransaction
from core.auth_utils import get_current_user, TokenData
from services.inventory import stock_status

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shop_id = current_user.shop_id
    today = date.today()
    today_start = datetime.combine(today, time.min)

    # Fetch shop
    shop_result = await db.execute(select(Shop).where(Shop.id == shop_id))
    shop = shop_result.scalar_one_or_none()
    if not shop:
        return {"error": "Shop not found"}

    user_result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = user_result.scalar_one_or_none()

    # Fetch products
    products_result = await db.execute(
        select(Product).where(Product.shop_id == shop_id)
    )
    products = products_result.scalars().all()

    # Today's sales per product
    today_sales = await db.execute(
        select(
            SalesEntry.product_id,
            func.sum(SalesEntry.quantity_sold).label("today_qty"),
            func.sum(SalesEntry.revenue).label("today_revenue"),
        )
        .where(and_(SalesEntry.shop_id == shop_id, SalesEntry.entry_date == today))
        .group_by(SalesEntry.product_id)
    )
    today_map = {row.product_id: {"qty": float(row.today_qty), "rev": float(row.today_revenue)} for row in today_sales}

    today_stock_sales = await db.execute(
        select(
            StockTransaction.product_id,
            func.sum(func.abs(StockTransaction.quantity_delta)).label("today_qty"),
            func.sum(func.abs(StockTransaction.quantity_delta) * func.coalesce(StockTransaction.unit_price, 0)).label("today_revenue"),
        )
        .where(
            and_(
                StockTransaction.shop_id == shop_id,
                StockTransaction.created_at >= today_start,
                StockTransaction.transaction_type.in_(["sale", "invoice_sale"]),
            )
        )
        .group_by(StockTransaction.product_id)
    )
    today_tx_map = {
        row.product_id: {
            "qty": float(row.today_qty or 0),
            "rev": float(row.today_revenue or 0),
        }
        for row in today_stock_sales
    }

    # 7-day-ago sales per product (for trend calculation)
    week_ago = today - timedelta(days=7)
    week_ago_sales = await db.execute(
        select(
            SalesEntry.product_id,
            func.sum(SalesEntry.quantity_sold).label("qty"),
        )
        .where(and_(SalesEntry.shop_id == shop_id, SalesEntry.entry_date == week_ago))
        .group_by(SalesEntry.product_id)
    )
    week_ago_map = {row.product_id: float(row.qty) for row in week_ago_sales}

    # Latest market prices for the shop's district
    market_result = await db.execute(
        select(MarketPrice)
        .where(MarketPrice.district == shop.district)
        .order_by(MarketPrice.price_date.desc())
    )
    market_prices = market_result.scalars().all()
    mandi_map = {mp.commodity: mp.modal_price for mp in market_prices}

    # Forecasts for risk detection
    forecast_result = await db.execute(
        select(MLForecast)
        .where(and_(MLForecast.shop_id == shop_id, MLForecast.forecast_date == today))
    )
    forecasts = forecast_result.scalars().all()
    forecast_map = {f.product_id: f for f in forecasts}

    # Build product cards
    top_products = []
    total_revenue = 0.0
    total_items = 0.0
    total_profit = 0.0
    low_stock_count = 0
    inventory_value = 0.0

    for p in products:
        t = today_map.get(p.id)
        if not t:
            t = today_tx_map.get(p.id, {"qty": 0, "rev": 0})
        wa_qty = week_ago_map.get(p.id, t["qty"] if t["qty"] else 1)
        trend_pct = round(((t["qty"] - wa_qty) / wa_qty) * 100, 1) if wa_qty else 0
        avg_daily_qty = t["qty"] / 7 if t["qty"] else 0
        minimum_required = max(avg_daily_qty * 3, 5)
        stock_level = float(p.stock_qty or 0)
        stock_state = stock_status(stock_level, minimum_required)

        # Risk level from forecast
        forecast = forecast_map.get(p.id)
        if forecast and forecast.is_anomaly:
            risk_level = "HIGH"
        elif trend_pct < -15:
            risk_level = "HIGH"
        elif trend_pct < -5:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        mandi_price = mandi_map.get(p.agmarknet_commodity, p.cost_price or p.selling_price * 0.85)

        top_products.append({
            "id": p.id,
            "name": p.name,
            "today_qty": int(t["qty"]),
            "today_revenue": round(t["rev"]),
            "stock_qty": round(stock_level, 2),
            "stock_status": stock_state,
            "unit": p.unit,
            "trend_pct": trend_pct,
            "mandi_price": round(mandi_price, 1),
            "risk_level": risk_level,
        })

        total_revenue += t["rev"]
        total_items += t["qty"]
        inventory_value += stock_level * float(p.cost_price or p.selling_price or 0)
        if p.cost_price:
            total_profit += (p.selling_price - p.cost_price) * t["qty"]
        if stock_state != "IN_STOCK":
            low_stock_count += 1

    # Build alerts from HIGH risk products
    alerts = []
    for product_card in top_products:
        if product_card["risk_level"] == "HIGH":
            alerts.append({
                "id": product_card["id"],
                "product_name": product_card["name"],
                "severity": "HIGH",
                "message": f"Sales {'dropped' if product_card['trend_pct'] < 0 else 'spiked'} {abs(product_card['trend_pct'])}% vs last week",
                "created_at": today.isoformat(),
            })
        elif product_card["risk_level"] == "MEDIUM":
            alerts.append({
                "id": product_card["id"],
                "product_name": product_card["name"],
                "severity": "MEDIUM",
                "message": f"Sales trend at {product_card['trend_pct']}% — watch closely",
                "created_at": today.isoformat(),
            })

    # Sort products by revenue descending
    top_products.sort(key=lambda x: x["today_revenue"], reverse=True)

    return {
        "shop": {
            "id": shop.id,
            "shop_name": shop.shop_name,
            "city": shop.district,
            "categories": shop.categories,
        },
        "user": {
            "id": user.id if user else current_user.user_id,
            "name": user.name if user else "Owner",
        },
        "top_products": top_products[:10],
        "alerts": alerts,
        "total_today": {
            "revenue": round(total_revenue),
            "items_sold": int(total_items),
            "profit_estimate": round(total_profit),
        },
        "stock_summary": {
            "sku_count": len(products),
            "low_stock_count": low_stock_count,
            "inventory_value": round(inventory_value),
        },
    }
