/** Shared types. Extend when you add API/DB. */

export type User = {
  id: string;
  name: string;
  balanceCents: number;
};

export type Channel = {
  id: string;
  name: string;
  memberCount?: number;
  joined?: boolean;
};

export type MarketStatus = "open" | "resolved_yes" | "resolved_no";

export type Market = {
  id: string;
  channelId: string;
  title: string;
  description?: string | null;
  status: MarketStatus;
  yesOdds?: number;
  noOdds?: number;
};

export type Bet = {
  id: string;
  marketId: string;
  userId: string;
  side: "yes" | "no";
  amountCents: number;
};
