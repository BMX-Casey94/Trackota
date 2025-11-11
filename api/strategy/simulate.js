module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const pitLap = Number(body.pitLap) || 26;
    const compound = String(body.compound || "Hard");
    const safetyCar = Boolean(body.safetyCar);
    const total = 45;
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
      times.splice(pitLap, 2, times[pitLap] + 10.0, times[pitLap] + 10.5);
    }
    return res.status(200).json({ laps: Array.from({ length: total }, (_, i) => i + 1), times });
  } catch {
    return res.status(200).json({ laps: [], times: [] });
  }
};


