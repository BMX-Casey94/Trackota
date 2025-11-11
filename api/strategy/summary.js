const path = require("path");
const {
  datasetsBase,
  firstDatasetFolder,
  extractLapTimes,
  findCandidateCsv,
  computePitWindow,
  findWeatherCsv,
  extractWeatherSummary,
} = require("../_utils");

module.exports = async (req, res) => {
  try {
    const base = datasetsBase();
    const folder = req.query.folder || (await firstDatasetFolder());
    let times = [];
    if (folder) {
      const candidate = await findCandidateCsv(folder);
      if (candidate) {
        times = await extractLapTimes(candidate);
      }
    }
    const total = times.length;

    // Compute simple tyre wear estimate: last 3 laps vs best lap
    let tyreWearPct = null;
    if (total > 3) {
      const best = Math.min(...times);
      const lastThree = times.slice(-3);
      const lastMean = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
      tyreWearPct = Math.max(0, Math.min(100, Math.round(((lastMean - best) / best) * 100)));
    }

    // Compute simple stint laps from pit window heuristic
    let lapsOnTyre = null;
    if (total > 0) {
      const pitWindow = computePitWindow(times);
      if (pitWindow && pitWindow.start != null) {
        lapsOnTyre = Math.max(0, total - pitWindow.start + 1);
      }
    }

    // Weather summary if available
    let weather = null;
    if (folder) {
      const wCsv = await findWeatherCsv(folder);
      if (wCsv) {
        weather = await extractWeatherSummary(wCsv);
      }
    }

    res.status(200).json({
      currentLap: total || null,
      totalLaps: total || null,
      session: "Race",
      weather: weather || null,
      position: null,
      gapAhead: null,
      gapBehind: null,
      tyre: null,
      lapsOnTyre: lapsOnTyre,
      tyreWearPct: tyreWearPct,
      fuelPct: null,
    });
  } catch (e) {
    res.status(200).json({
      currentLap: null,
      totalLaps: null,
      session: "Race",
      weather: null,
      position: null,
      gapAhead: null,
      gapBehind: null,
      tyre: null,
      lapsOnTyre: null,
      tyreWearPct: null,
      fuelPct: null,
    });
  }
};


