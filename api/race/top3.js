const { firstDatasetFolder, findCandidateCsv, extractLapTimes } = require("../_utils");

module.exports = async (req, res) => {
  try {
    const folder = req.query.folder || (await firstDatasetFolder());
    let times = [];
    if (folder) {
      const candidate = await findCandidateCsv(folder);
      if (candidate) {
        times = await extractLapTimes(candidate);
      }
    }
    if (!times.length) return res.status(200).json([]);
    const lapTimes = times.map((t, i) => [i + 1, t]);
    lapTimes.sort((a, b) => a[1] - b[1]);
    const best = lapTimes[0][1];
    const out = lapTimes.slice(0, 3).map(([lap, t], idx) => ({
      pos: idx + 1,
      name: `Lap ${lap}`,
      gap: idx === 0 ? "+0.0s" : `+${(t - best).toFixed(1)}s`,
    }));
    return res.status(200).json(out);
  } catch {
    return res.status(200).json([]);
  }
};


