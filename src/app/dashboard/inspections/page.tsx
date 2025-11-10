
import { getInspections, Inspection } from "@/lib/inspections";
import { getPDIInspections, PDIInspection } from "@/lib/pdi-inspections";
import { getUsers, User } from "@/lib/users";
import { InspectionsClient } from "./inspections-client";

async function getPageData() {
  const [inspections, pdiInspections, users] = await Promise.all([
    getInspections(),
    getPDIInspections(),
    getUsers(),
  ]);
  return { inspections, pdiInspections, users };
}

export default async function InspectionsPage() {
  const { inspections, pdiInspections, users } = await getPageData();

  return <InspectionsClient initialInspections={inspections} initialPDIInspections={pdiInspections} initialUsers={users} />;
}
