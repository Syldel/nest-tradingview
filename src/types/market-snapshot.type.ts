export interface MarketSnapshot {
  symbol: string; // e.g., "ETHUSDT"
  interval: string; // e.g., "1h"
  exchange: string; // e.g., "KUCOIN"

  open: number;
  high: number;
  low: number;
  close: number;

  volume: string;
}

export const marketSnapshotTitleMap: Record<
  string,
  keyof Omit<MarketSnapshot, 'symbol' | 'interval' | 'exchange'>
> = {
  // French
  Ouverture: 'open',
  Haut: 'high',
  Bas: 'low',
  Fermeture: 'close',
  Vol: 'volume',

  // English
  Open: 'open',
  High: 'high',
  Low: 'low',
  Close: 'close',
  Volume: 'volume',
};
