const { firstDatasetFolder, findAnalysisSectionsCsv, extractSections } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    const car = req.query.car ? String(req.query.car).trim() : null;
    if (!folder) folder = await firstDatasetFolder();
    let fileRel = folder || null;
    let out = null;
    if (folder) {
      const candidate = await findAnalysisSectionsCsv(folder);
      if (candidate) {
        out = await extractSections(candidate, car || null);
      }
    }
    if (out) {
      const { laps, timesBySection } = out;
      return res.status(200).json({ sections: Object.keys(timesBySection), laps, timesBySection, file: fileRel });
    }
    return res.status(200).json({ sections: [], laps: [], timesBySection: {}, file: fileRel });
  } catch {
    return res.status(200).json({ sections: [], laps: [], timesBySection: {}, file: null });
  }
};


