
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MarketplaceVehicle } from '@/lib/marketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type MarketplaceExampleClientProps = {
  initialVehicles: MarketplaceVehicle[];
};

// Helper to get a full image URL, similar to the admin panel
const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://placehold.co/300x200/eee/ccc?text=No+Image';
  if (path.startsWith('http')) return path;
  // This uses the built-in image API route in the admin panel.
  // Make sure your admin panel is running and accessible from the frontend.
  return `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
};


// --- Individual Components for Clarity ---

// 1. Summary Vehicle Card for the main listing
function VehicleSummaryCard({ vehicle, onOpenDetail }: { vehicle: MarketplaceVehicle; onOpenDetail: () => void; }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onOpenDetail}>
      <CardContent className="p-0">
        <div className="relative aspect-video">
          <Image
            src={getFullImageUrl(vehicle.imageUrl)}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4 border-t">
          <h3 className="font-bold text-lg truncate">{vehicle.make} {vehicle.model}</h3>
          <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.fuelType} • {vehicle.transmission}</p>
          <p className="text-xl font-bold mt-2 text-primary">
            ₹ {vehicle.price?.toLocaleString('en-IN') ?? 'N/A'}
          </p>
          <Button className="w-full mt-4">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );
}


// 2. Detailed View for the popup/dialog
function VehicleDetailView({ vehicle }: { vehicle: MarketplaceVehicle }) {
    const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => {
        if (!value) return null;
        return (
            <div className="py-2 px-1 grid grid-cols-2 gap-4 border-b">
                <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground text-right">{value}</dd>
            </div>
        );
    }
    
    const ImagePreview = ({ src, label }: { src: string | null | undefined, label: string}) => {
        if(!src) return null;
        return (
            <div className='text-center'>
                 <Image src={getFullImageUrl(src)} alt={label} width={200} height={150} className="rounded-md object-cover w-full aspect-video mx-auto border" />
                 <p className='text-xs mt-1 text-muted-foreground'>{label}</p>
            </div>
        )
    }

    const allImageKeys: (keyof MarketplaceVehicle)[] = [
        'img_front', 'img_front_right', 'img_right', 'img_back_right', 'img_back', 
        'img_open_dickey', 'img_back_left', 'img_left', 'img_front_left', 'img_open_bonnet', 
        'img_dashboard', 'img_right_front_door', 'img_right_back_door', 'img_engine', 'img_roof', 
        'img_tyre_1', 'img_tyre_2', 'img_tyre_3', 'img_tyre_4', 'img_tyre_optional'
    ];

    const imageLabels: Record<string, string> = {
        img_front: 'Front', img_front_right: 'Front Right', img_right: 'Right', img_back_right: 'Back Right', 
        img_back: 'Back', img_open_dickey: 'Boot', img_back_left: 'Back Left', img_left: 'Left', 
        img_front_left: 'Front Left', img_open_bonnet: 'Bonnet Open', img_dashboard: 'Dashboard', 
        img_right_front_door: 'Front Door', img_right_back_door: 'Back Door', img_engine: 'Engine', 
        img_roof: 'Roof', img_tyre_1: 'Tyre 1', img_tyre_2: 'Tyre 2', img_tyre_3: 'Tyre 3', 
        img_tyre_4: 'Tyre 4', img_tyre_optional: 'Spare Tyre'
    };

    return (
        <div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
                 <Image
                    src={getFullImageUrl(vehicle.imageUrl)}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                />
                {vehicle.verified && <Badge className="absolute top-2 right-2 bg-green-600">Verified</Badge>}
            </div>

            <DialogHeader className='mb-4'>
                <DialogTitle className="text-2xl">{vehicle.make} {vehicle.model} <span className='font-normal text-lg text-muted-foreground'>{vehicle.variant}</span></DialogTitle>
                <p className="text-2xl font-bold text-primary">₹ {vehicle.price?.toLocaleString('en-IN')}</p>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center mb-4">
                <div className='p-2 bg-secondary rounded-lg'><div className='font-bold'>{vehicle.regYear}</div><div className='text-xs'>Registration</div></div>
                <div className='p-2 bg-secondary rounded-lg'><div className='font-bold'>{vehicle.odometer?.toLocaleString('en-IN')} kms</div><div className='text-xs'>Driven</div></div>
                <div className='p-2 bg-secondary rounded-lg'><div className='font-bold'>{vehicle.fuelType}</div><div className='text-xs'>Fuel Type</div></div>
            </div>

            <dl>
                <DetailItem label="Registration Number" value={vehicle.regNumber} />
                <DetailItem label="Transmission" value={vehicle.transmission} />
                <DetailItem label="Ownership" value={vehicle.ownership} />
                <DetailItem label="Insurance" value={vehicle.insurance} />
                <DetailItem label="RTO State" value={vehicle.rtoState} />
                <DetailItem label="Service History" value={vehicle.serviceHistory} />
                <DetailItem label="Manufacturing Year" value={vehicle.mfgYear} />
                <DetailItem label="Listed On" value={vehicle.createdAt ? format(new Date(vehicle.createdAt), 'dd MMM, yyyy') : null} />
            </dl>
            
            <div className='mt-6'>
                <h4 className='text-lg font-semibold mb-2'>All Images</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allImageKeys.map(key => (
                         <ImagePreview key={key} src={vehicle[key] as string} label={imageLabels[key]} />
                    ))}
                 </div>
            </div>
        </div>
    );
}

// --- Main Client Component ---

export function MarketplaceExampleClient({ initialVehicles }: MarketplaceExampleClientProps) {
  const [vehicles] = useState<MarketplaceVehicle[]>(initialVehicles);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Marketplace API Example</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => (
          <Dialog key={vehicle.id}>
            <DialogTrigger asChild>
              <div>
                <VehicleSummaryCard vehicle={vehicle} onOpenDetail={() => {}} />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <ScrollArea className="h-[80vh] p-4">
                    <VehicleDetailView vehicle={vehicle} />
                </ScrollArea>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
