"""Settings routes — CSV upload (post-onboarding)."""
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter()


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    # TODO: Read with pandas, detect columns, return preview
    return {
        "preview_rows": [
            {"date": "2026-03-01", "product": "Rice", "qty": 30, "price": 45},
            {"date": "2026-03-01", "product": "Dal", "qty": 15, "price": 80},
            {"date": "2026-03-02", "product": "Rice", "qty": 28, "price": 45},
        ],
        "detected_columns": {"date": "Date", "product": "Product", "qty": "Quantity", "price": "Price"},
        "row_count": 90,
    }


class ConfirmCSVRequest(BaseModel):
    file_id: str
    column_mapping: dict


@router.post("/csv/confirm")
async def confirm_csv_import(req: ConfirmCSVRequest):
    # TODO: Import data into sales_entries, trigger ML retrain
    return {"imported_count": 90, "ml_retrain_triggered": True}
