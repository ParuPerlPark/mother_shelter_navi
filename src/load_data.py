import pandas as pd
from utils import geocode_address

def load_shelters(path):
    df = pd.read_csv(path)
    df["緯度"] = pd.to_numeric(df["緯度"], errors="coerce")
    df["経度"] = pd.to_numeric(df["経度"], errors="coerce")
    return df.dropna(subset=["施設名"])


def load_hospitals():
    df_fac = pd.read_csv("data/01-1_hospital_facility_info_20250601.csv", dtype={"ID": str})
    df_spec = pd.read_csv("data/01-2_hospital_speciality_hours_20250601.csv", dtype={"ID": str})

    df = df_fac.merge(df_spec, on="ID", how="left")

    # ★ merge 後の列名を統一
    if "所在地座標（緯度）" in df.columns:
        df.rename(columns={"所在地座標（緯度）": "緯度"}, inplace=True)
    if "所在地座標（経度）" in df.columns:
        df.rename(columns={"所在地座標（経度）": "経度"}, inplace=True)

    # ★ merge による _x / _y を統一
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


def load_medical_facilities():
    hospitals = load_hospitals()
    clinics = load_clinics()
    df = pd.concat([hospitals, clinics], ignore_index=True)

    return df[
        (df["has_obstetrics"]) |
        (df["has_pediatrics"]) |
        (df["has_emergency"])
    ].copy()