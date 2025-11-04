
import { getMarketplaceVehicles, MarketplaceVehicle } from "@/lib/marketplace";
import { MarketplaceExampleClient } from "./marketplace-example-client";

// This is a Server Component that fetches data on the server.
async function getPageData(): Promise<MarketplaceVehicle[]> {
  try {
    // We call the function directly instead of fetching from the API route
    // for better performance on the server.
    const allVehicles = await getMarketplaceVehicles();
    // The API route already filters, but it's good practice to ensure here too.
    const liveVehicles = allVehicles.filter(v => v.status === 'For Sale');
    return liveVehicles;
  } catch (error) {
    console.error("Failed to fetch marketplace vehicles for example page:", error);
    return [];
  }
}

export default async function MarketplaceExamplePage() {
  const vehicles = await getPageData();

  if (!vehicles || vehicles.length === 0) {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Marketplace API Example</h1>
            <p>No vehicles found or failed to load data.</p>
        </div>
    );
  }

  return <MarketplaceExampleClient initialVehicles={vehicles} />;
}
