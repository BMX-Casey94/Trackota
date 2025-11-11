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
    // pit window by largest positive jump
    let pitStart = null;
    let maxJump = 0;
    for (let i = 1; i < times.length; i++) {
      const jump = times[i] - times[i - 1];
      if (jump > maxJump) {
        maxJump = jump;
        pitStart = i + 1;
      }
    }
    if (pitStart === null) pitStart = Math.max(2, Math.floor(times.length * 0.5));
    const caution = Math.min(times.length, pitStart + 2);
    return res.status(200).json([
      { style: "optimal", text: `BOX on Lap ${pitStart} — Tyre: Hard — Risk: Low`, reason: "Largest time loss detected suggests pit window opening." },
      { style: "caution", text: `Defer to Lap ${caution} — Tyre: Medium — Risk: Medium`, reason: "Later stop protects track position; watch for Safety Car." },
    ]);
  } catch {
    return res.status(200).json([]);
  }
};


