"""Auth routes: register + login."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter()


class RegisterRequest(BaseModel):
    phone: str
    name: str
    password: str
    city: str
    state: str
    language: str = "en"
    shop_name: str
    categories: list[str] = []


class LoginRequest(BaseModel):
    phone: str
    password: str


@router.post("/register")
async def register(req: RegisterRequest):
    # TODO: Hash password, create user + shop, generate JWT
    return {
        "access_token": "mock-jwt-token",
        "user": {"id": 1, "name": req.name, "city": req.city},
        "shop": {"id": 1, "shop_name": req.shop_name},
    }


@router.post("/login")
async def login(req: LoginRequest):
    # TODO: Verify credentials, return JWT
    return {
        "access_token": "mock-jwt-token",
        "user": {"id": 1, "name": "Ramesh Kumar", "city": "Nagpur"},
        "shop": {"id": 1, "shop_name": "Ramesh Kirana Store"},
    }
