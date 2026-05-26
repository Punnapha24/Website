from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, time, datetime, timedelta, timezone
from typing import Optional, Dict, Any
import json
import jwt
from passlib.context import CryptContext

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Config ---
DB_CONFIG = {
    "dbname": "maintenance_db",
    "user": "postgres",
    "password": "postgress", 
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Exception as e:
        print("Database connection error:", e)
        raise HTTPException(status_code=500, detail="Could not connect to database")

# --- Pydantic Models ---
class MaintenanceRecord(BaseModel):
    id: Optional[int] = None 
    room: str
    name: str
    date: date
    time: time
    extra_data: Optional[Dict[str, Any]] = None 

class LoginRequest(BaseModel):
    username: str
    password: str

# --- Auth Configurations ---
SECRET_KEY = "your-super-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Added leading slash here for better Swagger UI compatibility
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login") 

# --- Auth Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    # Updated to use modern timezone-aware UTC time
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.post("/api/register")
def register(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Check if the username is already taken
        cursor.execute("SELECT username FROM system_users WHERE username = %s", (request.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")

        # 2. Hash the new password using the passlib context we already set up
        hashed_pw = pwd_context.hash(request.password)

        # 3. Save the new user to the database
        cursor.execute("""
            INSERT INTO system_users (username, hashed_password)
            VALUES (%s, %s)
        """, (request.username, hashed_pw))
        
        conn.commit()
        return {"success": True, "message": f"Account '{request.username}' created successfully! You can now log in."}
    
    except HTTPException:
        raise # Re-raise our custom 400 error
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    finally:
        cursor.close()
        conn.close()    

# --- Endpoints ---
@app.post("/api/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        print(f"👉 Received Username: '{request.username}'")
        print(f"👉 Received Password: '{request.password}'")

        cursor.execute("SELECT * FROM system_users WHERE username = %s", (request.username,))
        user = cursor.fetchone()
        
        if not user:
            print("❌ Debug: User not found in database!")
            raise HTTPException(status_code=401, detail="Incorrect username or password")
            
        if not verify_password(request.password, user['hashed_password']):
            print("❌ Debug: User found, but password hash did NOT match!")
            raise HTTPException(status_code=401, detail="Incorrect username or password")
            
        print("✅ Debug: Login successful!")
            
        access_token = create_access_token(
            data={"sub": user['username']}, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        conn.close()

@app.post("/api/records")
def save_record(record: MaintenanceRecord, current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        extra_json = json.dumps(record.extra_data) if record.extra_data else None

        if record.id:
            cursor.execute("""
                UPDATE records 
                SET room=%s, name=%s, date=%s, time=%s, extra_data=%s
                WHERE id=%s
            """, (record.room, record.name, record.date, record.time, extra_json, record.id))
            message = f"Record updated successfully for {record.room}!"
        else:
            cursor.execute("""
                INSERT INTO records (room, name, date, time, extra_data)
                VALUES (%s, %s, %s, %s, %s)
            """, (record.room, record.name, record.date, record.time, extra_json))
            message = f"Data saved to {record.room} successfully!"

        conn.commit()
        return {"success": True, "message": message}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/records")
def get_records(current_user: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor) 
    try:
        cursor.execute("SELECT * FROM records ORDER BY id DESC")
        records = cursor.fetchall()
        
        formatted_records = []
        for r in records:
            formatted_records.append({
                "id": r['id'],
                "room": r['room'],
                "name": r['name'],
                "date": str(r['date']),
                "time": str(r['time']),
                "extra_data": r.get('extra_data')
            })
        return formatted_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()