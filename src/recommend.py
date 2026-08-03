import pandas as pd
from src.utils import calc_distance
from src.load_data import load_medical_facilities, load_evacuation_sites


def recommend_shelter(user_lat, user_lon, life_stage):
    # データ読み込み
    medical = load_medical_facilities()
    shelters = load_evacuation_sites()

    # ユーザー → 避難所 の距離
    shelters["distance_user"] = shelters.apply(
        lambda row: calc_distance(user_lat, user_lon, row["緯度"], row["経度"]),
        axis=1
    )

    # 避難所 → 医療機関 の距離を計算する関数
    def nearest_medical(df, flag, shelter_lat, shelter_lon):
        target = df[df[flag]]
        if len(target) == 0:
            return None, 99999.0
        target = target.copy()
        target["dist"] = target.apply(
            lambda row: calc_distance(shelter_lat, shelter_lon, row["緯度"], row["経度"]),
            axis=1
        )
        best = target.sort_values("dist").iloc[0]
        return best["正式名称"], best["dist"]

    # ライフステージ別の重み
    weights = {
        "妊娠初期":  {"user": 0.2, "ob": 0.4, "pe": 0.2, "er": 0.2},
        "妊娠中期":  {"user": 0.2, "ob": 0.4, "pe": 0.2, "er": 0.2},
        "妊娠後期":  {"user": 0.3, "ob": 0.5, "pe": 0.1, "er": 0.1},
        "産後":      {"user": 0.2, "ob": 0.2, "pe": 0.4, "er": 0.2},
    }

    w = weights.get(life_stage, weights["妊娠初期"])

    # ユーザー距離だけで仮スコアを作り、上位3件を選ぶ
    shelters["score_tmp"] = w["user"] * (1 / (shelters["distance_user"] + 1))
    top3 = shelters.sort_values("score_tmp", ascending=False).head(3)

    # 避難所ごとに医療機関距離を計算してスコアを再計算
    results = []
    for _, row in top3.iterrows():

        shelter_lat = row["緯度"]
        shelter_lon = row["経度"]

        # 避難所 → 医療機関 の距離
        nearest_ob, dist_ob = nearest_medical(medical, "has_obstetrics", shelter_lat, shelter_lon)
        nearest_pe, dist_pe = nearest_medical(medical, "has_pediatrics", shelter_lat, shelter_lon)
        nearest_er, dist_er = nearest_medical(medical, "has_emergency", shelter_lat, shelter_lon)

        # ★ 正しいスコア計算（避難所 → 医療機関）
        score = (
            w["user"] * (1 / (row["distance_user"] + 1)) +
            w["ob"]   * (1 / (dist_ob + 1)) +
            w["pe"]   * (1 / (dist_pe + 1)) +
            w["er"]   * (1 / (dist_er + 1))
        )

        results.append({
            "避難所名": row["避難所名"],
            "緯度": row["緯度"],
            "経度": row["経度"],
            "総合スコア": score,
            "ユーザーからの距離": round(row["distance_user"], 1),
            "最寄り産科": nearest_ob,
            "産科までの距離": round(dist_ob, 1),
            "最寄り小児科": nearest_pe,
            "小児科までの距離": round(dist_pe, 1),
            "最寄り救急科": nearest_er,
            "救急科までの距離": round(dist_er, 1),
        })

    return results
