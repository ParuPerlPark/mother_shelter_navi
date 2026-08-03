from recommend import recommend_shelter
from load_data import load_evacuation_sites
import folium

# ------------------------------------------------------------
# ★ 本来はユーザー入力（後で UI / API で実装予定）
# ------------------------------------------------------------
# 例：板橋第二小学校付近
user_lat = 35.7486
user_lon = 139.7080

# 例：妊娠初期（ユーザー選択）
life_stage = "妊娠初期"

# ------------------------------------------------------------
# 推奨避難所の計算
# ------------------------------------------------------------
results = recommend_shelter(user_lat, user_lon, life_stage)

# ------------------------------------------------------------
# 出力
# ------------------------------------------------------------
print("=== 推奨避難所トップ3 ===")
for r in results:
    print("----")
    for key, value in r.items():
        print(f"{key}: {value}")

# ------------------------------------------------------------
# ★ 地図可視化（folium）
# ------------------------------------------------------------

# 地図の中心をユーザー位置にする
m = folium.Map(location=[user_lat, user_lon], zoom_start=15)

# ユーザー位置のピン
folium.Marker(
    location=[user_lat, user_lon],
    popup="あなたの位置",
    icon=folium.Icon(color="blue", icon="user")
).add_to(m)

# 避難所データ読み込み（緯度・経度取得用）
shelters_df = load_evacuation_sites()

# 推奨避難所トップ3のピン
for idx, r in enumerate(results, start=1):
    shelter = shelters_df[shelters_df["避難所名"] == r["避難所名"]].iloc[0]

    folium.Marker(
        location=[shelter["緯度"], shelter["経度"]],
        popup=f"{idx}位: {r['避難所名']}（スコア: {round(r['総合スコア'], 4)}）",
        icon=folium.Icon(color="red", icon="home")
    ).add_to(m)

# 地図をHTMLとして保存
m.save("recommended_shelters_map.html")
print("地図を recommended_shelters_map.html に保存しました！")
