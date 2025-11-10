
import { ApiTestClient } from './api-test-client.tsx';
import type { MarketplaceVehicle } from '@/lib/marketplace';

type Banner = {
    title: string;
    imageUrl: string;
};

type ApiTestData = {
    vehicles: MarketplaceVehicle[];
    banners: Banner[];
    error: string | null;
    baseUrl: string;
};

// We fetch the data on the server side.
async function getPageData(): Promise<ApiTestData> {
    // This URL needs to be the one the browser can reach.
    // We rely on the NEXT_PUBLIC_API_URL which should be set in the environment.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    try {
        const [vehiclesRes, bannersRes] = await Promise.all([
            fetch(`${baseUrl}/api/marketplace/vehicles`, { cache: 'no-store' }),
            fetch(`${baseUrl}/api/marketplace/banners`, { cache: 'no-store' })
        ]);

        if (!vehiclesRes.ok || !bannersRes.ok) {
            const vehicleError = vehiclesRes.ok ? '' : `Vehicles API Error: ${vehiclesRes.status} ${vehiclesRes.statusText}. `;
            const bannerError = bannersRes.ok ? '' : `Banners API Error: ${bannersRes.status} ${bannersRes.statusText}.`;
            throw new Error(vehicleError + bannerError);
        }

        const vehicles: MarketplaceVehicle[] = await vehiclesRes.json();
        const banners: Banner[] = await bannersRes.json();

        return {
            vehicles,
            banners,
            error: null,
            baseUrl,
        };

    } catch (error) {
        const err = error as Error;
        console.error("API Test Page Fetch Error:", err.message);
        return {
            vehicles: [],
            banners: [],
            error: err.message || "An unknown error occurred while fetching API data.",
            baseUrl,
        };
    }
}

export default async function ApiTestPage() {
  const data = await getPageData();
  
  if (data.error) {
     return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-destructive mb-4">API Test Failed</h1>
            <p className="text-muted-foreground">Could not fetch data from the API endpoints.</p>
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
                <p className="font-semibold">Error Details:</p>
                <p className="text-sm">{data.error}</p>
                 <p className="text-sm mt-4">Base URL used: {data.baseUrl}</p>
            </div>
        </div>
     )
  }

  return <ApiTestClient initialData={data} />;
}
