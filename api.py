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
    # ★ recommend.py は英語キーで返す
    results = recommend_module.recommend_shelter(lat, lon, life_stage)

    formatted = []
    for r in results:
        formatted.append({
            "name": r["name"],                     # 避難所名
            "lat": r["lat"],
            "lon": r["lon"],
            "score": r["score"],                   # 総合スコア
            "distance_ob": r["distance_ob"],       # 産科までの距離
            "distance_pe": r["distance_pe"],       # 小児科までの距離
            "distance_er": r["distance_er"],       # 救急科までの距離
            "equipment": r["equipment"],           # 設備あり
            "milk": r["milk"],                     # ミルクあり
            "diaper": r["diaper"],                 # おむつあり
        })

    return {"results": formatted}
