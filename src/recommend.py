import pandas as pd
from src.utils import calc_distance
from src.load_data import load_medical_facilities, load_evacuation_sites
import re
from concurrent.futures import ProcessPoolExecutor, as_completed
import os


def extract_city(address):
    """住所から市区町村名を抽出"""
    m = re.search(r"(.*?市|.*?区|.*?町|.*?村)", str(address))
    return m.group(1) if m else None


def process_shelter(row_dict, medical, w):
    """避難所ごとのスコア計算"""
    shelter_lat = row_dict["緯度"]
    shelter_lon = row_dict["経度"]
    shelter_city = extract_city(row_dict["所在地住所"])

    # 市区町村で絞る
    medical_city = medical[medical["市区町村"] == shelter_city].copy()
    if len(medical_city) == 0:
        medical_city = medical  # fallback

    # 医療機関距離
    medical_city["dist"] = [
        calc_distance(shelter_lat, shelter_lon, lat, lon)
        for lat, lon in zip(medical_city["緯度"], medical_city["経度"])
    ]

    # 最寄り病院を選ぶ
    def pick(flag):
        df = medical_city[medical_city[flag]]
        if len(df) == 0:
            return None, 99999.0
        best = df.sort_values("dist").iloc[0]
        return best["正式名称"], best["dist"]

    nearest_ob, dist_ob = pick("has_obstetrics")
    nearest_pe, dist_pe = pick("has_pediatrics")
    nearest_er, dist_er = pick("has_emergency")

    # 総合スコア
    score = (
        w["user"] * (1 / (row_dict["distance_user"] + 1)) +
        w["ob"]   * (1 / (dist_ob + 1)) +
        w["pe"]   * (1 / (dist_pe + 1)) +
        w["er"]   * (1 / (dist_er + 1))
    )

    return {
        "避難所名": row_dict["避難所名"],
        "lat": row_dict["緯度"],
        "lon": row_dict["経度"],
        "総合スコア": score,
        "ユーザーからの距離": round(row_dict["distance_user"], 1),
        "最寄り産科": nearest_ob,
        "産科までの距離": round(dist_ob, 1),
        "最寄り小児科": nearest_pe,
        "小児科までの距離": round(dist_pe, 1),
        "最寄り救急科": nearest_er,
        "救急科までの距離": round(dist_er, 1),
    }


def recommend_shelter(user_lat, user_lon, life_stage):
    """避難所トップ3を返す（半径1km以内に絞り込み）"""
    medical = load_medical_facilities()
    shelters = load_evacuation_sites()

    # 東京都だけ
    medical = medical[medical["都道府県コード"].astype(str) == "13"]
    medical["市区町村"] = medical["所在地"].apply(extract_city)

    # 避難所距離
    shelters["distance_user"] = [
        calc_distance(user_lat, user_lon, lat, lon)
        for lat, lon in zip(shelters["緯度"], shelters["経度"])
    ]

    # 半径1km以内に絞る
    nearby = shelters[shelters["distance_user"] <= 1000].copy()

    # 近くに避難所がない場合は距離順で10件fallback
    if len(nearby) == 0:
        nearby = shelters.sort_values("distance_user").head(10)

    # ライフステージ別重み
    weights = {
        "妊娠初期":  {"user": 0.2, "ob": 0.4, "pe": 0.2, "er": 0.2},
        "妊娠中期":  {"user": 0.2, "ob": 0.4, "pe": 0.2, "er": 0.2},
        "妊娠後期":  {"user": 0.3, "ob": 0.5, "pe": 0.1, "er": 0.1},
        "産後":      {"user": 0.2, "ob": 0.2, "pe": 0.4, "er": 0.2},
    }
    w = weights.get(life_stage, weights["妊娠初期"])

    # 距離スコアでトップ3を選ぶ
    nearby["score_tmp"] = w["user"] * (1 / (nearby["distance_user"] + 1))
    top3 = nearby.sort_values("score_tmp", ascending=False).head(3)

    # 並列処理
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
