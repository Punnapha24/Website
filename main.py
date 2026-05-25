from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date, time
from typing import Optional, Dict, Any
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database 
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

# 🌟 1. อัปเดต Model ให้รับข้อมูลแบบยืดหยุ่น
class MaintenanceRecord(BaseModel):
    id: Optional[int] = None 
    room: str
    name: str
    date: date
    time: time
    # เรารับค่าเฉพาะเจาะจงทั้งหมดมาในกล่อง extra_data กล่องเดียว
    extra_data: Optional[Dict[str, Any]] = None 

@app.post("/api/records")
def save_record(record: MaintenanceRecord):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # แปลง Dictionary ของ Python ให้เป็น JSON String เพื่อบันทึกลง Database
        extra_json = json.dumps(record.extra_data) if record.extra_data else None

        if record.id:
            # 🌟 อัปเดตข้อมูล (รวมถึงช่อง extra_data)
            cursor.execute("""
                UPDATE records 
                SET room=%s, name=%s, date=%s, time=%s, extra_data=%s
                WHERE id=%s
            """, (record.room, record.name, record.date, record.time, extra_json, record.id))
            message = f"Record updated successfully for {record.room}!"
        else:
            # 🌟 สร้างข้อมูลใหม่ (โยน extra_json ลงไปในคอลัมน์เดียว)
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
def get_records():
    conn = get_db_connection()
    # ใช้ RealDictCursor ข้อมูล JSONB จะถูกแปลงกลับเป็น Python Dictionary อัตโนมัติ
    cursor = conn.cursor(cursor_factory=RealDictCursor) 
    try:
        # ดึงข้อมูลมาแสดงเรียงตามลำดับล่าสุด (ปรับ ORDER BY ได้ตามที่คุณมี)
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
                # ส่งกล่อง extra_data กลับไปให้หน้าเว็บ
                "extra_data": r.get('extra_data')
            })
        return formatted_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()