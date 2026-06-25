from pathlib import Path

T0 = "202603"
POINTS = {"t0": T0}
K_CLUSTERS = 5
WINSOR_P = (0.01, 0.99)
MUN_COUNT_TOLERANCE = 50
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR
PIX_DB = BASE_DIR / "public" / "data" / "pix_municipios.db"
