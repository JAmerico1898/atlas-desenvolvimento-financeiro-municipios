#!/usr/bin/env python
"""Main pipeline entry point. Usage: python pipeline/run.py"""
import sys
import os
import time
import datetime

from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from pipeline.config import DATA_DIR, PIX_DB, POINTS, K_CLUSTERS
from pipeline.transform.panel import build_panel
from pipeline.indicators import compute_all
from pipeline.qa.validate import validate
from pipeline.publish.schema import create_tables
from pipeline.publish.writer import publish
import psycopg


def main():
    t_start = time.time()
    db_url = os.environ.get("NEON_DATABASE_URL")
    if not db_url:
        sys.exit("ERROR: NEON_DATABASE_URL not set in environment")

    print("=== ADFM Pipeline ===")
    print(f"t0={POINTS['t0']}, t_12={POINTS['t_12']}, t_24={POINTS['t_24']}")

    print("\n[1/5] Building base panel...")
    panel = build_panel(DATA_DIR, PIX_DB, POINTS)
    print(f"  {len(panel)} rows ({panel['municipio_id'].nunique()} municipalities × 3 pontos)")

    print("\n[2/5] Computing indicators...")
    df, meta_indices, cluster_profiles = compute_all(panel, K_CLUSTERS)
    print(f"  Done. Columns: {list(df.columns)}")

    print("\n[3/5] QA validation...")
    result = validate(df, cluster_profiles, meta_indices)
    passed = sum(1 for c in result["checks"] if c["status"] == "pass")
    failed = sum(1 for c in result["checks"] if c["status"] == "fail")
    warned = sum(1 for c in result["checks"] if c["status"] == "warn")
    print(f"  {passed} pass, {warned} warn, {failed} fail")
    for c in result["checks"]:
        if c["status"] != "pass":
            print(f"  [{c['status'].upper()}] {c['name']}: {c['detail']}")
    if not result["pass"]:
        sys.exit("Pipeline aborted: QA failed")

    print("\n[4/5] Setting up schema...")
    with psycopg.connect(db_url) as conn:
        create_tables(conn)

    versao = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    print(f"\n[5/5] Publishing to Neon (version {versao})...")
    publish(df, cluster_profiles, meta_indices, versao, db_url)

    elapsed = time.time() - t_start
    print(f"\n=== Done in {elapsed:.1f}s ===")


if __name__ == "__main__":
    main()
