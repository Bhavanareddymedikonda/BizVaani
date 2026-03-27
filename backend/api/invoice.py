"""Invoice routes."""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class InvoiceItem(BaseModel):
    product: str
    qty: float
    unit_price: float
    gst_rate: float = 5


class GenerateInvoiceRequest(BaseModel):
    shop_id: int
    customer_name: str
    items: list[InvoiceItem]


@router.post("/generate")
async def generate_invoice(req: GenerateInvoiceRequest):
    # TODO: Calculate GST, generate PDF with ReportLab, save to DB
    subtotal = sum(i.qty * i.unit_price for i in req.items)
    avg_gst = sum(i.gst_rate for i in req.items) / len(req.items) if req.items else 5
    gst_amount = subtotal * (avg_gst / 100)
    return {
        "invoice_id": "INV-001",
        "pdf_url": "/api/invoice/1/pdf",
        "total": subtotal + gst_amount,
        "gst_breakup": {"cgst": gst_amount / 2, "sgst": gst_amount / 2},
    }


@router.get("/{invoice_id}/pdf")
async def get_invoice_pdf(invoice_id: str):
    # TODO: Return actual PDF file
    return {"message": f"PDF for invoice {invoice_id} — implement ReportLab generation"}
