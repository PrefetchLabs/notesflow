import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - NotesFlow',
  description: 'NotesFlow terms of service - Read our terms and conditions for using NotesFlow',
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using NotesFlow, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our service.
          </p>
          
          <h2>2. Description of Service</h2>
          <p>
            NotesFlow is a note-taking and productivity application that provides:
          </p>
          <ul>
            <li>Note creation and organization</li>
            <li>Calendar integration and time management</li>
            <li>AI-powered writing assistance</li>
            <li>Collaboration features</li>
            <li>Cloud storage and synchronization</li>
          </ul>
          
          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <p>
            To use NotesFlow, you must create an account with accurate and complete information. 
            You are responsible for maintaining the security of your account credentials.
          </p>
          
          <h3>3.2 Account Responsibilities</h3>
          <ul>
            <li>You must be at least 13 years old to use NotesFlow</li>
            <li>You are responsible for all activity under your account</li>
            <li>You must notify us immediately of any unauthorized use</li>
            <li>One person or entity may not maintain multiple free accounts</li>
          </ul>
          
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Upload malicious content or malware</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use the service for illegal or harmful activities</li>
          </ul>
          
          <h2>5. Content Ownership</h2>
          <h3>5.1 Your Content</h3>
          <p>
            You retain all rights to the content you create in NotesFlow. By using our service, 
            you grant us a license to store, process, and display your content as necessary to 
            provide the service.
          </p>
          
          <h3>5.2 Our Content</h3>
          <p>
            NotesFlow and its original content, features, and functionality are owned by us and 
            are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          
          <h2>6. Payment Terms</h2>
          <h3>6.1 Subscriptions</h3>
          <ul>
            <li>Subscriptions are billed in advance on a monthly or annual basis</li>
            <li>Prices are subject to change with 30 days notice</li>
            <li>No refunds for partial months or years</li>
          </ul>
          
          <h3>6.2 Free Trial</h3>
          <ul>
            <li>7-day free trial for new users</li>
            <li>Credit card required for trial</li>
            <li>Automatic conversion to paid plan unless cancelled</li>
          </ul>
          
          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, NotesFlow shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages resulting from your use of or 
            inability to use the service.
          </p>
          
          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless NotesFlow from any claims, losses, damages, 
            liabilities, and expenses arising from your use of the service or violation of these terms.
          </p>
          
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for:
          </p>
          <ul>
            <li>Breach of these Terms of Service</li>
            <li>Non-payment of fees</li>
            <li>Fraudulent or illegal activities</li>
            <li>At our sole discretion for any reason</li>
          </ul>
          
          <h2>10. Data Export</h2>
          <p>
            You may export your data at any time through the application. Upon account termination, 
            you have 30 days to export your data before it may be permanently deleted.
          </p>
          
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of material 
            changes via email or through the application. Continued use constitutes acceptance of the 
            new terms.
          </p>
          
          <h2>12. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of 
            [Your Jurisdiction], without regard to its conflict of law provisions.
          </p>
          
          <h2>13. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@notesflow.com</li>
            <li>Address: [Your Company Address]</li>
          </ul>
        </article>
      </div>
    </div>
  );
}