import { getDealers, DealerWithLeads } from "@/lib/dealers";
import { DealersClient } from "./dealers-client";

async function getPageData(): Promise<DealerWithLeads[]> {
  const dealers = await getDealers();
  return dealers;
}

export default async function DealersPage() {
  const initialDealers = await getPageData();
  return <DealersClient initialDealers={initialDealers} />;
}

    