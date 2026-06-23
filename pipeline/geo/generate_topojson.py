#!/usr/bin/env python
"""
Generate TopoJSON files from IBGE shapefiles.

Outputs:
  web/public/geo/municipios-lod1.topojson  ~1.5MB (national view, moderate simplification)
  web/public/geo/municipios-lod2.topojson  ~600KB (overview, aggressive simplification)
  web/public/geo/ufs.topojson              state boundaries overlay

Join keys:
  municipalities: CD_MUN (IBGE 7-digit code, string)
  UFs: SIGLA_UF

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


def write_topojson(topo: topojson.Topology, path: Path) -> int:
    """Write topology to file, return size in bytes."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(topo.to_dict(), f, separators=(",", ":"))
    return path.stat().st_size


def make_topology(gdf, prequantize: int, presimplify: float) -> topojson.Topology:
    """Build a Topology using presimplify (avoids RAM spike from toposimplify)."""
    return topojson.Topology(
        gdf,
        prequantize=prequantize,
        topology=True,
        presimplify=presimplify,
    )


def generate() -> None:
    GEO_OUT.mkdir(parents=True, exist_ok=True)

    # --- Municipalities ---
    print("Reading municipalities shapefile...")
    mun = gpd.read_file(MUN_SHP)
    mun = mun.to_crs("EPSG:4326")
    # Keep only columns needed by the web app
    mun = mun[["CD_MUN", "NM_MUN", "SIGLA_UF", "NM_REGIAO", "geometry"]]
    print(f"  {len(mun)} municipalities loaded")

    # LOD1 — moderate simplification, target < 3MB
    print("Generating municipios-lod1 (moderate simplification)...")
    topo_lod1 = make_topology(mun, prequantize=100_000, presimplify=0.01)
    out_lod1 = GEO_OUT / "municipios-lod1.topojson"
    size_lod1 = write_topojson(topo_lod1, out_lod1)
    size_lod1_kb = size_lod1 / 1024
    print(f"  municipios-lod1.topojson: {size_lod1_kb:.0f} KB")

    if size_lod1_kb > 3072:
        print("  LOD1 still too large, retrying with presimplify=0.02...")
        topo_lod1 = make_topology(mun, prequantize=50_000, presimplify=0.02)
        size_lod1 = write_topojson(topo_lod1, out_lod1)
        print(f"  municipios-lod1.topojson (retry): {size_lod1 / 1024:.0f} KB")

    # LOD2 — aggressive simplification, target < 1.2MB
    print("Generating municipios-lod2 (aggressive simplification)...")
    topo_lod2 = make_topology(mun, prequantize=2_000, presimplify=0.2)
    out_lod2 = GEO_OUT / "municipios-lod2.topojson"
    size_lod2 = write_topojson(topo_lod2, out_lod2)
    size_lod2_kb = size_lod2 / 1024
    print(f"  municipios-lod2.topojson: {size_lod2_kb:.0f} KB")

    if size_lod2_kb > 1500:
        print("  LOD2 still too large, retrying with presimplify=0.3...")
        topo_lod2 = make_topology(mun, prequantize=1_000, presimplify=0.3)
        size_lod2 = write_topojson(topo_lod2, out_lod2)
        print(f"  municipios-lod2.topojson (retry): {size_lod2 / 1024:.0f} KB")

    # --- States (UFs) ---
    print("Reading UF shapefile...")
    uf = gpd.read_file(UF_SHP)
    uf = uf.to_crs("EPSG:4326")
    uf = uf[["SIGLA_UF", "NM_UF", "NM_REGIAO", "geometry"]]
    print(f"  {len(uf)} states loaded")

    print("Generating ufs.topojson...")
    topo_uf = make_topology(uf, prequantize=1_000_000, presimplify=0.005)
    out_uf = GEO_OUT / "ufs.topojson"
    size_uf = write_topojson(topo_uf, out_uf)
    print(f"  ufs.topojson: {size_uf / 1024:.0f} KB")

    # --- Summary ---
    print("\nGenerated files:")
    for f in sorted(GEO_OUT.iterdir()):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}: {size_kb:.0f} KB")

    # Validate JSON parsability and topology type
    print("\nValidating JSON...")
    for f in sorted(GEO_OUT.iterdir()):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        assert data.get("type") == "Topology", f"{f.name}: not a valid Topology"
        print(f"  {f.name}: OK (type=Topology)")

    print("\nDone.")


if __name__ == "__main__":
    generate()
