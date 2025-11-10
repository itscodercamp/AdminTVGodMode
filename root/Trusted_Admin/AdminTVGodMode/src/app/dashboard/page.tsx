

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, ShoppingBag, MessageSquareWarning, HelpCircle, Handshake, ClipboardList, UserX, MessageSquarePlus, Laptop, Landmark, ShieldCheck } from "lucide-react";
import { getInspections, Inspection } from "@/lib/inspections";
import { getUsers, getDeletedUsers, User } from "@/lib/users";
import { getDealers, getDeletedDealers, Dealer } from "@/lib/dealers";
import { getContactSubmissions, ContactSubmission } from "@/lib/contacts";
import { getMarketplaceVehicles, MarketplaceVehicle } from "@/lib/marketplace";
import { getMarketplaceContactMessages, MarketplaceContact } from "@/lib/marketplace-contact";
import { getMarketplaceInquiries, FullInquiry } from "@/lib/marketplace-inquiries";
import { getSellCarRequests, SellCarRequest } from "@/lib/sell-requests";
import { getWebsiteInspections, WebsiteInspection } from "@/lib/website-inspections";
import { getLoanRequests, LoanRequest } from "@/lib/loan-requests";
import { getInsuranceRenewals, InsuranceRenewal } from "@/lib/insurance-renewals";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";


async function getData() {
    const [
        inspections,
        users,
        dealers,
        contacts,
        deletedUsers,
        deletedDealers,
        marketplaceVehicles,
        marketplaceContacts,
        marketplaceInquiries,
        sellRequests,
        websiteInspections,
        loanRequests,
        insuranceRenewals,
    ] = await Promise.all([
        getInspections(),
        getUsers(),
        getDealers(),
        getContactSubmissions(),
        getDeletedUsers(),
        getDeletedDealers(),
        getMarketplaceVehicles(),
        getMarketplaceContactMessages(),
        getMarketplaceInquiries(),
        getSellCarRequests(),
        getWebsiteInspections(),
        getLoanRequests(),
        getInsuranceRenewals(),
    ]);
    return {
        inspections, users, dealers, contacts, deletedUsers, deletedDealers, marketplaceVehicles,
        marketplaceContacts, marketplaceInquiries, sellRequests, websiteInspections, loanRequests, insuranceRenewals
    };
}


export default async function DashboardPage() {
  const data = await getData();
  
  const { 
    inspections, users, dealers, contacts, deletedUsers, deletedDealers,
    marketplaceVehicles, marketplaceContacts, marketplaceInquiries, sellRequests, websiteInspections,
    loanRequests, insuranceRenewals
  } = data;

  const totalEmployees = users.length;
  const liveVehiclesCount = marketplaceVehicles.filter(v => v.status === 'For Sale').length;
  const newMarketplaceMessages = marketplaceContacts.filter(c => c.status === 'New').length;
  const newInquiries = marketplaceInquiries.filter(i => i.status === 'New').length;
  const newSellRequests = sellRequests.filter(r => r.status === 'New').length;
  const inspectionsPending = inspections.filter(i => ['Pending', 'Requested', 'Viewed'].includes(i.status)).length;
  const newContacts = contacts.filter(c => c.status === 'New').length;
  const totalOutUsers = deletedUsers.length + deletedDealers.length;
  const newWebsiteInspections = websiteInspections.filter(r => r.status === 'New').length;
  const newLoanRequests = loanRequests.filter(r => r.status === 'New').length;
  const newInsuranceRenewals = insuranceRenewals.filter(r => r.status === 'New').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin! Here&apos;s your overview.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-blue-100 dark:bg-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalEmployees}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-green-100 dark:bg-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Marketplace Live Vehicles</CardTitle>
            <ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{liveVehiclesCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-yellow-100 dark:bg-yellow-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">New Marketplace Messages</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{newMarketplaceMessages}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-purple-100 dark:bg-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">New Buying Inquiries</CardTitle>
            <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{newInquiries}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-teal-100 dark:bg-teal-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800 dark:text-teal-200">New Sell Requests</CardTitle>
            <Handshake className="h-4 w-4 text-teal-600 dark:text-teal-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">{newSellRequests}</div>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-orange-100 dark:bg-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">New Website Inspections</CardTitle>
            <Laptop className="h-4 w-4 text-orange-600 dark:text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{newWebsiteInspections}</div>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-red-100 dark:bg-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">New Loan Requests</CardTitle>
            <Landmark className="h-4 w-4 text-red-600 dark:text-red-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{newLoanRequests}</div>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-indigo-100 dark:bg-indigo-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">New Insurance Renewals</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{newInsuranceRenewals}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-sky-100 dark:bg-sky-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-sky-800 dark:text-sky-200">New Website Contacts</CardTitle>
            <MessageSquarePlus className="h-4 w-4 text-sky-600 dark:text-sky-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-900 dark:text-sky-100">{newContacts}</div>
          </CardContent>
        </Card>
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-pink-100 dark:bg-pink-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-800 dark:text-pink-200">Out Users</CardTitle>
            <UserX className="h-4 w-4 text-pink-600 dark:text-pink-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">{totalOutUsers}</div>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Website Inspection Requests</CardTitle>
          <CardDescription>A summary of the latest inspection requests from the website.</CardDescription>
        </CardHeader>
        <CardContent>
            {websiteInspections.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Requester</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                            {websiteInspections.slice(0, 5).map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      <Link href="/dashboard/website-inspections" className="hover:underline">{request.fullName}</Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.carMake} {request.carModel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Badge variant={request.status === 'New' ? 'destructive' : 'default'}>
                                            {request.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No recent website inspection requests.</p>
                </div>
            )}
        </CardContent>
    </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Manual/Dealer Inspections</CardTitle>
          <CardDescription>A summary of the latest inspection entries created from the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
            {inspections.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                            {inspections.slice(0, 5).map((inspection) => (
                                <tr key={inspection.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                        <Link href="/dashboard/inspections" className="hover:underline">{inspection.id}</Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{inspection.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{inspection.vehicleMake} {inspection.vehicleModel}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <Badge variant={
                                            inspection.status === 'Completed' ? 'secondary' : 
                                            ['Pending', 'Requested'].includes(inspection.status) ? 'destructive' : 'default'
                                        }>
                                            {inspection.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No recent manual inspections.</p>
                </div>
            )}
        </CardContent>
    </Card>
    </div>
  );
}

    