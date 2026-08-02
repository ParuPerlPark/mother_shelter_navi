import pandas as pd
from load_data import load_shelters, load_hospitals
from utils import calc_distance

def main():
    shelters = load_shelters("C:/Users/haruk/app/mother_shelter_nav/data/130001_evacuation_area.csv")
    hospitals = load_hospitals("C:/Users/haruk/app/mother_shelter_nav/data/130001_hospital.csv")

    # 母子対応病院だけに絞る
    hospitals_filtered = hospitals[
        (hospitals.has_obstetrics) |
        (hospitals.has_pediatrics) |
        (hospitals.has_emergency)
    ]

    print("母子対応病院 行数:", len(hospitals_filtered))
    print(hospitals_filtered[["名称","has_obstetrics","has_pediatrics","has_emergency"]])

    nearest_list = []
    
    for shelter in shelters.itertuples():
        shelter_lat = shelter.緯度
        shelter_lon = shelter.経度
    
        if pd.isna(shelter_lat) or pd.isna(shelter_lon):
            continue
    
        distances = []
        for hospital in hospitals_filtered.itertuples():
            if pd.isna(hospital.緯度) or pd.isna(hospital.経度):
                continue
    
            d = calc_distance(shelter_lat, shelter_lon, hospital.緯度, hospital.経度)
            distances.append((d, hospital))
    
        if len(distances) == 0:
            continue

        distances.sort(key=lambda x: x[0])
        top3 = distances[:3]

        score = 0
        for d, h in top3:
            if h.has_obstetrics:
                score += 3
            if h.has_pediatrics:
                score += 3
            if h.has_emergency:
                score += 2

        nearest_list.append({
            "避難所名": shelter.施設名,
            "最寄り病院": top3[0][1].名称,
            "距離(m)": top3[0][0],
            "母子安心スコア": score
        })
    
    print(nearest_list[:5])


if __name__ == "__main__":
    main()