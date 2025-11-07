
'use client';

import React from 'react';
import type { MarketplaceVehicle } from '@/lib/marketplace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type Banner = {
    title: string;
    imageUrl: string;
};

type ApiTestData = {
    vehicles: MarketplaceVehicle[];
    banners: Banner[];
    baseUrl: string;
};

type ApiTestClientProps = {
  initialData: ApiTestData;
};

// Helper to get a full image URL
const getFullImageUrl = (path: string | null | undefined, baseUrl: string) => {
  if (!path) return 'https://placehold.co/100x60/eee/ccc?text=No+Image';
  if (path.startsWith('http')) return path;
  // Use the API route for images, prefixed with the API base URL
  const url = new URL(baseUrl);
  url.pathname = `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
  return url.toString();
};


const DetailItem = ({ label, value }: { label: string; value: React.ReactNode | null | undefined }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="py-1.5 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm col-span-2">{String(value)}</dd>
        </div>
    );
};

export function ApiTestClient({ initialData }: ApiTestClientProps) {
  const { vehicles, banners, baseUrl } = initialData;

  return (
    <div className="container mx-auto p-4 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Test Page</h1>
        <p className="text-muted-foreground">
          This page fetches data from your marketplace API endpoints to verify they are working correctly.
        </p>
        <p className="text-sm mt-2">API Base URL: <code className='p-1 bg-muted rounded-md'>{baseUrl}</code></p>
      </div>

      {/* Vehicles Section */}
      <section className="mb-12">
        <div className='p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg'>
          <h2 className="text-2xl font-bold text-primary">Vehicles Endpoint</h2>
          <p className="text-muted-foreground">Fetching from: <code>{baseUrl}/api/marketplace/vehicles</code></p>
           <p className="text-sm mt-1">Found <Badge>{vehicles.length}</Badge> vehicles for sale.</p>
        </div>
        
        <div className="mt-6 space-y-6">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="shadow-md">
                <CardHeader>
                  <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                  <CardDescription>ID: {vehicle.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <Image
                            src={getFullImageUrl(vehicle.imageUrl, baseUrl)}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            width={300}
                            height={200}
                            className="rounded-lg object-cover w-full aspect-video"
                        />
                    </div>
                    <div className="md:col-span-2 text-sm divide-y">
                        <DetailItem label="Price" value={`₹ ${vehicle.price?.toLocaleString('en-IN')}`} />
                        <DetailItem label="Make & Model" value={`${vehicle.make} ${vehicle.model} (${vehicle.variant})`} />
                        <DetailItem label="Year (Mfg/Reg)" value={`${vehicle.mfgYear} / ${vehicle.regYear}`} />
                        <DetailItem label="Odometer" value={`${vehicle.odometer} km`} />
                        <DetailItem label="Fuel" value={vehicle.fuelType} />
                        <DetailItem label="Transmission" value={vehicle.transmission} />
                        <DetailItem label="Reg Number" value={vehicle.regNumber} />
                        <DetailItem label="Color" value={vehicle.color} />
                        <DetailItem label="Verified" value={vehicle.verified ? 'Yes' : 'No'} />
                         <div className="py-1.5 grid grid-cols-3 gap-4">
                            <dt className="text-sm font-medium text-muted-foreground">Image URL</dt>
                            <dd className="text-sm col-span-2 break-all">{vehicle.imageUrl}</dd>
                        </div>
                    </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No vehicles returned from the API.</p>
          )}
        </div>
      </section>

      {/* Banners Section */}
      <section>
         <div className='p-4 border-l-4 border-accent bg-accent/10 rounded-r-lg'>
          <h2 className="text-2xl font-bold text-accent-foreground">Banners Endpoint</h2>
          <p className="text-muted-foreground">Fetching from: <code>{baseUrl}/api/marketplace/banners</code></p>
           <p className="text-sm mt-1">Found <Badge variant="secondary">{banners.length}</Badge> banners.</p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.length > 0 ? (
            banners.map((banner, index) => (
              <Card key={index} className="overflow-hidden">
                 <Image
                    src={getFullImageUrl(banner.imageUrl, baseUrl)}
                    alt={banner.title}
                    width={400}
                    height={150}
                    className="object-cover w-full aspect-[16/6]"
                />
                <CardHeader>
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                </CardHeader>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No banners returned from the API.</p>
          )}
        </div>
      </section>
    </div>
  );
}
