
import { getLoanRequests, LoanRequest } from "@/lib/loan-requests";
import { LoanRequestsClient } from "./loan-requests-client";

async function getPageData(): Promise<LoanRequest[]> {
  const requests = await getLoanRequests();
  return requests;
}

export default async function LoanRequestsPage() {
  const initialRequests = await getPageData();
  return <LoanRequestsClient initialRequests={initialRequests} />;
}
