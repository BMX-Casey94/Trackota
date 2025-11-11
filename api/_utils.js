const fs = require("fs");
const path = require("path");

function datasetsBase() {
  const envBase = process.env.TRACKOTA_DATASETS_DIR;
  const defaultBase = path.join(process.cwd(), "data", "datasets");
  return envBase ? envBase : defaultBase;
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

async function readCsvDicts(filePath, limit = 50000) {
  const content = await fs.promises.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!lines.length) return [];
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const out = [];
  for (let i = 1; i < lines.length && out.length < limit; i++) {
    const cols = splitCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cols[j] !== undefined ? cols[j] : "";
    }
    out.push(row);
  }
  return { headers, rows: out };
}

async function listDatasets() {
  const base = datasetsBase();
  const items = [];
  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
        const csvCount = await countCsv(full);
        if (csvCount > 0) {
          items.push({
            kind: "directory",
            name: ent.name,
            relativePath: path.relative(base, full).split(path.sep).join("/"),
            csvCount,
            track: ent.name,
          });
        }
      } else if (ent.isFile()) {
        if (ent.name.toLowerCase().endsWith(".csv") || ent.name.toLowerCase().endsWith(".zip")) {
          items.push({
            kind: "file",
            name: ent.name,
            relativePath: path.relative(base, full).split(path.sep).join("/"),
            size: (await fs.promises.stat(full)).size,
          });
        }
      }
    }
  }
  try {
    await walk(base);
  } catch {}
  return { path: base, files: items };
}

async function countCsv(dir) {
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    let n = 0;
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        n += await countCsv(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".csv")) {
        n += 1;
      }
    }
    return n;
  } catch {
    return 0;
  }
}

async function firstDatasetFolder() {
  const base = datasetsBase();
  async function find(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const csvCount = await countCsv(full);
        if (csvCount > 0) {
          return path.relative(base, full).split(path.sep).join("/");
        }
        const child = await find(full);
        if (child) return child;
      }
    }
    return null;
  }
  try {
    return await find(base);
  } catch {
    return null;
  }
}

async function findCandidateCsv(folderRel) {
  const base = datasetsBase();
  const folder = path.join(base, folderRel);
  let candidate = null;
  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".csv")) {
        if (ent.name.toLowerCase().startsWith("lap_times")) {
          candidate = full;
          return;
        }
        if (!candidate) candidate = full;
      }
    }
  }
  try {
    await walk(folder);
  } catch {}
  return candidate;
}

function toFloat(val) {
  if (val === null || val === undefined || val === "") return null;
  const s = String(val).replace(",", "");
  const n = Number(s);
  if (Number.isNaN(n)) return null;
  return n;
}

async function extractLapTimes(filePath) {
  try {
    const { headers, rows } = await readCsvDicts(filePath);
    const lapTimeKeys = ["lap_time", "laptime", "lapTime", "LapTime", "lap_time_seconds", "laptime_s", "laptime_ms"];
    const lapKeys = ["lap", "Lap", "lap_number", "LapNumber"];
    const tsKeys = ["timestamp", "Timestamp", "time", "meta_time"];
    const ltKey = lapTimeKeys.find((k) => headers.includes(k)) || null;
    const lapKey = lapKeys.find((k) => headers.includes(k)) || null;
    const tsKey = tsKeys.find((k) => headers.includes(k)) || null;
    if (ltKey) {
      const map = new Map();
      for (const row of rows) {
        const lapNum = lapKey ? toFloat(row[lapKey]) : null;
        let t = toFloat(row[ltKey]);
        if (t === null) continue;
        if (ltKey.endsWith("_ms")) t = t / 1000.0;
        if (lapNum === null) map.set(map.size + 1, t);
        else if (!map.has(lapNum)) map.set(lapNum, t);
      }
      const out = Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([, t]) => t);
      if (out.length) return out;
    }
    if (lapKey && tsKey) {
      let lastLap = null;
      let lastTs = null;
      const out = new Map();
      for (const row of rows) {
        const lap = toFloat(row[lapKey]);
        if (lap === null) continue;
        let ts = toFloat(row[tsKey]);
        if (ts === null) continue;
        if (lastLap === null) {
          lastLap = lap;
          lastTs = ts;
          continue;
        }
        if (lap !== lastLap) {
          let dt = Math.max(0, ts - (lastTs || 0));
          if (dt > 1000) dt = dt / 1000.0;
          out.set(lastLap, dt);
          lastLap = lap;
          lastTs = ts;
        }
      }
      if (out.size) return Array.from(out.entries()).sort((a, b) => a[0] - b[0]).map(([, t]) => t);
    }
  } catch {}
  return [];
}

