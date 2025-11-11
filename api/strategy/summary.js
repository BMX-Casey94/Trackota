const path = require("path");
const { datasetsBase, firstDatasetFolder, extractLapTimes, findCandidateCsv } = require("../_utils");

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
    res.status(200).json({
      currentLap: total || null,
      totalLaps: total || null,
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


