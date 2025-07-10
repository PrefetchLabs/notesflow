import { redirect } from 'next/navigation';

// Public pricing page redirects to upgrade page
export default function PricingPage() {
  redirect('/upgrade');
}