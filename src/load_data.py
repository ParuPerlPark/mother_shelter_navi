import pandas as pd

# ------------------------------------------------------------
# 避難所データ読み込み
# ------------------------------------------------------------
def load_evacuation_sites():
    df = pd.read_csv("./data/130001_evacuation_area.csv")

    # 列名統一（あなたの CSV に合わせる）
    df = df.rename(columns={
        "latitude": "緯度",
        "longitude": "経度",
        "name": "避難所名",
        "施設名": "避難所名"  # 施設名の場合も対応
    })

    # 数値化
    df["緯度"] = pd.to_numeric(df["緯度"], errors="coerce")
    df["経度"] = pd.to_numeric(df["経度"], errors="coerce")

    # ★ NaN の座標を除外（今回の geopy エラーの原因）
    df = df.dropna(subset=["緯度", "経度"])

    return df


# ------------------------------------------------------------
# 病院データ読み込み
# ------------------------------------------------------------
def load_hospitals():
    df_fac = pd.read_csv("data/01-1_hospital_facility_info_20250601.csv", dtype={"ID": str})
    df_spec = pd.read_csv("data/01-2_hospital_speciality_hours_20250601.csv", dtype={"ID": str})

    # 結合
    df = df_fac.merge(df_spec, on="ID", how="left")

    # 列名統一
    if "所在地座標（緯度）" in df.columns:
        df.rename(columns={"所在地座標（緯度）": "緯度"}, inplace=True)
    if "所在地座標（経度）" in df.columns:
        df.rename(columns={"所在地座標（経度）": "経度"}, inplace=True)

    # merge による _x / _y の統一
    if "緯度_x" in df.columns:
        df["緯度"] = df["緯度_x"]
    if "経度_x" in df.columns:
        df["経度"] = df["経度_x"]

    # 欠損除外
    df = df.dropna(subset=["緯度", "経度"])

    # 診療科名を文字列化
    df["診療科目名"] = df["診療科目名"].astype(str)

    # 診療科フラグ
    df["has_obstetrics"] = df["診療科目名"].str.contains("産科|産婦|産婦人科|婦人", na=False)
    df["has_pediatrics"] = df["診療科目名"].str.contains("^小児", na=False)
    df["has_emergency"] = df["診療科目名"].str.contains("救急|ER|救命", na=False)

    return df


# ------------------------------------------------------------
# 診療所データ読み込み
# ------------------------------------------------------------
def load_clinics():
    df_fac = pd.read_csv("data/02-1_clinic_facility_info_20250601.csv", dtype={"ID": str})
    df_spec = pd.read_csv("data/02-2_clinic_speciality_hours_20250601.csv", dtype={"ID": str})

    df = df_fac.merge(df_spec, on="ID", how="left")

    if "所在地座標（緯度）" in df.columns:
        df.rename(columns={"所在地座標（緯度）": "緯度"}, inplace=True)
    if "所在地座標（経度）" in df.columns:
        df.rename(columns={"所在地座標（経度）": "経度"}, inplace=True)

    if "緯度_x" in df.columns:
        df["緯度"] = df["緯度_x"]
    if "経度_x" in df.columns:
        df["経度"] = df["経度_x"]

    df = df.dropna(subset=["緯度", "経度"])

    df["診療科目名"] = df["診療科目名"].astype(str)
    df["has_obstetrics"] = df["診療科目名"].str.contains("産科|産婦|産婦人科|婦人", na=False)
    df["has_pediatrics"] = df["診療科目名"].str.contains("^小児", na=False)
    df["has_emergency"] = df["診療科目名"].str.contains("救急|ER|救命", na=False)

    return df


# ------------------------------------------------------------
# 病院＋診療所を統合
# ------------------------------------------------------------
def load_medical_facilities():
    hospitals = load_hospitals()
    clinics = load_clinics()

    df = pd.concat([hospitals, clinics], ignore_index=True)

    # 必要な診療科を持つ施設だけ返す
    return df[
        (df["has_obstetrics"]) |
        (df["has_pediatrics"]) |
        (df["has_emergency"])
    ].copy()

# ------------------------------------------------------------
# 板橋区の避難所別災害備蓄情報
# ------------------------------------------------------------
def load_stock():
    df = pd.read_csv("data/itabashi_bihin.csv")
    df.columns = df.columns.str.replace(r"\s+", "", regex=True)
    return df
