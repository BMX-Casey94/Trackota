const { firstDatasetFolder, extractLapTimesForCar, computePitWindow } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    const car = req.query.car ? String(req.query.car).trim() : null;
    if (!folder) folder = await firstDatasetFolder();
    let times = [];
    const fileRel = folder || null;
    if (folder && car) {
      times = await extractLapTimesForCar(folder, car);
    }
    const laps = Array.from({ length: times.length }, (_, i) => i + 1);
    const pitWindow = times.length ? computePitWindow(times) : null;
    return res.status(200).json({ laps, times, pitWindow, file: fileRel });
  } catch {
    return res.status(200).json({ laps: [], times: [], pitWindow: null, file: null });
  }
};


