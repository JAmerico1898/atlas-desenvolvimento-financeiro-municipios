#!/usr/bin/env python
"""
Generate TopoJSON files from IBGE shapefiles.

Outputs:
  web/public/geo/municipios-lod1.topojson  ~1.5MB (national view)
  web/public/geo/municipios-lod2.topojson  ~600KB (overview)
  web/public/geo/ufs.topojson              state boundaries overlay

Usage:
  python pipeline/geo/generate_topojson.py
"""
import json
from pathlib import Path

import geopandas as gpd
import topojson

BASE_DIR = Path(__file__).parent.parent.parent
MUN_SHP = BASE_DIR / "municipios-malha-territorial" / "BR_Municipios_2025.shp"
UF_SHP = BASE_DIR / "uf-malha-territorial" / "BR_UF_2025.shp"
GEO_OUT = BASE_DIR / "web" / "public" / "geo"


def write_topojson(topo: topojson.Topology, path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(topo.to_dict(), f, separators=(",", ":"))


def generate() -> None:
    GEO_OUT.mkdir(parents=True, exist_ok=True)

    # --- Municipalities ---
    print("Reading municipalities shapefile...")
    mun = gpd.read_file(MUN_SHP)
    mun = mun.to_crs("EPSG:4326")
    # Keep only columns needed by the web app
    mun = mun[["CD_MUN", "NM_MUN", "SIGLA_UF", "NM_REGIAO", "geometry"]]

    print("Generating municipios-lod1 (moderate simplification)...")
    topo_lod1 = topojson.Topology(
        mun,
        prequantize=1_000_000,
        topology=True,
        toposimplify=0.01,
    )
    out_lod1 = GEO_OUT / "municipios-lod1.topojson"
    write_topojson(topo_lod1, out_lod1)
    size_lod1 = out_lod1.stat().st_size / 1024
    print(f"  municipios-lod1.topojson: {size_lod1:.0f} KB")

    # Increase toposimplify if still too large (target < 3MB = 3072KB)
    if size_lod1 > 3072:
        print("  LOD1 too large, retrying with toposimplify=0.02...")
        topo_lod1 = topojson.Topology(
            mun,
            prequantize=1_000_000,
            topology=True,
            toposimplify=0.02,
        )
        write_topojson(topo_lod1, out_lod1)
        size_lod1 = out_lod1.stat().st_size / 1024
        print(f"  municipios-lod1.topojson (retry): {size_lod1:.0f} KB")

    print("Generating municipios-lod2 (aggressive simplification)...")
    topo_lod2 = topojson.Topology(
        mun,
        prequantize=100_000,
        topology=True,
        toposimplify=0.05,
    )
    out_lod2 = GEO_OUT / "municipios-lod2.topojson"
    write_topojson(topo_lod2, out_lod2)
    size_lod2 = out_lod2.stat().st_size / 1024
    print(f"  municipios-lod2.topojson: {size_lod2:.0f} KB")

    # Increase toposimplify if still too large (target < 1MB = 1024KB)
    if size_lod2 > 1024:
        print("  LOD2 too large, retrying with toposimplify=0.1...")
        topo_lod2 = topojson.Topology(
            mun,
            prequantize=100_000,
            topology=True,
            toposimplify=0.1,
        )
        write_topojson(topo_lod2, out_lod2)
        size_lod2 = out_lod2.stat().st_size / 1024
        print(f"  municipios-lod2.topojson (retry): {size_lod2:.0f} KB")

    # --- States (UFs) ---
    print("Reading UF shapefile...")
    uf = gpd.read_file(UF_SHP)
    uf = uf.to_crs("EPSG:4326")
    uf = uf[["SIGLA_UF", "NM_UF", "NM_REGIAO", "geometry"]]

    print("Generating ufs.topojson...")
    topo_uf = topojson.Topology(
        uf,
        prequantize=1_000_000,
        topology=True,
        toposimplify=0.01,
    )
    out_uf = GEO_OUT / "ufs.topojson"
    write_topojson(topo_uf, out_uf)
    size_uf = out_uf.stat().st_size / 1024
    print(f"  ufs.topojson: {size_uf:.0f} KB")

    # --- Summary ---
    print("\nGenerated files:")
    for f in sorted(GEO_OUT.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}: {size_kb:.0f} KB")

    # Validate JSON parsability
    print("\nValidating JSON...")
    for f in sorted(GEO_OUT.iterdir()):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        assert data.get("type") == "Topology", f"{f.name} is not a valid Topology"
        print(f"  {f.name}: OK (type=Topology)")

    print("\nDone.")


if __name__ == "__main__":
    generate()
