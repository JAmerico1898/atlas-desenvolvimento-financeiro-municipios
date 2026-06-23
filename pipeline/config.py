from pathlib import Path

T0 = "202603"
T_12 = "202503"
T_24 = "202403"
POINTS = {"t0": T0, "t_12": T_12, "t_24": T_24}
K_CLUSTERS = 5
WINSOR_P = (0.01, 0.99)
MUN_COUNT_TOLERANCE = 50
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR
PIX_DB = BASE_DIR / "public" / "data" / "pix_municipios.db"