async function extractSections(filePath) {
  try {
    const { headers, rows } = await readCsvDicts(filePath);
    const sNames = ["S1.a", "S1.b", "S2.a", "S2.b", "S3.a", "S3.b"];
    const imNames = ["IM1a", "IM1", "IM2a", "IM2", "IM3a", "FL"];
    const lapKeys = ["lap", "Lap", "lap_number", "LapNumber"];
    let active = null;
    if (sNames.every((n) => headers.includes(n))) active = sNames;
    else if (imNames.every((n) => headers.includes(n))) active = imNames;
    if (!active) return null;
    const lapKey = lapKeys.find((k) => headers.includes(k)) || null;
    const perLap = new Map();
    for (const row of rows) {
      let lap = lapKey ? toFloat(row[lapKey]) : null;
      if (lap === null) lap = perLap.size + 1;
      if (!perLap.has(lap)) perLap.set(lap, Object.fromEntries(active.map((n) => [n, 0])));
      for (const name of active) {
        const v = toFloat(row[name]);
        if (v !== null) {
          const adjusted = Math.abs(v) > 1000 ? v / 1000.0 : v;
          perLap.get(lap)[name] += adjusted;
        }
      }
    }
    const laps = Array.from(perLap.keys()).sort((a, b) => a - b);
    const timesBySection = Object.fromEntries(active.map((n) => [n, []]));
    for (const lap of laps) {
      for (const name of active) {
        timesBySection[name].push(Number(perLap.get(lap)[name].toFixed(3)));
      }
    }
    return { laps, timesBySection };
  } catch {
    return null;
  }
}

async function telemetryFromCsv(filePath, limit = 500) {
  const fields = {
    speed: ["Speed", "speed", "mph", "kmh", "km/h"],
    gear: ["Gear", "gear"],
    throttle: ["ath", "aps", "Throttle", "throttle"],
    brake_f: ["pbrake_f", "brake_f", "brake"],
    brake_r: ["pbrake_r", "brake_r"],
    accx: ["accx_can", "accx"],
    accy: ["accy_can", "accy"],
    steering: ["Steering_Angle", "steering", "steering_angle"],
    timestamp: ["timestamp", "meta_time", "time", "Timestamp"],
  };
  try {
    const { headers, rows } = await readCsvDicts(filePath, limit);
    const picks = {};
    for (const key of Object.keys(fields)) {
      picks[key] = fields[key].find((k) => headers.includes(k)) || null;
    }
    const data = {
      speed: [],
      gear: [],
      throttle: [],
      brake_f: [],
      brake_r: [],
      accx: [],
      accy: [],
      steering: [],
    };
    for (const row of rows) {
      for (const k of Object.keys(data)) {
        const col = picks[k];
        if (!col) {
          data[k].push(null);
          continue;
        }
        const v = toFloat(row[col]);
        data[k].push(v);
      }
    }
    // Convert km/h to mph if most values > 120
    if (data.speed && data.speed.filter((v) => v !== null).length) {
      const vals = data.speed.filter((v) => v !== null);
      const kmh = vals.filter((v) => v > 120).length > vals.length / 2;
      if (kmh) {
        data.speed = data.speed.map((v) => (v !== null ? Number((v * 0.621371).toFixed(2)) : null));
      }
    }
    return data;
  } catch {
    return {};
  }
}

function computePitWindow(times) {
  let pitStart = null;
  let maxJump = 0.0;
  for (let i = 1; i < times.length; i++) {
    const jump = times[i] - times[i - 1];
    if (jump > maxJump) {
      maxJump = jump;
      pitStart = i + 1;
    }
  }
  if (pitStart === null) pitStart = Math.max(2, Math.floor(times.length * 0.5));
  const pitEnd = Math.min(times.length, pitStart + 2);
  return { start: pitStart, end: pitEnd };
}

module.exports = {
  datasetsBase,
  listDatasets,
  firstDatasetFolder,
  findCandidateCsv,
  extractLapTimes,
  extractSections,
  telemetryFromCsv,
  computePitWindow,
};


