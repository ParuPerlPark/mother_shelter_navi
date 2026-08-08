from fastapi import FastAPI
import pandas as pd
import numpy as np

app = FastAPI()

# ★ 起動時に一度だけ CSV を読み込む
shelter_df = pd.read_csv(
    "data/130001_evacuation_center.csv",
    encoding="cp932",
    low_memory=False
)

@app.get("/shelters")
def list_shelters(limit: int = 10):
    """
    避難所データを limit 件だけ返すAPI
    """

    # ★ 返却直前に NaN を完全除去（ここが重要）
    df = shelter_df.head(limit).replace({np.nan: None})

    # DataFrame → JSON 変換可能な dict へ
    data = df.to_dict(orient="records")

    return {"count": len(data), "items": data}
