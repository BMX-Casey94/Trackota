const { firstDatasetFolder, findCandidateCsv, telemetryFromCsv } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    const car = req.query.car ? String(req.query.car).trim() : null;
    if (!folder) folder = await firstDatasetFolder();
    if (!folder) return res.status(200).json({ series: [] });
    const candidate = await findCandidateCsv(folder);
    if (!candidate) return res.status(200).json({ series: [] });
    const series = await telemetryFromCsv(candidate, 500, car || null);
    return res.status(200).json({ series, file: folder });
  } catch {
    return res.status(200).json({ series: [] });
  }
};


