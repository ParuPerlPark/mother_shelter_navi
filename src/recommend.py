import pandas as pd
from src.utils import calc_distance
from src.load_data import load_medical_facilities, load_evacuation_sites
import re
from concurrent.futures import ProcessPoolExecutor, as_completed
import os
import json

# 設備キーワード
equipment_keywords = [
    "授乳室",
    "ベビーベッド",
    "ベビーチェア",
    "おむつ交換台",
    "オムツ替えシート",
    "こども用トイレ",
    "ベビーチェア対応トイレ",
]

def has_equipment(text):
    return any(k in str(text) for k in equipment_keywords)


def extract_city(address):
    m = re.search(r"(.*?市|.*?区|.*?町|.*?村)", str(address))
    return m.group(1) if m else None


def normalize_life_stage(stage):
    if isinstance(stage, str):
        try:
            parsed = json.loads(stage)
            return normalize_life_stage(parsed)
        except Exception:
            return stage

    if isinstance(stage, list):
        has_pregnant = "pregnant" in stage
        has_childcare = "childcare" in stage

        if has_pregnant and has_childcare:
            return "妊娠＋育児中"
        if has_pregnant:
            return "妊娠中"
        if has_childcare:
            return "産後"
        return "不明"

    if isinstance(stage, dict):
        pregnant = stage.get("pregnant", False)
        childcare = stage.get("childcare", False)
        weeks = stage.get("weeks", None)

        if pregnant and childcare:
            if weeks is not None:
                if weeks <= 15:
                    return "妊娠初期＋育児中"
                elif weeks <= 27:
                    return "妊娠中期＋育児中"
                else:
                    return "妊娠後期＋育児中"
            return "妊娠＋育児中"

        if pregnant:
            if weeks is not None:
                if weeks <= 15:
                    return "妊娠初期"
                elif weeks <= 27:
                    return "妊娠中期"
                else:
                    return "妊娠後期"
            return "妊娠中"

        if childcare:
            return "産後"

        return "不明"

    return stage


def process_shelter(row_dict, medical, w):
    shelter_lat = row_dict["緯度"]
    shelter_lon = row_dict["経度"]
    shelter_city = extract_city(row_dict["所在地住所"])

    medical_city = medical[medical["市区町村"] == shelter_city].copy()
    if len(medical_city) == 0:
        medical_city = medical

    medical_city["dist"] = [
        calc_distance(shelter_lat, shelter_lon, lat, lon)
        for lat, lon in zip(medical_city["緯度"], medical_city["経度"])
    ]

    def pick(flag):
        df = medical_city[medical_city[flag]]
        if len(df) == 0:
            return None, 99999.0
        best = df.sort_values("dist").iloc[0]
        return best["正式名称"], best["dist"]

    nearest_ob, dist_ob = pick("has_obstetrics")
    nearest_pe, dist_pe = pick("has_pediatrics")
    nearest_er, dist_er = pick("has_emergency")

    distance_score = 1 / (row_dict["distance_user"] + 1)

    medical_score = 0.0
    if w["use_ob"]:
        medical_score += 1 / (dist_ob + 1)
    if w["use_pe"]:
        medical_score += 1 / (dist_pe + 1)
    medical_score += w["er_weight"] * (1 / (dist_er + 1))

    # ★ 設備列名を安全に取得（CRLF混入でも確実に拾える）
    equipment_col = next((col for col in row_dict.keys() if "その他" in col), None)

    equipment_text = row_dict.get(equipment_col, "")
    equipment_score = 1.0 if has_equipment(equipment_text) else 0.0

    score = (
        w["distance_weight"] * distance_score +
        w["medical_weight"]  * medical_score +
        w["equipment_weight"] * equipment_score
    )

    return {
        "避難所名": row_dict["避難所名"],
        "lat": row_dict["緯度"],
        "lon": row_dict["経度"],
        "総合スコア": score,
        "距離": round(row_dict["distance_user"], 1),
        "最寄り産科": nearest_ob,
        "産科までの距離": round(dist_ob, 1),
        "最寄り小児科": nearest_pe,
        "小児科までの距離": round(dist_pe, 1),
        "最寄り救急科": nearest_er,
        "救急科までの距離": round(dist_er, 1),
        "設備あり": bool(equipment_score),
    }


def recommend_shelter(user_lat, user_lon, life_stage_raw):
    life_stage = normalize_life_stage(life_stage_raw)

    medical = load_medical_facilities()
    shelters = load_evacuation_sites()

    # ★ 列名の改行・空白を完全除去（KeyError防止）
    shelters.columns = shelters.columns.str.replace(r"\s+", "", regex=True)

    print("避難所の列名一覧:", shelters.columns)

    medical = medical[medical["都道府県コード"].astype(str) == "13"]
    medical["市区町村"] = medical["所在地"].apply(extract_city)

    shelters["distance_user"] = [
        calc_distance(user_lat, user_lon, lat, lon)
        for lat, lon in zip(shelters["緯度"], shelters["経度"])
    ]

    nearby = shelters[shelters["distance_user"] <= 1000].copy()
    if len(nearby) == 0:
        nearby = shelters.sort_values("distance_user").head(10)

    # ★ ライフステージ別設備重み
    if life_stage in ["妊娠初期"]:
        equipment_weight = 0.2
    elif life_stage in ["妊娠中期"]:
        equipment_weight = 0.3
    elif life_stage in ["妊娠後期"]:
        equipment_weight = 0.2
    elif life_stage == "産後":
        equipment_weight = 0.5
    elif "育児中" in life_stage:
        equipment_weight = 0.6
    else:
        equipment_weight = 0.3

    weights = {
        "distance_weight": 0.5,
        "medical_weight": 0.5,
        "equipment_weight": equipment_weight,
        "use_ob": "妊娠" in life_stage,
        "use_pe": "育児" in life_stage or life_stage == "産後",
        "er_weight": 0.2,
    }

    w = weights

    nearby["score_tmp"] = (
        w["distance_weight"] * (1 / (nearby["distance_user"] + 1))
    )

    top3 = nearby.sort_values("score_tmp", ascending=False).head(3)

    max_workers = os.cpu_count() * 2
    results = []

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_shelter, row._asdict(), medical, w)
            for row in top3.itertuples()
        ]
        for f in as_completed(futures):
            results.append(f.result())

    return results
