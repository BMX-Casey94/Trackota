const path = require("path");
const { listDatasets } = require("./_utils");

module.exports = async (req, res) => {
  try {
    const out = await listDatasets();
    res.status(200).json(out);
  } catch (e) {
    res.status(200).json({ path: "", files: [] });
  }
};


