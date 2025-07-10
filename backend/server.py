from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

app = FastAPI(title="Bina Business Tracker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/bina_db")
client = MongoClient(mongo_url)
db = client.get_database()

# Collections
users_collection = db.users
products_collection = db.products
sales_collection = db.sales
customers_collection = db.customers

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-here")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

class Product(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    category: str
    image_base64: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: datetime

class ProductCreate(BaseModel):
    name: str
    price: float
    quantity: int
    category: str
    image_base64: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    image_base64: Optional[str] = None

class Sale(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity_sold: int
    unit_price: float
    total_amount: float
    customer_id: Optional[str] = None
    user_id: str
    created_at: datetime

class SaleCreate(BaseModel):
    product_id: str
    quantity_sold: int
    unit_price: float
    customer_id: Optional[str] = None

class Customer(BaseModel):
    id: str
    full_name: str
    phone_number: str
    address: str
    gender: str
    referral_source: str
    user_id: str
    created_at: datetime

class CustomerCreate(BaseModel):
    full_name: str
    phone_number: str
    address: str
    gender: str
    referral_source: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

# API Routes
@app.get("/")
async def root():
    return {"message": "Bina Business Tracker API is running!"}

@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    users_collection.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"]
    )

# Products API
@app.get("/api/products", response_model=List[Product])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = list(products_collection.find({"user_id": current_user["id"]}))
    return [Product(**product) for product in products]

@app.post("/api/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        "name": product_data.name,
        "price": product_data.price,
        "quantity": product_data.quantity,
        "category": product_data.category,
        "image_base64": product_data.image_base64,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    products_collection.insert_one(product_doc)
    return Product(**product_doc)

@app.put("/api/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    product = products_collection.find_one({"id": product_id, "user_id": current_user["id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        products_collection.update_one(
            {"id": product_id, "user_id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated_product = products_collection.find_one({"id": product_id, "user_id": current_user["id"]})
    return Product(**updated_product)

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = products_collection.delete_one({"id": product_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Sales API
@app.get("/api/sales", response_model=List[Sale])
async def get_sales(current_user: dict = Depends(get_current_user)):
    sales = list(sales_collection.find({"user_id": current_user["id"]}))
    return [Sale(**sale) for sale in sales]

@app.post("/api/sales", response_model=Sale)
async def create_sale(sale_data: SaleCreate, current_user: dict = Depends(get_current_user)):
    # Check if product exists and has enough stock
    product = products_collection.find_one({"id": sale_data.product_id, "user_id": current_user["id"]})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["quantity"] < sale_data.quantity_sold:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Create sale record
    sale_id = str(uuid.uuid4())
    total_amount = sale_data.quantity_sold * sale_data.unit_price
    sale_doc = {
        "id": sale_id,
        "product_id": sale_data.product_id,
        "product_name": product["name"],
        "quantity_sold": sale_data.quantity_sold,
        "unit_price": sale_data.unit_price,
        "total_amount": total_amount,
        "customer_id": sale_data.customer_id,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    sales_collection.insert_one(sale_doc)
    
    # Update product quantity
    new_quantity = product["quantity"] - sale_data.quantity_sold
    products_collection.update_one(
        {"id": sale_data.product_id, "user_id": current_user["id"]},
        {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
    )
    
    return Sale(**sale_doc)

@app.get("/api/sales/analytics")
async def get_sales_analytics(current_user: dict = Depends(get_current_user)):
    # Get sales for the current user
    sales = list(sales_collection.find({"user_id": current_user["id"]}))
    
    # Calculate total sales
    total_sales = sum(sale["total_amount"] for sale in sales)
    
    # Get sales by date for chart
    sales_by_date = {}
    for sale in sales:
        date_str = sale["created_at"].strftime("%Y-%m-%d")
        sales_by_date[date_str] = sales_by_date.get(date_str, 0) + sale["total_amount"]
    
    # Get top selling products
    product_sales = {}
    for sale in sales:
        product_id = sale["product_id"]
        if product_id not in product_sales:
            product_sales[product_id] = {
                "product_name": sale["product_name"],
                "quantity_sold": 0,
                "total_revenue": 0
            }
        product_sales[product_id]["quantity_sold"] += sale["quantity_sold"]
        product_sales[product_id]["total_revenue"] += sale["total_amount"]
    
    top_products = sorted(product_sales.values(), key=lambda x: x["quantity_sold"], reverse=True)[:5]
    
    return {
        "total_sales": total_sales,
        "sales_by_date": sales_by_date,
        "top_products": top_products,
        "total_orders": len(sales)
    }

# Customers API
@app.get("/api/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    customers = list(customers_collection.find({"user_id": current_user["id"]}))
    return [Customer(**customer) for customer in customers]

@app.post("/api/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: dict = Depends(get_current_user)):
    customer_id = str(uuid.uuid4())
    customer_doc = {
        "id": customer_id,
        "full_name": customer_data.full_name,
        "phone_number": customer_data.phone_number,
        "address": customer_data.address,
        "gender": customer_data.gender,
        "referral_source": customer_data.referral_source,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow()
    }
    
    customers_collection.insert_one(customer_doc)
    return Customer(**customer_doc)

@app.delete("/api/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    result = customers_collection.delete_one({"id": customer_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)