import { getDeletedUsers, User } from "@/lib/users";
import { getDeletedDealers, Dealer } from "@/lib/dealers";
import { OutUsersClient } from "./out-users-client";

async function getPageData() {
  const [users, dealers] = await Promise.all([
    getDeletedUsers(),
    getDeletedDealers(),
  ]);
  return { users, dealers };
}

export default async function OutUsersPage() {
  const { users, dealers } = await getPageData();

  return <OutUsersClient initialUsers={users} initialDealers={dealers} />;
}

    