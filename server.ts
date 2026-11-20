import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dataEngine, evaluatePublishGate } from './server/pipeline';
import { analyticsEngine } from './server/analytics';
import { LOCATION_MASTER } from './server/locations';
import { marketArchive } from './server/archive';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory enterprise / procurement inquiries lead capture
interface EnterpriseInquiry {
  id: string;
  name: string;
  email: string;
  company: string;
  use_case: 'Bulk Historical Data' | 'Procurement API Feed' | 'ERP Integration' | 'Custom Mandi Coverage';
  message: string;
  created_at: string;
}

const enterpriseInquiries: EnterpriseInquiry[] = [
  {
    id: 'inq_001',
    name: 'Tariq Mehmood',
    email: 'procurement@nationalfoods.com.pk',
    company: 'National Foods Limited',
    use_case: 'Procurement API Feed',
    message: 'Evaluating automated wholesale wheat and pulse mandi feed for ERP purchase orders.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// --- REST API Endpoints ---

// 1. Commodities Endpoint (with optional city filter)
app.get('/api/commodities', (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city : 'All';
  const records = analyticsEngine.computeAllCommodityRecords(city);
  res.json(records);
});

// 2. Specific Commodity Details with real archived time series and verification metadata
app.get('/api/commodities/:id', (req, res) => {
  const records = analyticsEngine.computeAllCommodityRecords('All');
  const match = records.find(r => r.id === req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Commodity not found in 51-item PBS SPI Canonical Master' });
  }

  const crossVals = dataEngine.getCrossValidations().filter(cv => cv.commodity_id === req.params.id);
  const fullHistory = dataEngine.getHistoricalSeries(req.params.id, 'All');

  res.json({
    ...match,
    historySeries: fullHistory,
    regionalCrossValidation: crossVals
  });
});

// 2b. Historical Series Endpoint (National or City-specific from real Appendix-A archives)
app.get('/api/history/:id', (req, res) => {
  const city = typeof req.query.city === 'string' && req.query.city.trim() ? req.query.city.trim() : 'All';
  const series = dataEngine.getHistoricalSeries(req.params.id, city);
  res.json({
    commodity_id: req.params.id,
    city,
    historySeries: series
  });
});

// 3. Source Registry
app.get('/api/sources', (req, res) => {
  res.json(dataEngine.getSources());
});

app.post('/api/sources', (req, res) => {
  const newSource = {
    ...req.body,
    source_id: req.body.source_id || `SRC_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    implementation_status: 'not_implemented' as const,
    parser: req.body.parser || 'CustomEndpointUnimplemented',
    active: false,
    last_success: null,
    last_attempt: null,
    status: 'not_implemented' as const,
    status_detail: 'Registered custom endpoint awaiting parser implementation.',
    total_observations: 0,
    coverage_notes: req.body.coverage_notes || 'Custom user registered endpoint.'
  };
  dataEngine.getSources().push(newSource);
  dataEngine.addLog('info', 'INGEST', `Registered custom market data source (marked not_implemented): ${newSource.name}`);
  res.json(newSource);
});

app.put('/api/sources/:id', (req, res) => {
  const sources = dataEngine.getSources();
  const idx = sources.findIndex(s => s.source_id === req.params.id);
  if (idx > -1) {
    sources[idx] = { ...sources[idx], ...req.body };
    dataEngine.addLog('info', 'INGEST', `Updated configuration for source: ${sources[idx].name}`);
    res.json(sources[idx]);
  } else {
    res.status(404).json({ error: 'Source not found' });
  }
});

app.delete('/api/sources/:id', (req, res) => {
  const sources = dataEngine.getSources();
  const idx = sources.findIndex(s => s.source_id === req.params.id);
  if (idx > -1) {
    const deleted = sources.splice(idx, 1);
    dataEngine.addLog('warn', 'INGEST', `Removed source from registry: ${deleted[0].name}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Source not found' });
  }
});

// 4. Daily Pakistan Market Pulse (Publish-Gate Enforced)
app.get('/api/market-pulse', (req, res) => {
  const targetDate = typeof req.query.date === 'string' && req.query.date.trim() ? req.query.date.trim() : undefined;
  const pulse = analyticsEngine.generateMarketPulse(targetDate);
  res.json(pulse);
});

// 5. Publish Gate & System Verification Status
app.get('/api/publish-gate', (req, res) => {
  const gate = evaluatePublishGate(dataEngine.getLatestPbsReport());
  res.json({
    gate,
    archive: dataEngine.getArchiveStats(),
    forex: dataEngine.getLatestForex(),
    last_pipeline_error: dataEngine.getLastPipelineError()
  });
});

// 6. Archived PBS SPI Weekly Releases Metadata
app.get('/api/archive/weeks', (req, res) => {
  const weeks = marketArchive.getAllPbsReportsDescending().map(r => ({
    week_ended_date: r.week_ended_date,
    week_ended_formatted: r.week_ended_formatted,
    published_date: r.published_date,
    spi_combined_index: r.spi_combined_index,
    spi_combined_wow_change: r.spi_combined_wow_change,
    spi_combined_yoy_change: r.spi_combined_yoy_change,
    total_items: r.total_items,
    annex_status: r.annex_status,
    source_page_url: r.source_page_url
  }));
  res.json(weeks);
});

// 7. Locations / Cities
app.get('/api/cities', (req, res) => {
  res.json(LOCATION_MASTER);
});

app.put('/api/cities/:id', (req, res) => {
  const loc = LOCATION_MASTER.find(l => l.id === req.params.id || l.city.toLowerCase() === req.params.id.toLowerCase());
  if (loc) {
    if (typeof req.body.isEnabled === 'boolean') {
      loc.isEnabled = req.body.isEnabled;
    }
    res.json(LOCATION_MASTER);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
});

// 8. Source Verification Matrix
app.get('/api/cross-validations', (req, res) => {
  res.json(dataEngine.getCrossValidations());
});

// 9. Pipeline execution
app.post('/api/pipeline/run', async (req, res) => {
  try {
    const result = await dataEngine.executePipeline({ backfillLimit: 20 });
    res.json({ success: result.gate.status === 'PASSED', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Pipeline Execution Logs
app.get('/api/logs', (req, res) => {
  res.json(dataEngine.getLogs());
});

// 11. Enterprise / Commercial Access Lead Inquiries
app.post('/api/enterprise/inquiry', (req, res) => {
  const { name, email, company, use_case, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const inquiry: EnterpriseInquiry = {
    id: `inq_${Date.now().toString(36)}`,
    name,
    email,
    company: company || 'Independent Enterprise',
    use_case: use_case || 'Bulk Historical Data',
    message: message || '',
    created_at: new Date().toISOString()
  };

  enterpriseInquiries.unshift(inquiry);
  dataEngine.addLog('info', 'PUBLISH', `Enterprise commercial lead recorded from ${name} (${company}) - ${use_case}`);
  res.json({ success: true, inquiry });
});

app.get('/api/enterprise/inquiries', (req, res) => {
  res.json(enterpriseInquiries);
});

// --- Server Lifecycle & Vite Middleware ---

async function start() {
  const distPath = path.join(process.cwd(), 'dist');
  const isCjsBundle = typeof __filename !== 'undefined' && __filename.endsWith('.cjs');
  const isProduction = process.env.NODE_ENV === 'production' || isCjsBundle;

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pakistan Market Intelligence server running on http://0.0.0.0:${PORT}`);
    dataEngine.executePipeline({ backfillLimit: 18 }).catch(err => {
      console.error('Initial pipeline execution error:', err);
    });
  });
}

start();
