import { getContactSubmissions, ContactSubmission } from "@/lib/contacts";
import { ContactClient } from "./contact-client";

async function getPageData(): Promise<ContactSubmission[]> {
  const submissions = await getContactSubmissions();
  return submissions;
}

export default async function ContactPage() {
  const initialSubmissions = await getPageData();
  return <ContactClient initialSubmissions={initialSubmissions} />;
}

    