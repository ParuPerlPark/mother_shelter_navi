from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import time

# ============================
# 位置情報ユーティリティ
# ============================

geolocator = Nominatim(
    user_agent="mother_shelter_nav_tokyo_disaster_project_2026",
    timeout=5
)

def calc_distance(lat1, lon1, lat2, lon2):
    """2地点の距離をメートルで返す"""
    return geodesic((lat1, lon1), (lat2, lon2)).meters

def geocode_address(address):
    """住所を緯度経度に変換"""
    try:
        time.sleep(1)  # Nominatim の連続アクセス防止
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
    except Exception as e:
        print("geocode error:", e)
        return None, None
    return None, None


# ============================
# ライフステージ別の重み
# ============================

LIFE_STAGE_WEIGHTS = {
    "early_pregnancy": {  # 妊娠初期
        "safety": 0.40,
        "distance": 0.20,
        "medical": 0.15,
        "toilet": 0.15,
        "barrier_free": 0.10,
    },
    "late_pregnancy": {  # 妊娠後期
        "distance": 0.30,
        "safety": 0.25,
        "barrier_free": 0.20,
        "toilet": 0.15,
        "medical": 0.10,
    },
    "full_term": {  # 臨月
        "medical": 0.30,
        "distance": 0.25,
        "safety": 0.20,
        "barrier_free": 0.15,
        "toilet": 0.10,
    }
}


# ============================
# 各項目のスコア化関数
# ============================

def score_safety(shelter):
    """安全性スコア（浸水・災害種別対応など）"""
    return shelter.get("safety_score", 0.5)

def score_distance(distance_meters):
    """距離スコア（短いほど高評価）"""
    if distance_meters > 3000:
        return 0.1
    elif distance_meters > 2000:
        return 0.3
    elif distance_meters > 1000:
        return 0.6
    else:
        return 0.9

def score_medical(distance_to_obgyn, distance_to_pediatrics):
    """産科・小児科の距離を統合した医療アクセススコア"""
    score_ob = score_distance(distance_to_obgyn)
    score_pd = score_distance(distance_to_pediatrics)
    return max(score_ob, score_pd)

def score_barrier_free(shelter):
    """バリアフリー設備の有無"""
    return 1.0 if shelter.get("barrier_free", False) else 0.3

def score_toilet(shelter):
    """多目的トイレの有無"""
    return 1.0 if shelter.get("multi_toilet", False) else 0.2


# ============================
# 総合スコア計算
# ============================

def calculate_shelter_score(
    shelter,
    life_stage,
    distance_to_shelter,
    distance_to_obgyn,
    distance_to_pediatrics
):
    """避難所の総合スコアを計算する"""

    weights = LIFE_STAGE_WEIGHTS[life_stage]

    safety = score_safety(shelter)
    distance = score_distance(distance_to_shelter)
    medical = score_medical(distance_to_obgyn, distance_to_pediatrics)
    toilet = score_toilet(shelter)
    barrier_free = score_barrier_free(shelter)

    total_score = (
        safety * weights.get("safety", 0) +
        distance * weights.get("distance", 0) +
        medical * weights.get("medical", 0) +
        toilet * weights.get("toilet", 0) +
        barrier_free * weights.get("barrier_free", 0)
    )

    return total_score


# ============================
# 最適な避難所を選ぶ
# ============================

def recommend_shelter(shelters, life_stage):
    """避難所リストから最適な1件を返す"""

    results = []

    for shelter in shelters:
        score = calculate_shelter_score(
            shelter,
            life_stage,
            shelter["distance"],
            shelter["distance_to_obgyn"],
            shelter["distance_to_pediatrics"]
        )

        results.append({
            "shelter": shelter,
            "score": score
        })

    # スコアが最も高い避難所を返す
    return sorted(results, key=lambda x: x["score"], reverse=True)[0]