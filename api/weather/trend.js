const { firstDatasetFolder, findWeatherCsv, readCsvDicts } = require("../_utils");

module.exports = async (req, res) => {
  try {
    let folder = req.query.folder || null;
    if (!folder) folder = await firstDatasetFolder();
    if (!folder) return res.status(200).json({ labels: [], air: [], track: [] });

    const wCsv = await findWeatherCsv(folder);
    if (!wCsv) return res.status(200).json({ labels: [], air: [], track: [] });

    const { headers, rows } = await readCsvDicts(wCsv, 5000);
    const idxSec = headers.findIndex((h) => /TIME[_\s-]?UTC[_\s-]?SECONDS/i.test(h));
    const idxStr = headers.findIndex((h) => /TIME[_\s-]?UTC[_\s-]?STR/i.test(h));
    const idxAir = headers.findIndex((h) => /AIR[_\s-]?TEMP/i.test(h));
    const idxTrack = headers.findIndex((h) => /TRACK[_\s-]?TEMP/i.test(h));

    const labels = [];
    const air = [];
    const track = [];

    for (const r of rows) {
      let label = null;
      if (idxSec !== -1) {
        const s = Number(String(r[headers[idxSec]]).trim());
        if (!Number.isNaN(s)) {
          const d = new Date(s * 1000);
          label = d.toISOString().substring(11, 16); // HH:MM
        }
      }
      if (!label && idxStr !== -1) {
        const s = String(r[headers[idxStr]]);
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) label = d.toISOString().substring(11, 16);
      }
      if (!label) continue;

      const parse = (val) => {
        if (val == null) return null;
        const n = parseFloat(String(val).replace(",", "."));
        return Number.isFinite(n) ? Number(n.toFixed(1)) : null;
      };

      const a = idxAir !== -1 ? parse(r[headers[idxAir]]) : null;
      const t = idxTrack !== -1 ? parse(r[headers[idxTrack]]) : null;
      labels.push(label);
      air.push(a);
      track.push(t);
    }

    return res.status(200).json({ labels, air, track, folder });
  } catch {
    return res.status(200).json({ labels: [], air: [], track: [] });
  }
};


