import fs from 'fs';
import path from 'path';
import { PbsSpiReport } from './pbs-scraper';

export interface ForexSnapshot {
  date: string; // YYYY-MM-DD
  usd_pkr: number;
  source_url: string;
  fetched_at: string;
}

interface MarketArchivePayload {
  version: number;
  last_sync_at: string | null;
  pbs_reports: Record<string, PbsSpiReport>; // keyed by week_ended_date (YYYY-MM-DD)
  forex_rates: Record<string, ForexSnapshot>; // keyed by date (YYYY-MM-DD)
}

const ARCHIVE_DIR = path.join(process.cwd(), '.data');
const ARCHIVE_FILE = path.join(ARCHIVE_DIR, 'market-archive.json');

export class MarketArchiveStore {
  private data: MarketArchivePayload = {
    version: 1,
    last_sync_at: null,
    pbs_reports: {},
    forex_rates: {}
  };

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(ARCHIVE_FILE)) {
        const raw = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.data = {
            version: parsed.version || 1,
            last_sync_at: parsed.last_sync_at || null,
            pbs_reports: parsed.pbs_reports || {},
            forex_rates: parsed.forex_rates || {}
          };
        }
      }
    } catch (err) {
      console.error('Failed to load market archive from disk:', err);
    }
  }

  public saveToDisk(): void {
    try {
      if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
      }
      fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist market archive to disk:', err);
    }
  }

  public hasPbsReport(weekEndedDate: string): boolean {
    return Boolean(this.data.pbs_reports[weekEndedDate]);
  }

  public upsertPbsReport(report: PbsSpiReport): void {
    this.data.pbs_reports[report.week_ended_date] = report;
    this.data.last_sync_at = new Date().toISOString();
    this.saveToDisk();
  }

  public upsertForexSnapshot(snapshot: ForexSnapshot): void {
    this.data.forex_rates[snapshot.date] = snapshot;
    this.saveToDisk();
  }

  public getLatestForex(): ForexSnapshot | null {
    const entries = Object.values(this.data.forex_rates).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    return entries[0] || null;
  }

  public getAllPbsReportsAscending(): PbsSpiReport[] {
    return Object.values(this.data.pbs_reports).sort((a, b) =>
      a.week_ended_date.localeCompare(b.week_ended_date)
    );
  }

  public getAllPbsReportsDescending(): PbsSpiReport[] {
    return Object.values(this.data.pbs_reports).sort((a, b) =>
      b.week_ended_date.localeCompare(a.week_ended_date)
    );
  }

  public getLatestPbsReport(): PbsSpiReport | null {
    const desc = this.getAllPbsReportsDescending();
    return desc[0] || null;
  }

  /**
   * Finds the archived PBS SPI release active on or immediately before targetDate (YYYY-MM-DD).
   */
  public getPbsReportForDate(targetDate: string): PbsSpiReport | null {
    const desc = this.getAllPbsReportsDescending();
    return desc.find((r) => r.week_ended_date <= targetDate) || null;
  }

  public getStats(): {
    archived_weeks: number;
    oldest_week: string | null;
    newest_week: string | null;
    last_sync_at: string | null;
  } {
    const asc = this.getAllPbsReportsAscending();
    return {
      archived_weeks: asc.length,
      oldest_week: asc[0]?.week_ended_date || null,
      newest_week: asc[asc.length - 1]?.week_ended_date || null,
      last_sync_at: this.data.last_sync_at
    };
  }
}

export const marketArchive = new MarketArchiveStore();
