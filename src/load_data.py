import pandas as pd
from utils import geocode_address

def load_shelters(path):
    df = pd.read_csv(path)
    df["緯度"] = pd.to_numeric(df["緯度"], errors="coerce")
    df["経度"] = pd.to_numeric(df["経度"], errors="coerce")
    df = df.dropna(subset=["施設名"])
    return df

def load_hospitals(path):
    df = pd.read_csv(path)

    # 空文字 → NaN
    df = df.replace({"緯度": {"": pd.NA}, "経度": {"": pd.NA}})

    # geocode（まず全病院に対して）
    for i, row in df.iterrows():
        if pd.isna(row["緯度"]) or pd.isna(row["経度"]):
            address = row["所在地_連結表記"]
            lat, lon = geocode_address(address)
            if lat is not None and lon is not None:
                df.at[i, "緯度"] = lat
                df.at[i, "経度"] = lon

    # geocode 成功した行だけ残す
    df = df.dropna(subset=["緯度", "経度"])

    # 診療科フラグ
    df["has_obstetrics"] = df["診療科目"].str.contains("産婦|産科|婦人", na=False)
    df["has_pediatrics"] = df["診療科目"].str.contains("小児", na=False)
    df["has_emergency"] = df["診療科目"].str.contains("救急|ER|救命", na=False)

    # 母子対応病院だけに絞る
    df = df[
        (df["has_obstetrics"]) |
        (df["has_pediatrics"]) |
        (df["has_emergency"])
    ].copy()

    return df
