import os
from typing import Optional, List, Dict, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
import csv

app = FastAPI(title="Trackota Pit Strategy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/strategy/summary")
async def get_summary(file: Optional[str] = Query(default=None), folder: Optional[str] = Query(default=None)):
    base = _datasets_base()
    # Default to first available dataset folder when none provided
    if not file and not folder:
        folder = _first_dataset_folder()

    times: List[float] = []
    if folder:
        folder_path = (base / folder).resolve()
        if str(folder_path).startswith(str(base.resolve())) and folder_path.is_dir():
            candidate = None
            for p in folder_path.rglob("*.csv"):
                if p.name.lower().startswith("lap_times"):
                    candidate = p
                    break
            if not candidate:
                for p in folder_path.rglob("*.csv"):
                    candidate = p
                    if candidate:
                        break
            if candidate:
                times = _extract_lap_times(candidate)
    elif file:
        file_path = (base / file).resolve()
        if str(file_path).startswith(str(base.resolve())) and file_path.is_file():
            if file_path.suffix.lower() == ".csv":
                times = _extract_lap_times(file_path)

    total_laps = len(times)
    # Minimal dataset-derived summary; other fields left null for frontend placeholders
    return {
        "currentLap": total_laps or None,
        "totalLaps": total_laps or None,
        "session": "Race",
        "weather": None,
        "position": None,
        "gapAhead": None,
        "gapBehind": None,
        "tyre": None,
        "lapsOnTyre": None,
        "tyreWearPct": None,
        "fuelPct": None,
    }


@app.get("/strategy/recommendations")
async def get_recommendations():
    """
    Compute simple recommendations from lap-time degradation:
    - Find lap with largest positive jump (time lost) as indicative pit start.
    - Offer an optimal and a caution option based on window +/- 2 laps.
    """
    base = _datasets_base()
    folder = _first_dataset_folder()
    times: List[float] = []
    if folder:
        folder_path = (base / folder).resolve()
        candidate = None
        for p in folder_path.rglob("*.csv"):
            if p.name.lower().startswith("lap_times"):
                candidate = p
                break
        if not candidate:
            for p in folder_path.rglob("*.csv"):
                candidate = p
                if candidate:
                    break
        if candidate:
            times = _extract_lap_times(candidate)

    if not times:
        return []

    # Detect pit window via largest single-lap positive jump
    pit_start = None
    max_jump = 0.0
    for i in range(1, len(times)):
        jump = times[i] - times[i - 1]
        if jump > max_jump:
            max_jump = jump
            pit_start = i + 1

    if pit_start is None:
        pit_start = max(2, int(len(times) * 0.5))
    caution_lap = min(len(times), pit_start + 2)

    return [
        {
            "style": "optimal",
            "text": f"BOX on Lap {pit_start} — Tyre: Hard — Risk: Low",
            "reason": "Largest time loss detected suggests pit window opening.",
        },
        {
            "style": "caution",
            "text": f"Defer to Lap {caution_lap} — Tyre: Medium — Risk: Medium",
            "reason": "Later stop protects track position; watch for Safety Car.",
        },
    ]


@app.get("/race/top3")
async def get_top3():
    """
    Return top 3 fastest laps from the active dataset.
    """
    base = _datasets_base()
    folder = _first_dataset_folder()
    times: List[float] = []
    if folder:
        folder_path = (base / folder).resolve()
        candidate = None
        for p in folder_path.rglob("*.csv"):
            if p.name.lower().startswith("lap_times"):
                candidate = p
                break
        if not candidate:
            for p in folder_path.rglob("*.csv"):
                candidate = p
                if candidate:
                    break
        if candidate:
            times = _extract_lap_times(candidate)

    if not times:
        return []

    lap_times = list(enumerate(times, start=1))
    lap_times.sort(key=lambda kv: kv[1])
    best = lap_times[0][1]

    out = []
    for idx, (lap, t) in enumerate(lap_times[:3], start=1):
        gap = t - best
        out.append({
            "pos": idx,
            "name": f"Lap {lap}",
            "gap": f"+{gap:.1f}s" if idx > 1 else "+0.0s",
        })
    return out


