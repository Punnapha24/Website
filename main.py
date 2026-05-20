from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, time
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "dbname": "maintenance_db",
    "user": "postgres",
    "password": "postgress", 
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print("Database connection error:", e)
        raise HTTPException(status_code=500, detail="Could not connect to database")

# Schema
class MaintenanceRecord(BaseModel):
    id: Optional[int] = None 
    room: str
    name: str
    date: date
    time: time
    temperature: float
    humidity: float
    power: float

# API (save/update)
@app.post("/api/records")
def save_record(record: MaintenanceRecord):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if record.id:
            cursor.execute("""
                UPDATE records 
                SET room=%s, name=%s, date=%s, time=%s, temperature=%s, humidity=%s, power=%s
                WHERE id=%s
            """, (record.room, record.name, record.date, record.time, 
                  record.temperature, record.humidity, record.power, record.id))
            message = f"Record updated successfully for {record.room}!"
        else:
            cursor.execute("""
                INSERT INTO records (room, name, date, time, temperature, humidity, power)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (record.room, record.name, record.date, record.time, 
                  record.temperature, record.humidity, record.power))
            message = f"Data saved to {record.room} successfully!"

        conn.commit()
        return {"success": True, "message": message}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# API (get all records)
@app.get("/api/records")
def get_records():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor) 
    try:
        cursor.execute("SELECT * FROM records ORDER BY created_at DESC")
        records = cursor.fetchall()
        
        formatted_records = []
        for r in records:
            formatted_records.append({
                "id": r['id'],
                "room": r['room'],
                "name": r['name'],
                "date": str(r['date']),
                "time": str(r['time']),
                "temperature": float(r['temperature']) if r['temperature'] else 0,
                "humidity": float(r['humidity']) if r['humidity'] else 0,
                "power": float(r['power']) if r['power'] else 0
            })
        return formatted_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()