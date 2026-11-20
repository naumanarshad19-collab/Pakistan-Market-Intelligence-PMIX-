import { dataEngine, evaluatePublishGate } from '../server/pipeline';
import { analyticsEngine } from '../server/analytics';
import { COMMODITY_MASTER, resolveCommodityExact } from '../server/commodities';
import { LOCATION_MASTER } from '../server/locations';
import { marketArchive } from '../server/archive';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ${GREEN}✓${RESET} ${testName}`);
  } else {
    failed++;
    console.error(`  ${RED}✗${RESET} ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runValidation() {
  console.log(`\n${BOLD}${CYAN}====================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  Pakistan Market Intelligence - Integrity Validation${RESET}`);
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  const startTime = Date.now();

  // --- 1. 1:1 Canonical Master Catalogs & Exact Resolution ---
  console.log(`${BOLD}1. Validating 51-Item Canonical Master & 17 Urban Centers...${RESET}`);
  assert(
    COMMODITY_MASTER.length === 51,
    `Commodity Master contains exactly 51 PBS SPI items (got ${COMMODITY_MASTER.length})`
  );
  assert(
    LOCATION_MASTER.length === 17,
    `Location Master contains all 17 PBS urban centers (got ${LOCATION_MASTER.length})`
  );

  const uniqueIds = new Set(COMMODITY_MASTER.map((c) => c.id));
  assert(uniqueIds.size === 51, 'All 51 canonical commodity IDs are unique');

  const gur = resolveCommodityExact('Gur (Average Quality)');
  const sugar = resolveCommodityExact('Sugar Refined');
  assert(
    gur?.id === 'gur_jaggery' && sugar?.id === 'sugar_refined',
    'Gur resolves to gur_jaggery separately from sugar_refined'
  );

  const lpg = COMMODITY_MASTER.find((c) => c.id === 'lpg_cylinder');
  assert(
    lpg?.pbs_name === 'LPG 11.67 kg Cylinder' && lpg?.display_unit === 'Each',
    `LPG matches official PBS name (${lpg?.pbs_name}) and unit (${lpg?.display_unit})`
  );

  assert(
    resolveCommodityExact('diesel') === null &&
      resolveCommodityExact('Hi-Speed Diesel')?.id === 'fuel_diesel',
    'Exact lookup rejects partial substring "diesel" and matches "Hi-Speed Diesel"'
  );

  // --- 2. Live Pipeline Execution, Discovery & Clean State Reset ---
  console.log(`\n${BOLD}2. Validating Live PBS Discovery, Parsing & Idempotency...${RESET}`);
  const run1 = await dataEngine.executePipeline({ backfillLimit: 5 });
  assert(
    run1.gate.items_parsed === 51,
    `Live PBS discovery parsed 51/51 items (week ended ${run1.gate.week_ended_date})`
  );
  assert(
    run1.gate.annex_cities_count >= 17,
    `Header-driven Appendix-A parser verified ${run1.gate.annex_cities_count}/17 city columns`
  );
  assert(
    run1.observations > 0,
    `Real observation pool populated (${run1.observations} verified city observations)`
  );

  const crossCount1 = dataEngine.getCrossValidations().length;
  const obsCount1 = dataEngine.getObservations().length;
  await dataEngine.executePipeline({ backfillLimit: 2 });
  const crossCount2 = dataEngine.getCrossValidations().length;
  const obsCount2 = dataEngine.getObservations().length;
  assert(
    crossCount1 === 51 && crossCount2 === 51 && obsCount1 === obsCount2,
    `Repeated pipeline runs reset state cleanly without duplicates (crossVals=${crossCount2}, obs=${obsCount2})`
  );

  // --- 3. Honest Registry State (No Fake AMIS/BOS Stubs) ---
  console.log(`\n${BOLD}3. Validating Honest Source Registry & Zero Fabricated Stubs...${RESET}`);
  const sources = dataEngine.getSources();
  const amis = sources.find((s) => s.source_id === 'AMIS');
  const bos = sources.find((s) => s.source_id === 'PUNJAB_BOS');
  const kca = sources.find((s) => s.source_id === 'KCA');
  const pbs = sources.find((s) => s.source_id === 'PBS_SPI');

  assert(pbs?.status === 'success', `PBS_SPI status is live (${pbs?.status})`);
  assert(
    amis?.status === 'not_implemented' && amis.total_observations === 0,
    'AMIS marked not_implemented with 0 fabricated observations'
  );
  assert(
    bos?.status === 'not_implemented' && bos.total_observations === 0,
    'PUNJAB_BOS marked not_implemented with 0 fabricated observations'
  );
  assert(
    kca?.status === 'not_implemented' && kca.total_observations === 0,
    'KCA marked not_implemented with 0 fabricated observations'
  );

  // --- 4. Deterministic Real Historical Series & Petrol Uniformity Sanity ---
  console.log(`\n${BOLD}4. Validating Real Historical Archive & Cross-City Sanity...${RESET}`);
  const nationalRecords = analyticsEngine.computeAllCommodityRecords('All');
  assert(
    nationalRecords.length === 51,
    `Computed analytics for all 51 PBS SPI commodities (${nationalRecords.length})`
  );

  const petrol = nationalRecords.find((r) => r.id === 'fuel_petrol');
  assert(
    !!petrol && petrol.nationalMetrics.citySpreadPct < 5,
    `Petrol Super spread is realistically uniform across Appendix-A (${petrol?.nationalMetrics.citySpreadPct}%)`
  );

  const s1 = dataEngine.getHistoricalSeries('wheat_flour', 'All');
  const s2 = dataEngine.getHistoricalSeries('wheat_flour', 'All');
  assert(
    s1.length >= 2 && JSON.stringify(s1) === JSON.stringify(s2),
    `Historical series uses strictly deterministic archived points (${s1.length} points)`
  );

  // --- 5. Strict Publish Gate & Market Pulse Breadth ---
  console.log(`\n${BOLD}5. Validating Publish Gate Enforcement & 51-Item Breadth...${RESET}`);
  const latestReport = marketArchive.getLatestPbsReport();
  assert(!!latestReport, `Latest report archived (${latestReport?.week_ended_date})`);

  if (latestReport) {
    // Freshness check relative to report date + 3 days should PASS
    const withinWindow = new Date(`${latestReport.week_ended_date}T00:00:00Z`);
    withinWindow.setUTCDate(withinWindow.getUTCDate() + 3);
    const passGate = evaluatePublishGate(latestReport, withinWindow, true);
    assert(passGate.status === 'PASSED', 'Publish Gate PASSES when release is <= 8 days old and 51/51 complete');

    // Stale check (+15 days) must FAIL loudly
    const staleDate = new Date(`${latestReport.week_ended_date}T00:00:00Z`);
    staleDate.setUTCDate(staleDate.getUTCDate() + 15);
    const staleGate = evaluatePublishGate(latestReport, staleDate, true);
    assert(staleGate.status === 'FAILED', 'Publish Gate FAILS loudly when release is > 8 days old');

    // Incomplete basket (50/51) must FAIL loudly
    const partialReport = {
      ...latestReport,
      total_items: 50,
      items: latestReport.items.slice(0, 50)
    };
    const partialGate = evaluatePublishGate(partialReport, withinWindow, true);
    assert(partialGate.status === 'FAILED', 'Publish Gate FAILS loudly when basket has fewer than 51 items');

    // Market Pulse breadth sum check
    const pulse = analyticsEngine.generateMarketPulse(latestReport.week_ended_date);
    assert(
      pulse.publish_gate.status === 'PASSED' &&
        pulse.advancers_count + pulse.decliners_count + pulse.unchanged_count === 51,
      `Market Pulse breadth sums to 51 (${pulse.advancers_count} up / ${pulse.decliners_count} down / ${pulse.unchanged_count} flat)`
    );
    assert(
      !!pulse.social_ready_post &&
        !pulse.social_ready_post.content.includes('AMIS') &&
        !pulse.social_ready_post.content.includes('Punjab BOS'),
      'Verified social post omits false AMIS/Punjab BOS cross-validation claims'
    );

    // Null report pulse must block social export
    const failedGate = evaluatePublishGate(null);
    assert(failedGate.status === 'FAILED', 'Null report fails Publish Gate');
  }

  // --- Summary ---
  const duration = Date.now() - startTime;
  console.log(`\n${BOLD}${CYAN}----------------------------------------------------${RESET}`);
  console.log(
    `${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET}, ${
      failed > 0 ? `${RED}${failed} failed${RESET}` : '0 failed'
    } (${duration}ms)`
  );
  console.log(`${BOLD}${CYAN}====================================================${RESET}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error('Validation crashed:', err);
  process.exit(1);
});
