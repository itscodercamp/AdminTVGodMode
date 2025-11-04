
import { getMarketplaceVehicleById, MarketplaceVehicle } from "@/lib/marketplace";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { notFound } from 'next/navigation';
import { format } from "date-fns";
import { Key, Car, Gauge, Fuel, Cog, Calendar, Shield, MapPin, Milestone, Star, Palette, Hash } from "lucide-react";

// Helper to get a full image URL
const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return 'https://placehold.co/600x400/eee/ccc?text=No+Image';
  if (path.startsWith('http')) return path;
  return `/api/images${path.startsWith('/') ? '' : '/'}${path}`;
};


async function fetchVehicle(id: string): Promise<MarketplaceVehicle | null> {
    try {
        // In a real app, you might fetch from an absolute URL
        // but since this is a server component, we can call the lib function directly.
        const vehicle = await getMarketplaceVehicleById(id);
        if (!vehicle) {
            console.warn(`Vehicle with ID ${id} not found in database.`);
            return null;
        }
        return vehicle;
    } catch (error) {
        console.error(`Failed to fetch vehicle ${id}.`, error);
        return null;
    }
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string; value: React.ReactNode | null | undefined }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex items-start space-x-3 rounded-lg p-3 bg-secondary/50">
            <Icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
            <div>
                <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                <p className="text-md font-bold text-foreground">{String(value)}</p>
            </div>
        </div>
    );
};

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
    const vehicle = await fetchVehicle(params.id);

    if (!vehicle) {
        notFound();
    }

    const allImageKeys: (keyof MarketplaceVehicle)[] = [
        'imageUrl', 'img_front', 'img_front_right', 'img_right', 'img_back_right', 'img_back', 
        'img_open_dickey', 'img_back_left', 'img_left', 'img_front_left', 'img_open_bonnet', 
        'img_dashboard', 'img_right_front_door', 'img_right_back_door', 'img_engine', 'img_roof', 
        'img_tyre_1', 'img_tyre_2', 'img_tyre_3', 'img_tyre_4', 'img_tyre_optional'
    ];
    
    const validImages = allImageKeys
        .map(key => vehicle[key])
        .filter((url): url is string => !!url && typeof url === 'string');

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <Card className="overflow-hidden shadow-2xl">
                    <CardHeader className="bg-muted p-4 md:p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                             <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{vehicle.make} {vehicle.model}</h1>
                                <p className="text-md md:text-lg text-muted-foreground">{vehicle.variant}</p>
                             </div>
                             {vehicle.verified && <Badge className="bg-green-600 hover:bg-green-700 text-white text-md py-1 px-3 self-start md:self-center">Verified by TrustedVehicles</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-5">
                            <div className="lg:col-span-3 p-4">
                               <Carousel className="w-full">
                                  <CarouselContent>
                                    {validImages.map((src, index) => (
                                      <CarouselItem key={index}>
                                        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                          <Image
                                            src={getFullImageUrl(src)}
                                            alt={`${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                          />
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  {validImages.length > 1 && <>
                                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                                  </>}
                                </Carousel>
                            </div>
                            <div className="lg:col-span-2 p-4 md:p-6 bg-muted/50 border-t lg:border-t-0 lg:border-l">
                                <h2 className="text-4xl font-bold text-primary mb-6">
                                    ₹ {vehicle.price?.toLocaleString('en-IN') ?? 'N/A'}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <DetailItem icon={Car} label="Make & Model" value={`${vehicle.make} ${vehicle.model}`} />
                                    <DetailItem icon={Key} label="Variant" value={vehicle.variant} />
                                    <DetailItem icon={Calendar} label="MFG / REG Year" value={`${vehicle.mfgYear} / ${vehicle.regYear}`} />
                                    <DetailItem icon={Gauge} label="KM Driven" value={`${vehicle.odometer?.toLocaleString('en-IN')} km`} />
                                    <DetailItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                                    <DetailItem icon={Cog} label="Transmission" value={vehicle.transmission} />
                                    <DetailItem icon={Shield} label="Insurance" value={vehicle.insurance} />
                                    <DetailItem icon={MapPin} label="RTO State" value={vehicle.rtoState} />
                                    <DetailItem icon={Milestone} label="Ownership" value={`${vehicle.ownership}`} />
                                    <DetailItem icon={Star} label="Service History" value={vehicle.serviceHistory} />
                                    <DetailItem icon={Palette} label="Color" value={vehicle.color} />
                                    <DetailItem icon={Hash} label="Reg. Number" value={vehicle.regNumber} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// This function generates static paths for all vehicles at build time
// export async function generateStaticParams() {
//   const vehicles = await getMarketplaceVehicles();
//   return vehicles.map((vehicle) => ({
//     id: vehicle.id,
//   }));
// }

export const dynamic = 'force-dynamic';
