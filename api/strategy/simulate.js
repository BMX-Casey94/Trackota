module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const pitLapInput = Number(body.pitLap) || 26;
    const compound = String(body.compound || "Hard");
    const safetyCar = Boolean(body.safetyCar);
    const folder = typeof req.query?.folder === "string" ? req.query.folder : "";
    // Decide race total based on selected dataset folder (Race 1 => 19, Race 2 => 16). Fallback to 45.
    const folderLower = folder.toLowerCase();
    const isRace1 = /race[\s_-]*1/.test(folderLower);
    const isRace2 = /race[\s_-]*2/.test(folderLower);
    const total = isRace1 ? 19 : isRace2 ? 16 : 45;
    const pitLap = Math.min(Math.max(1, pitLapInput), total);
    const base = Array.from({ length: total }, (_, i) => 93.0 + i * 0.25);
    const times = base.slice();
    const gainMap = { Soft: -1.8, Medium: -1.2, Hard: -0.6 };
    const gain = gainMap[compound] ?? -1.0;
    if (pitLap >= 1 && pitLap <= total) {
      for (let i = pitLap - 1; i < total; i++) {
        times[i] = Math.max(80.0, times[i] + gain);
      }
    }
    if (safetyCar && pitLap + 1 < total) {
      const idx = Math.max(0, Math.min(total - 1, pitLap));
      times.splice(idx, Math.min(2, total - idx), times[idx] + 10.0, times[idx] + 10.5);
    }
    return res.status(200).json({ laps: Array.from({ length: total }, (_, i) => i + 1), times });
  } catch {
    return res.status(200).json({ laps: [], times: [] });
  }
};


