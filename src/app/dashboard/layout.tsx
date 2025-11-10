
"use client";

import Link from "next/link";
import {
  Bell,
  Home,
  Users,
  LogOut,
  Settings,
  Menu,
  ChevronLeft,
  Search,
  ClipboardCheck,
  FileText,
  Building,
  Archive,
  ShoppingBag,
  Handshake,
  Laptop,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import io from 'socket.io-client';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getUsers } from "@/lib/users";
import { getInspections, Inspection } from "@/lib/inspections";
import { getDealers } from "@/lib/dealers";
import { getContactSubmissions, ContactSubmission } from "@/lib/contacts";
import { useRouter } from "next/navigation";


let socket: any;

type SearchResult = {
  type: 'Employee' | 'Dealer' | 'Inspection' | 'Contact';
  label: string;
  sublabel: string;
  id: string;
  path: string;
}

type NotificationType = 'contact' | 'inspection' | 'sell-request' | 'website-inspection' | 'marketplace-user' | 'marketplace-vehicle' | 'marketplace-banner' | 'marketplace-inquiry' | 'marketplace-contact' | 'loan-request' | 'insurance-renewal' | 'pdi-inspection';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
};

const MAX_SEARCH_RESULTS = 8;

const notificationRedirects: Record<NotificationType, string> = {
    'contact': '/dashboard/contact',
    'inspection': '/dashboard/inspections',
    'sell-request': '/dashboard/sell-requests',
    'website-inspection': '/dashboard/website-inspections',
    'marketplace-user': '/dashboard/marketplace',
    'marketplace-vehicle': '/dashboard/marketplace',
    'marketplace-banner': '/dashboard/marketplace',
    'marketplace-inquiry': '/dashboard/marketplace',
    'marketplace-contact': '/dashboard/marketplace',
    'loan-request': '/dashboard/loan-requests',
    'insurance-renewal': '/dashboard/insurance-renewals',
    'pdi-inspection': '/dashboard/inspections',
};


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allSearchResults, setAllSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();


  const markNotificationAsRead = useCallback((id: string, type: NotificationType) => {
    setNotifications(prev => prev.filter(n => !(n.id === id && n.type === type)));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const [contacts, inspections] = await Promise.all([
                getContactSubmissions(),
                getInspections(),
            ]);
            const contactNotifs = contacts.filter(c => c.status === 'New').map(c => ({
                id: c.id,
                type: 'contact' as const,
                message: `New contact from ${c.name}`,
                read: false
            }));
            const inspectionNotifs = inspections.filter(i => i.status === 'Pending').map(i => ({
                id: i.id,
                type: 'inspection' as const,
                message: `New inspection for ${i.fullName}`,
                read: false
            }));
            setNotifications([...contactNotifs, ...inspectionNotifs]);
        } catch (error) {
            console.error("Failed to fetch initial notifications", error);
        }
    };
    
    fetchInitialData();
    
    // Initialize socket connection
    const socketInitializer = async () => {
      // We call our own API route to ensure the socket server is initialized
      await fetch('/api/socket');
      
      // Connect to the socket server
      socket = io(undefined!, {
        path: '/api/socket',
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      socket.on('new-notification', (notification: any) => {
          setNotifications(prev => [
              {...notification, read: false}, 
              ...prev
          ]);
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }

    socketInitializer();
    
    (window as any).markNotificationAsRead = markNotificationAsRead;

    // Cleanup on component unmount
    return () => {
      if(socket) socket.disconnect();
      delete (window as any).markNotificationAsRead;
    };
  }, [markNotificationAsRead]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearchOpen(true);
    if (searchQuery.length > 1) {
      const [allUsers, allDealers, allInspections, allContacts] = await Promise.all([
          getUsers(),
          getDealers(),
          getInspections(),
          getContactSubmissions()
      ]);
      
      const userResults: SearchResult[] = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery)) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(user => ({
        type: 'Employee',
        label: user.name,
        sublabel: `Employee ID: ${user.id}`,
        id: user.id,
        path: '/dashboard/employees'
      }));

      const dealerResults: SearchResult[] = allDealers.filter(d => 
        d.dealershipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(d => ({
        type: 'Dealer',
        label: d.dealershipName,
        sublabel: `Dealer ID: ${d.id}`,
        id: d.id,
        path: '/dashboard/dealers'
      }));

      const inspectionResults: SearchResult[] = allInspections.filter(i => 
        i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.registrationNumber.toLowerCase().replace(/\s/g, '').includes(searchQuery.toLowerCase().replace(/\s/g, '')) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(i => ({
        type: 'Inspection',
        label: `${i.vehicleMake} ${i.vehicleModel}`,
        sublabel: `For ${i.fullName} (ID: ${i.id})`,
        id: i.id,
        path: '/dashboard/inspections'
      }));
      
      const contactResults: SearchResult[] = allContacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(c => ({
        type: 'Contact',
        label: c.subject,
        sublabel: `From ${c.name} (ID: ${c.id})`,
        id: c.id,
        path: '/dashboard/contact'
      }));

      const combinedResults = [...userResults, ...dealerResults, ...inspectionResults, ...contactResults];
      setAllSearchResults(combinedResults);
    } else {
      setAllSearchResults([]);
    }
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length === 0) {
      setHasSearched(false);
      setIsSearchOpen(false);
      setAllSearchResults([]);
    }
  }

  const visibleSearchResults = useMemo(() => {
    return allSearchResults.slice(0, MAX_SEARCH_RESULTS);
  }, [allSearchResults]);

  const handleResultClick = (path: string) => {
    setSearchQuery("");
    setAllSearchResults([]);
    setIsSearchOpen(false);
    setHasSearched(false);
    router.push(path);
  };

  const handleViewAll = () => {
    // We can implement a dedicated search page later.
    // For now, just log it or close the popover.
    console.log("View all results...");
    setIsSearchOpen(false);
  }
  
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);

  const handleNotificationClick = (notification: Notification) => {
      const path = notificationRedirects[notification.type];
      if (path) {
          router.push(path);
      }
      markNotificationAsRead(notification.id, notification.type);
  }


  const navLinks = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/employees", icon: Users, label: "Employees" },
    // { href: "/dashboard/dealers", icon: Building, label: "Dealers" },
    { href: "/dashboard/inspections", icon: ClipboardCheck, label: "Inspections" },
    { href: "/dashboard/loan-requests", icon: Landmark, label: "Loan Requests" },
    { href: "/dashboard/insurance-renewals", icon: ShieldCheck, label: "Insurance Renewals" },
    { href: "/dashboard/website-inspections", icon: Laptop, label: "Website Inspections" },
    { href: "/dashboard/contact", icon: FileText, label: "Contact Forms" },
    { href: "/dashboard/sell-requests", icon: Handshake, label: "Sell Requests" },
    { href: "/dashboard/marketplace", icon: ShoppingBag, label: "Marketplace" },
  ];
  
  const secondaryNavLinks = [
      { href: "/dashboard/out-users", icon: Archive, label: "Out Users" },
  ];
  
  const logoSrc = "/logo.png";


  return (
    <div className={cn("grid h-screen w-full overflow-hidden transition-all duration-300", isSidebarOpen ? "md:grid-cols-[220px_1fr]" : "md:grid-cols-[80px_1fr]")}>
      <div className="hidden border-r bg-primary text-primary-foreground md:flex md:flex-col">
        <div className="flex h-full max-h-screen flex-col gap-2 relative">
          <div className="flex h-14 items-center justify-center border-b border-primary-foreground/20 px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
               <Image src={logoSrc} alt="Trusted Vehicles Logo" width={32} height={32} />
              <span className={cn("text-lg", !isSidebarOpen && "hidden")}>
                <span className="text-success">Trusted</span>
                <span className="text-accent">Vehicles</span>
              </span>
            </Link>
          </div>
          <Button
            onClick={toggleSidebar}
            size="icon"
            variant="ghost"
            className="absolute -right-5 top-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hidden md:flex"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
          </Button>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-primary-foreground/80 transition-all hover:text-primary-foreground hover:bg-primary-foreground/10", !isSidebarOpen && "justify-center")}
                >
                  <link.icon className="h-5 w-5" />
                  <span className={cn("flex-1", !isSidebarOpen && "hidden")}>{link.label}</span>
                </Link>
              ))}
              
              <div className="my-4 px-3">
                  <span className={cn("text-xs text-primary-foreground/50 uppercase", !isSidebarOpen && "hidden")}>System</span>
              </div>
              
               {secondaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-primary-foreground/80 transition-all hover:text-primary-foreground hover:bg-primary-foreground/10", !isSidebarOpen && "justify-center")}
                >
                  <link.icon className="h-5 w-5" />
                  <span className={cn("flex-1", !isSidebarOpen && "hidden")}>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-primary text-primary-foreground px-4 lg:h-[60px] lg:px-6">
           <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden bg-transparent border-primary-foreground/50 hover:bg-primary-foreground/10"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-primary text-primary-foreground">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                     <Image src={logoSrc} alt="Trusted Vehicles Logo" width={32} height={32} />
                    <span>
                      <span className="text-success">Trusted</span>
                      <span className="text-accent">Vehicles</span>
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium mt-8">
                {navLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center gap-4 rounded-xl px-3 py-2 text-primary-foreground/80 hover:text-primary-foreground"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                 <div className="my-4 px-3">
                  <span className="text-sm text-primary-foreground/50 uppercase">System</span>
                </div>
                 {secondaryNavLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center gap-4 rounded-xl px-3 py-2 text-primary-foreground/80 hover:text-primary-foreground"
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                 <div className="relative w-full md:w-2/3 lg:w-1/2 ml-4 flex items-center">
                  <Input
                    type="search"
                    placeholder="Search by ID, name, number plate..."
                    className="w-full appearance-none bg-primary-foreground/10 pl-4 pr-10 shadow-none text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-primary-foreground/20 border-2 border-transparent focus:border-accent"
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary-foreground/80 hover:bg-primary-foreground/20" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] mt-1 p-1">
                {hasSearched && allSearchResults.length > 0 ? (
                  <div className="flex flex-col space-y-1">
                    {visibleSearchResults.map((result) => (
                      <Button
                        key={`${result.type}-${result.id}`}
                        variant="ghost"
                        className="h-auto w-full justify-start text-left"
                        onClick={() => handleResultClick(result.path)}
                      >
                        <div>
                          <div className="font-medium">{result.label}</div>
                          <div className="text-xs text-muted-foreground">{result.sublabel}</div>
                        </div>
                        <Badge variant="secondary" className="ml-auto">{result.type}</Badge>
                      </Button>
                    ))}
                    {allSearchResults.length > MAX_SEARCH_RESULTS && (
                       <Button variant="ghost" onClick={handleViewAll} className="w-full text-sm text-primary">
                          View all {allSearchResults.length} results
                       </Button>
                    )}
                  </div>
                ) : (
                  hasSearched && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No results found for &quot;{searchQuery}&quot;.
                    </div>
                  )
                )}
              </PopoverContent>
            </Popover>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary-foreground/10 focus-visible:ring-0 focus-visible:ring-offset-0 border-0">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                   <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-ping">
                   </span>
                )}
                 {unreadNotifications.length > 0 && (
                   <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                   {unreadNotifications.length}
                 </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-card-foreground rounded-lg">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {unreadNotifications.length > 0 ? (
                  unreadNotifications.map(notif => (
                     <DropdownMenuItem key={notif.id + notif.type} onClick={() => handleNotificationClick(notif)}>
                        {notif.message}
                    </DropdownMenuItem>
                  ))
              ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-foreground/10 focus-visible:ring-0 focus-visible:ring-offset-0 border-0">
                <Image
                  src="https://picsum.photos/seed/user-avatar/32/32"
                  width={32}
                  height={32}
                  alt="Avatar"
                  className="rounded-full"
                  data-ai-hint="person face"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-card-foreground rounded-lg">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="#" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/" className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto bg-background rounded-tl-lg">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
