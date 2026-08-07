from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import src.recommend as recommend_module

app = FastAPI()

# CORS設定を追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ReactのURLを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "母子避難ナビAPIは動作中です"}

@app.get("/recommend")

def recommend(lat: float, lon: float, life_stage: str):
    results = recommend_module.recommend_shelter(lat, lon, life_stage)

    formatted = []
    for r in results:
        formatted.append({
            "避難所名": r["避難所名"],
            "lat": r.get("lat", 35.7486),
            "lon": r.get("lon", 139.7080),
            "総合スコア": r["総合スコア"],
            "産科までの距離": r["産科までの距離"],
            "最寄り産科": r["最寄り産科"],
            "小児科までの距離": r["小児科までの距離"],
            "最寄り小児科": r["最寄り小児科"],
            "最寄り救急科": r["最寄り救急科"],
            "救急科までの距離": r["救急科までの距離"],
        })

    return {"results": formatted}

