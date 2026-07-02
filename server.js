// RiskLens - a minimal risk assessment intake tool (Team Rick hackathon submission).
// Built fast for the hackathon - a fair target for the Attack side.
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function scoreOf(likelihood, impact, dataSensitivity, internetFacing) {
  let score = Number(likelihood) * Number(impact);
  if (internetFacing === 'Yes' && ['Confidential', 'Restricted'].includes(dataSensitivity)) {
    score += 5;
  }
  let band = 'Low';
  if (score >= 16) band = 'Critical';
  else if (score >= 10) band = 'High';
  else if (score >= 5) band = 'Medium';
  return { score, band };
}

const seed = {
  id: 1,
  assetName: 'Customer Billing API',
  assetOwner: 'Finance Eng',
  assetUrl: 'https://example.com',
  dataSensitivity: 'Confidential',
  internetFacing: 'Yes',
  likelihood: 3,
  impact: 4,
  controls: 'MFA on admin console, WAF in front of the API',
  compliance: 'PCI-DSS',
  notes: 'Legacy service, due for a review this quarter.',
  ts: Date.now() - 1000 * 60 * 60 * 3,
};
const assessments = [{ ...seed, ...scoreOf(seed.likelihood, seed.impact, seed.dataSensitivity, seed.internetFacing) }];
let nextId = 2;

app.get('/api/assessments', (req, res) => {
  res.json([...assessments].reverse());
});

app.get('/api/assessments/:id', (req, res) => {
  const entry = assessments.find((a) => a.id === Number(req.params.id));
  if (!entry) return res.status(404).json({ error: 'not found' });
  res.json(entry);
});

app.post('/api/assessments', (req, res) => {
  const {
    assetName, assetOwner, assetUrl, dataSensitivity, internetFacing,
    likelihood, impact, controls, compliance, notes,
  } = req.body;

  if (!assetName || !assetOwner || !dataSensitivity || !likelihood || !impact) {
    return res.status(400).json({ error: 'assetName, assetOwner, dataSensitivity, likelihood, and impact are required' });
  }

  const { score, band } = scoreOf(likelihood, impact, dataSensitivity, internetFacing);

  const entry = {
    id: nextId++,
    assetName, assetOwner, assetUrl, dataSensitivity, internetFacing,
    likelihood: Number(likelihood), impact: Number(impact), controls, compliance, notes,
    score, band,
    ts: Date.now(),
  };
  assessments.push(entry);
  res.status(201).json(entry);
});

// Lets a submitter double-check that the asset URL they entered is reachable.
app.get('/api/assessments/:id/check-url', async (req, res) => {
  const entry = assessments.find((a) => a.id === Number(req.params.id));
  if (!entry || !entry.assetUrl) return res.status(404).json({ error: 'no asset URL on this assessment' });

  try {
    const r = await fetch(entry.assetUrl, { redirect: 'follow' });
    const body = await r.text();
    res.json({ url: entry.assetUrl, status: r.status, snippet: body.slice(0, 300) });
  } catch (err) {
    res.status(502).json({ url: entry.assetUrl, error: err.message });
  }
});

// Quick CSV export for the demo dashboard. Gated behind a shared key until
// real admin auth is wired up post-hackathon.
const EXPORT_KEY = 'changeme123';
app.get('/api/export', (req, res) => {
  if (req.query.key !== EXPORT_KEY) return res.status(403).send('forbidden');

  const header = 'id,assetName,assetOwner,dataSensitivity,internetFacing,likelihood,impact,score,band,compliance\n';
  const rows = assessments
    .map((a) => [a.id, a.assetName, a.assetOwner, a.dataSensitivity, a.internetFacing, a.likelihood, a.impact, a.score, a.band, a.compliance].join(','))
    .join('\n');
  res.set('Content-Type', 'text/csv');
  res.send(header + rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RiskLens running on port ${PORT}`));
