const { firstDatasetFolder, findCandidateCsv, extractLapTimes, computePitWindow } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    if (!folder) folder = await firstDatasetFolder();
    let times = [];
    let fileRel = null;
    if (folder) {
      const candidate = await findCandidateCsv(folder);
      if (candidate) {
        times = await extractLapTimes(candidate);
        fileRel = folder;
      }
    }
    if (!times.length) {
      times = [93.2, 92.9, 92.7, 92.6, 92.5, 92.8, 93.1, 93.4, 93.9, 94.2, 94.7, 95.1, 95.6, 96.0, 96.4, 96.8, 97.2, 97.5, 97.9, 98.3, 98.8, 99.1, 99.5, 99.9];
    }
    const laps = Array.from({ length: times.length }, (_, i) => i + 1);
    const pitWindow = computePitWindow(times);
    return res.status(200).json({ laps, times, pitWindow, file: fileRel });
  } catch {
    return res.status(200).json({ laps: [], times: [], pitWindow: null, file: null });
  }
};


