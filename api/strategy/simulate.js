module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const pitLapInput = Number(body.pitLap) || 1;
    const compound = String(body.compound || "Hard");
    const safetyCar = Boolean(body.safetyCar);

    const { firstDatasetFolder, extractLapTimesForCar } = require("../_utils");
    const folder = typeof req.query?.folder === "string" ? req.query.folder : await firstDatasetFolder();
    const car = typeof req.query?.car === "string" ? req.query.car : null;

    // Use real lap times for the selected car as the simulation baseline when available.
    let base = [];
    if (folder && car) {
      try {
        base = await extractLapTimesForCar(folder, car);
      } catch {}
    }

    // If no real data, fall back to a simple synthetic baseline (kept for resilience).
    let total = base.length;
    if (!total) {
      // Decide total laps from folder naming if possible; otherwise default to 45.
      const folderLower = String(folder || "").toLowerCase();
      const isRace1 = /race[\s_-]*1/.test(folderLower);
      const isRace2 = /race[\s_-]*2/.test(folderLower);
      total = isRace1 ? 19 : isRace2 ? 16 : 45;
      base = Array.from({ length: total }, (_, i) => 93.0 + i * 0.25);
    }

    const pitLap = Math.min(Math.max(1, pitLapInput), total);
    const times = base.slice();

    // Apply a simple compound effect after the pit lap.
    const gainMap = { Soft: -1.8, Medium: -1.2, Hard: -0.6 };
    const gain = gainMap[compound] ?? -1.0;
    if (pitLap >= 1 && pitLap <= total) {
      for (let i = pitLap - 1; i < total; i++) {
        const val = times[i] + gain;
        times[i] = Number((val < 0 ? 0 : val).toFixed(3));
      }
    }

    // Safety car: slow down the next 1-2 laps by ~7% of lap time (bounded).
    if (safetyCar && pitLap + 1 < total) {
      const idx = Math.max(0, Math.min(total - 1, pitLap));
      const delta1 = Math.max(5, Math.min(16, times[idx] * 0.07));
      const delta2 = Math.max(6, Math.min(17, times[idx] * 0.075));
      times.splice(idx, Math.min(2, total - idx), Number((times[idx] + delta1).toFixed(3)), Number((times[idx] + delta2).toFixed(3)));
    }

    return res.status(200).json({ laps: Array.from({ length: total }, (_, i) => i + 1), times });
  } catch {
    return res.status(200).json({ laps: [], times: [] });
  }
};


