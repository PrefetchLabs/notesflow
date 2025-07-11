import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - NotesFlow',
  description: 'NotesFlow privacy policy - Learn how we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <article className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Introduction</h2>
          <p>
            Welcome to NotesFlow. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy explains how we collect, use, and safeguard your information when you use our service.
          </p>
          
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Account information (email, name, password)</li>
            <li>Notes and content you create</li>
            <li>Calendar events and time blocks</li>
            <li>Collaboration and sharing preferences</li>
          </ul>
          
          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li>Usage data and analytics</li>
            <li>Device information and browser type</li>
            <li>IP address and location data</li>
            <li>Cookies and similar technologies</li>
          </ul>
          
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Improve and personalize your experience</li>
            <li>Process payments and subscriptions</li>
            <li>Send important updates and communications</li>
            <li>Ensure security and prevent fraud</li>
          </ul>
          
          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>End-to-end encryption for sensitive data</li>
            <li>Regular security audits and updates</li>
            <li>Secure data centers with redundancy</li>
            <li>Limited access controls and monitoring</li>
          </ul>
          
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share your information only in these circumstances:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>With trusted service providers who assist our operations</li>
            <li>In connection with a merger or acquisition</li>
          </ul>
          
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
          
          <h2>7. GDPR Compliance</h2>
          <p>
            For users in the European Union, we comply with GDPR requirements including:
          </p>
          <ul>
            <li>Lawful basis for data processing</li>
            <li>Data portability rights</li>
            <li>Right to be forgotten</li>
            <li>Privacy by design principles</li>
          </ul>
          
          <h2>8. CCPA Compliance</h2>
          <p>
            For California residents, we comply with CCPA requirements including:
          </p>
          <ul>
            <li>Right to know what data we collect</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of data sales (we don't sell data)</li>
            <li>Non-discrimination for exercising rights</li>
          </ul>
          
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@notesflow.com</li>
            <li>Address: [Your Company Address]</li>
          </ul>
          
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by 
            posting the new policy on this page and updating the "Last updated" date.
          </p>
        </article>
      </div>
    </div>
  );
}