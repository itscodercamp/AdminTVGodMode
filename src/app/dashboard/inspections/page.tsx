import { getInspections, Inspection } from "@/lib/inspections";
import { getUsers, User } from "@/lib/users";
import { InspectionsClient } from "./inspections-client";

async function getPageData() {
  const [inspections, users] = await Promise.all([
    getInspections(),
    getUsers(),
  ]);
  return { inspections, users };
}

export default async function InspectionsPage() {
  const { inspections, users } = await getPageData();

  return <InspectionsClient initialInspections={inspections} initialUsers={users} />;
}

    