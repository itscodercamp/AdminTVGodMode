import { getSellCarRequests, SellCarRequest } from "@/lib/sell-requests";
import { SellRequestsClient } from "./sell-requests-client";

async function getPageData(): Promise<SellCarRequest[]> {
  const requests = await getSellCarRequests();
  return requests;
}

export default async function SellRequestsPage() {
  const initialRequests = await getPageData();
  return <SellRequestsClient initialRequests={initialRequests} />;
}

    