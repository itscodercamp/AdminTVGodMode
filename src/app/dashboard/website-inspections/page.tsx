import { getWebsiteInspections, WebsiteInspection } from "@/lib/website-inspections";
import { WebsiteInspectionsClient } from "./website-inspections-client";

async function getPageData(): Promise<WebsiteInspection[]> {
  const requests = await getWebsiteInspections();
  return requests;
}

export default async function WebsiteInspectionsPage() {
  const initialRequests = await getPageData();
  return <WebsiteInspectionsClient initialRequests={initialRequests} />;
}

    