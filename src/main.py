import pandas as pd
from load_data import load_shelters, load_medical_facilities
from utils import calc_distance, recommend_shelter

def main():
    # 板橋区文化会館（仮の現在地）
    user_lat = 35.7486
    user_lon = 139.7080

    shelters = load_shelters("C:/Users/haruk/app/mother_shelter_nav/data/130001_evacuation_area.csv")
    medical = load_medical_facilities()
    print("\n=== medical の先頭5行 ===")
    print(medical.head()[["正式名称", "診療科目名", "has_obstetrics", "has_pediatrics", "緯度", "経度"]])
    print("\n=== medical に産科が入っているか ===")
    print(
        medical[medical["正式名称"].str.contains("豊島", na=False)][
            ["正式名称", "診療科目名", "has_obstetrics", "has_pediatrics", "緯度", "経度"]
        ]
    )



    # -----------------------------
    # ① ユーザーから近い避難所を抽出
    # -----------------------------
    candidate = []

    # まず 1km 以内
    for s in shelters.itertuples():
        d = calc_distance(user_lat, user_lon, s.緯度, s.経度)
        if d <= 1000:
            candidate.append((d, s))

    # 1km以内がなければ 3km に拡大
    if len(candidate) == 0:
        for s in shelters.itertuples():
            d = calc_distance(user_lat, user_lon, s.緯度, s.経度)
            if d <= 3000:
                candidate.append((d, s))

    # 近い順に 5件だけ使う
    candidate.sort(key=lambda x: x[0])
    candidate = candidate[:5]

    # -----------------------------
    # ② 避難所ごとに近い医療機関を抽出
    # -----------------------------
    enriched_shelters = []

    for dist_user, shelter in candidate:
        nearby_hospitals = []

        for hosp in medical.itertuples():
            d = calc_distance(shelter.緯度, shelter.経度, hosp.緯度, hosp.経度)
            if d <= 3000:  # 3km以内の医療機関だけ
                nearby_hospitals.append((d, hosp))

        # 最寄り産科・小児科の距離
        dist_ob = min([d for d, h in nearby_hospitals if h.has_obstetrics], default=99999)
        dist_pd = min([d for d, h in nearby_hospitals if h.has_pediatrics], default=99999)

        # 最寄り産科病院名
        obgyn_name = None
        for d, h in nearby_hospitals:
            if h.has_obstetrics and d == dist_ob:
                obgyn_name = h.正式名称
                break

        # 最寄り小児科病院名
        pedi_name = None
        for d, h in nearby_hospitals:
            if h.has_pediatrics and d == dist_pd:
                pedi_name = h.正式名称
                break

        enriched_shelters.append({
            "name": shelter.施設名,
            "lat": shelter.緯度,
            "lon": shelter.経度,
            "distance": dist_user,
            "distance_from_user": dist_user,
            "distance_to_obgyn": dist_ob,
            "distance_to_pediatrics": dist_pd,
            "nearest_obgyn_name": obgyn_name,
            "nearest_pedi_name": pedi_name,
            "nearby_hospitals": nearby_hospitals
        })

    # -----------------------------
    # ③ 妊娠初期ロジックでスコアリング
    # -----------------------------
    best = recommend_shelter(enriched_shelters, life_stage="early_pregnancy")

    print("\n=== 推奨避難所（妊娠初期） ===")
    print("避難所名:", best["shelter"]["name"])
    print("総合スコア:", f"{best['score']:.3f}")
    print("ユーザーからの距離:", f"{best['shelter']['distance_from_user']:.1f}m")

    print("最寄り産科:", best["shelter"]["nearest_obgyn_name"])
    print("産科までの距離:", f"{best['shelter']['distance_to_obgyn']:.1f}m")

    print("最寄り小児科:", best["shelter"]["nearest_pedi_name"])
    print("小児科までの距離:", f"{best['shelter']['distance_to_pediatrics']:.1f}m")


if __name__ == "__main__":
    main()