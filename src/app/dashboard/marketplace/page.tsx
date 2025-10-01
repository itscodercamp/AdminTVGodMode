import { getMarketplaceVehicles, MarketplaceVehicle } from "@/lib/marketplace";
import { getBanners, MarketplaceBanner } from "@/lib/banners";
import { getMarketplaceUsers, SafeMarketplaceUser } from "@/lib/marketplace-users";
import { getMarketplaceInquiries, FullInquiry } from "@/lib/marketplace-inquiries";
import { getMarketplaceContactMessages, MarketplaceContact } from "@/lib/marketplace-contact";
import { MarketplaceClient } from "./marketplace-client";

async function getPageData() {
  const [
    fetchedVehicles,
    fetchedBanners,
    fetchedMarketplaceUsers,
    fetchedInquiries,
    fetchedContacts
  ] = await Promise.all([
    getMarketplaceVehicles(),
    getBanners(),
    getMarketplaceUsers(),
    getMarketplaceInquiries(),
    getMarketplaceContactMessages(),
  ]);

  const liveVehicles = fetchedVehicles.filter(v => v.status === 'For Sale' || v.status === 'Paused');
  const soldVehicles: MarketplaceVehicle[] = []; // Using correct type for now
  const customerUsers = fetchedMarketplaceUsers.customers;
  const dealerUsers = fetchedMarketplaceUsers.dealers;

  return {
    liveVehicles,
    soldVehicles,
    banners: fetchedBanners,
    customerUsers,
    dealerUsers,
    inquiries: fetchedInquiries,
    contactMessages: fetchedContacts,
  };
}

export default async function MarketplacePage() {
  const initialData = await getPageData();
  return <MarketplaceClient initialData={initialData} />;
}

    