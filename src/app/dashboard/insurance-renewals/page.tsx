
import { getInsuranceRenewals, InsuranceRenewal } from "@/lib/insurance-renewals";
import { InsuranceRenewalsClient } from "./insurance-renewals-client";

async function getPageData(): Promise<InsuranceRenewal[]> {
  const requests = await getInsuranceRenewals();
  return requests;
}

export default async function InsuranceRenewalsPage() {
  const initialRenewals = await getPageData();
  return <InsuranceRenewalsClient initialRenewals={initialRenewals} />;
}