@app.get("/charts/tyre-degradation")
async def get_tyre_degradation(track: Optional[str] = Query(default=None), file: Optional[str] = Query(default=None), folder: Optional[str] = Query(default=None)):
    base = _datasets_base()
    # Default to first available dataset folder when none provided
    if not file and not folder:
        folder = _first_dataset_folder()
    times: List[float] = []
    if folder:
        folder_path = (base / folder).resolve()
        if str(folder_path).startswith(str(base.resolve())) and folder_path.is_dir():
            # Prefer lap_times.csv; else first CSV containing lap time column
            candidate = None
            for p in folder_path.rglob("*.csv"):
                if p.name.lower().startswith("lap_times"):
                    candidate = p
                    break
            if not candidate:
                for p in folder_path.rglob("*.csv"):
                    candidate = p
                    if candidate:
                        break
            if candidate:
                times = _extract_lap_times(candidate)
    elif file:
        file_path = (base / file).resolve()
        if str(file_path).startswith(str(base.resolve())) and file_path.is_file():
            if file_path.suffix.lower() == ".csv":
                times = _extract_lap_times(file_path)
            # zip parsing not yet implemented

    if not times:
        # fallback demo series
        times = [93.2, 92.9, 92.7, 92.6, 92.5, 92.8, 93.1, 93.4, 93.9, 94.2, 94.7, 95.1, 95.6, 96.0, 96.4, 96.8, 97.2, 97.5, 97.9, 98.3, 98.8, 99.1, 99.5, 99.9]

    laps = list(range(1, len(times) + 1))
    # Detect pit window: find largest positive jump (time lost) suggesting pit stop
    pit_start = None
    max_jump = 0.0
    for i in range(1, len(times)):
        jump = times[i] - times[i - 1]
        if jump > max_jump:
            max_jump = jump
            pit_start = i + 1  # lap index is i+1 in 1-based terms
    if pit_start is None:
        pit_start = max(2, int(len(times) * 0.5))
    pit_end = min(len(times), pit_start + 2)
    return {
        "laps": laps,
        "times": times,
        "pitWindow": {"start": pit_start, "end": pit_end},
        "track": track,
        "file": file or folder,
    }

