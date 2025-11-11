const { firstDatasetFolder, findClassificationCsv, listCarsFromClassification } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    if (!folder) folder = await firstDatasetFolder();
    if (!folder) return res.status(200).json({ cars: [] });
    const cls = await findClassificationCsv(folder);
    if (!cls) return res.status(200).json({ cars: [] });
    const cars = await listCarsFromClassification(cls);
    return res.status(200).json({ cars, folder });
  } catch {
    return res.status(200).json({ cars: [] });
  }
};


