import { getUsers, User } from "@/lib/users";
import { EmployeesClient } from "./employees-client";

async function getPageData() {
  const users = await getUsers();
  return users.filter(u => u.email !== 'trustedvehiclesofficial@gmail.com');
}

export default async function EmployeesPage() {
  const initialUsers = await getPageData();
  return <EmployeesClient initialUsers={initialUsers} />;
}

    