def _extract_lap_times(csv_path: Path) -> List[float]:
    try:
        with csv_path.open("r", newline="", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            headers = [h.strip() for h in (reader.fieldnames or [])]
            # common variants
            lap_time_keys = [
                "lap_time", "laptime", "lapTime", "LapTime", "lap_time_seconds", "laptime_s", "laptime_ms"
            ]
            lap_key_options = ["lap", "Lap", "lap_number", "LapNumber"]
            ts_key_options = ["timestamp", "Timestamp", "time", "meta_time"]

            lt_key = next((k for k in lap_time_keys if k in headers), None)
            lap_key = next((k for k in lap_key_options if k in headers), None)
            ts_key = next((k for k in ts_key_options if k in headers), None)

            if lt_key:
                # direct per-lap times
                times: Dict[int, float] = {}
                for row in reader:
                    lap_num = None
                    if lap_key and row.get(lap_key):
                        try:
                            lap_num = int(float(row[lap_key]))
                        except:
                            lap_num = None
                    try:
                        val = row.get(lt_key)
                        if val is None or val == "":
                            continue
                        t = float(val) / 1000.0 if lt_key.endswith("_ms") else float(val)
                        if lap_num is None:
                            times[len(times) + 1] = t
                        else:
                            if lap_num not in times:
                                times[lap_num] = t
                    except:
                        continue
                if times:
                    return [t for _, t in sorted(times.items(), key=lambda kv: kv[0])]

            # derive from timestamp and lap change
            if lap_key and ts_key:
                last_lap = None
                last_lap_ts = None
                out: Dict[int, float] = {}
                for row in reader:
                    try:
                        lap = int(float(row[lap_key]))
                    except:
                        continue
                    try:
                        ts_val = float(row[ts_key])
                    except:
                        # try parse ISO-ish
                        try:
                            ts_val = float(row[ts_key].replace(":", "").replace("-", "").replace(" ", ""))
                        except:
                            continue
                    if last_lap is None:
                        last_lap = lap
                        last_lap_ts = ts_val
                        continue
                    if lap != last_lap:
                        if last_lap_ts is not None:
                            dt = max(0.0, ts_val - last_lap_ts)
                            # convert ms to s if looks too large
                            if dt > 1000:
                                dt = dt / 1000.0
                            out[last_lap] = dt
                        last_lap = lap
                        last_lap_ts = ts_val
                if out:
                    return [t for _, t in sorted(out.items(), key=lambda kv: kv[0])]
    except Exception:
        return []
    return []


class SimulationRequest(BaseModel):
    pitLap: int
    compound: str
    safetyCar: bool = False


@app.post("/strategy/simulate")
async def simulate(req: SimulationRequest):
    # Basic mock: drop lap time by 1.5s after pit, slight compound effect, SC flattens 2 laps
    total = 45
    base = [93.0 + (i * 0.25) for i in range(total)]
    times = base[:]
    gain = {"Soft": -1.8, "Medium": -1.2, "Hard": -0.6}.get(req.compound, -1.0)
    if 1 <= req.pitLap <= total:
        for i in range(req.pitLap - 1, total):
            times[i] = max(80.0, times[i] + gain)
    if req.safetyCar and req.pitLap + 1 < total:
        times[req.pitLap : min(total, req.pitLap + 2)] = [times[req.pitLap] + 10.0, times[req.pitLap] + 10.5]
    return {"laps": list(range(1, total + 1)), "times": times}


@app.get("/datasets")
async def list_datasets():
    base = _datasets_base()
    items = []
    if base.exists():
        # directories
        for d in base.rglob("*"):
            if d.is_dir():
                try:
                    rel = d.relative_to(base)
                except ValueError:
                    rel = d.name
                # count csv files inside
                csv_count = len(list(d.rglob("*.csv")))
                if csv_count:
                    items.append({
                        "kind": "directory",
                        "name": d.name,
                        "relativePath": str(rel).replace("\\", "/"),
                        "csvCount": csv_count,
                        "track": d.name,
                    })
        # zip and csv files at any depth
        for p in base.rglob("*.zip"):
            try:
                rel = p.relative_to(base)
            except ValueError:
                rel = p.name
            items.append({
                "kind": "file",
                "name": p.name,
                "relativePath": str(rel).replace("\\", "/"),
                "size": p.stat().st_size,
            })
        for p in base.rglob("*.csv"):
            try:
                rel = p.relative_to(base)
            except ValueError:
                rel = p.name
            items.append({
                "kind": "file",
                "name": p.name,
                "relativePath": str(rel).replace("\\", "/"),
                "size": p.stat().st_size,
            })
    return {"path": str(base), "files": items}

def _datasets_base() -> Path:
    default_base = Path(__file__).resolve().parent.parent.parent / "data" / "datasets"
    env_base = os.getenv("TRACKOTA_DATASETS_DIR")
    return Path(env_base) if env_base else default_base

def _first_dataset_folder() -> Optional[str]:
    """
    Returns the first dataset directory (relative path to base) that contains at least one CSV file.
    """
    base = _datasets_base()
    if not base.exists():
        return None
    for d in sorted(base.rglob("*")):
        if d.is_dir():
            try:
                if len(list(d.rglob("*.csv"))) > 0:
                    rel = d.relative_to(base)
                    return str(rel).replace("\\", "/")
            except Exception:
                continue
    return None


@app.get("/charts/sections")
async def get_sections(track: Optional[str] = Query(default=None), file: Optional[str] = Query(default=None), folder: Optional[str] = Query(default=None)):
    """
    Returns per-section times for each lap. If section columns are not present, splits lap times evenly into 6 sections.
    sections: ["S1.a","S1.b","S2.a","S2.b","S3.a","S3.b"]
    """
    base = _datasets_base()
    # Default to first available dataset folder when none provided
    if not file and not folder:
        folder = _first_dataset_folder()
    times = []
    sections_times: Optional[Tuple[List[int], Dict[str, List[float]]]] = None
    if folder:
        folder_path = (base / folder).resolve()
        if str(folder_path).startswith(str(base.resolve())) and folder_path.is_dir():
            candidate = None
            for p in folder_path.rglob("*.csv"):
                if p.name.lower().startswith("lap_times"):
                    candidate = p
                    break
            if not candidate:
                for p in folder_path.rglob("*.csv"):
                    candidate = p
                    if candidate:
                        break
            if candidate:
                sections_times = _extract_sections(candidate)
                if not sections_times:
                    times = _extract_lap_times(candidate)
    elif file:
        file_path = (base / file).resolve()
        if str(file_path).startswith(str(base.resolve())) and file_path.is_file():
            if file_path.suffix.lower() == ".csv":
                sections_times = _extract_sections(file_path)
                if not sections_times:
                    times = _extract_lap_times(file_path)

    if sections_times:
        laps, times_by_section = sections_times
        sections = list(times_by_section.keys())
        return {"sections": sections, "laps": laps, "timesBySection": times_by_section, "track": track, "file": file or folder}

    laps = list(range(1, len(times) + 1)) if times else list(range(1, 25))
    if not times:
        times = [93.2, 92.9, 92.7, 92.6, 92.5, 92.8, 93.1, 93.4, 93.9, 94.2, 94.7, 95.1, 95.6, 96.0, 96.4, 96.8, 97.2, 97.5, 97.9, 98.3, 98.8, 99.1, 99.5, 99.9][: len(laps)]

    sections = ["S1.a", "S1.b", "S2.a", "S2.b", "S3.a", "S3.b"]
    # Even split if section data not available (placeholder weights can be tuned per track)
    weights = [1 / 6.0] * 6
    times_by_section = {s: [] for s in sections}
    for t in times:
        for s, w in zip(sections, weights):
            times_by_section[s].append(round(t * w, 3))

    return {"sections": sections, "laps": laps, "timesBySection": times_by_section, "track": track, "file": file or folder}


@app.get("/telemetry/series")
async def telemetry_series(folder: Optional[str] = Query(default=None), file: Optional[str] = Query(default=None), limit: int = 500):
    base = _datasets_base()
    # Default to first available dataset folder when none provided
    if not file and not folder:
        folder = _first_dataset_folder()
    path = None
    if folder:
        p = (base / folder).resolve()
        if str(p).startswith(str(base.resolve())) and p.is_dir():
            # choose first csv as a sample stream
            for c in p.rglob("*.csv"):
                path = c
                break
    elif file:
        p = (base / file).resolve()
        if str(p).startswith(str(base.resolve())) and p.is_file():
            path = p

    if not path or not path.exists():
        # empty series
        return {"series": []}

    fields = {
        "speed": ["Speed", "speed", "mph", "kmh", "km/h"],
        "gear": ["Gear", "gear"],
        "throttle": ["ath", "aps", "Throttle", "throttle"],
        "brake_f": ["pbrake_f", "brake_f", "brake"],
        "brake_r": ["pbrake_r", "brake_r"],
        "accx": ["accx_can", "accx"],
        "accy": ["accy_can", "accy"],
        "steering": ["Steering_Angle", "steering", "steering_angle"],
        "timestamp": ["timestamp", "meta_time", "time"],
    }

    def pick(headers, keys):
        for k in keys:
            if k in headers:
                return k
        return None

    data = {k: [] for k in ["speed", "gear", "throttle", "brake_f", "brake_r", "accx", "accy", "steering"]}
    t_key = None

    with path.open("r", newline="", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        headers = [h.strip() for h in (reader.fieldnames or [])]
        t_key = pick(headers, fields["timestamp"]) or None
        picks = {k: pick(headers, fields[k]) for k in data.keys()}

        count = 0
        for row in reader:
            for k, col in picks.items():
                if not col:
                    continue
                val = row.get(col)
                if val is None or val == "":
                    data[k].append(None)
                else:
                    try:
                        num = float(val)
                        data[k].append(num)
                    except:
                        try:
                            data[k].append(float(val.replace(",", "")))
                        except:
                            data[k].append(None)
            count += 1
            if count >= limit:
                break

    # convert speed to mph if appears km/h
    # heuristic: if typical values > 120, we assume km/h and convert
    if data["speed"]:
        vals = [v for v in data["speed"] if v is not None]
        if vals and (sum(1 for v in vals if v > 120) > len(vals) / 2):
            data["speed"] = [round(v * 0.621371, 2) if v is not None else None for v in data["speed"]]

    return {"series": data, "file": str(path.relative_to(base))}

def _extract_sections(csv_path: Path) -> Optional[Tuple[List[int], Dict[str, List[float]]]]:
    """Parse CSV for per-section columns if present.
    Supports either S1.a..S3.b or IM1a, IM1, IM2a, IM2, IM3a, FL.
    Returns (laps, timesBySection) or None if not found.
    """
    try:
        with csv_path.open("r", newline="", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            headers = [h.strip() for h in (reader.fieldnames or [])]
            # accepted section column variants
            s_names = ["S1.a", "S1.b", "S2.a", "S2.b", "S3.a", "S3.b"]
            im_names = ["IM1a", "IM1", "IM2a", "IM2", "IM3a", "FL"]
            # normalise a function to get numeric from value
            def to_num(v: str) -> Optional[float]:
                if v is None or v == "":
                    return None
                try:
                    x = float(v)
                    return x / 1000.0 if abs(x) > 1000 else x
                except:
                    try:
                        return float(v.replace(",", ""))
                    except:
                        return None

            lap_key = None
            for k in ["lap", "Lap", "lap_number", "LapNumber"]:
                if k in headers:
                    lap_key = k
                    break

            # Decide which section naming exists
            active = None
            if all(name in headers for name in s_names):
                active = s_names
            elif all(name in headers for name in im_names):
                active = im_names
            if not active:
                return None

            # Aggregate per lap
            per_lap: Dict[int, Dict[str, float]] = {}
            for row in reader:
                lap_num = None
                if lap_key and row.get(lap_key):
                    try:
                        lap_num = int(float(row[lap_key]))
                    except:
                        lap_num = None
                if lap_num is None:
                    # if no lap column, assume one row per lap and increment
                    lap_num = len(per_lap) + 1
                if lap_num not in per_lap:
                    per_lap[lap_num] = {name: 0.0 for name in active}
                for name in active:
                    val = to_num(row.get(name))
                    if val is not None:
                        per_lap[lap_num][name] += float(val)

            if not per_lap:
                return None
            laps = sorted(per_lap.keys())
            times_by_section: Dict[str, List[float]] = {name: [] for name in active}
            for lap in laps:
                for name in active:
                    times_by_section[name].append(round(per_lap[lap].get(name, 0.0), 3))
            return laps, times_by_section
    except Exception:
        return None
