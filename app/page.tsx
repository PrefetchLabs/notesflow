'use client';

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, CheckCircle, Clock, FileText, Link2, Menu, MessageSquare, Sparkles, Users, X, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'NotesFlow',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Free Plan',
      },
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        name: 'Beta Plan',
        description: '7-day free trial with all features',
      },
      {
        '@type': 'Offer',
        price: '12',
        priceCurrency: 'USD',
        name: 'Pro Plan',
        description: 'For professionals and teams',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1000',
    },
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex min-h-screen flex-col">
        {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex flex-1 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="text-xl font-semibold">NotesFlow</span>
            </Link>
            
            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                Testimonials
              </Link>
            </nav>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4">
                <Button asChild variant="ghost">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>

              {/* Mobile Navigation */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px]">
                  <nav className="flex flex-col gap-4">
                    <Link 
                      href="#features" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Features
                    </Link>
                    <Link 
                      href="#pricing" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Link 
                      href="#testimonials" 
                      className="text-sm font-medium hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Testimonials
                    </Link>
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild className="justify-start">
                        <Link href="/login">Get Started</Link>
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 animate-fade-in" variant="secondary">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Powered Note Taking
            </Badge>
            <h1 className="mb-6 text-4xl sm:text-5xl font-bold tracking-tight lg:text-6xl animate-fade-in-up">
              Your thoughts and time,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                beautifully unified
              </span>
            </h1>
            <p className="mb-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Take notes effortlessly while NotesFlow automatically organizes your thoughts, 
              creates calendar events, and helps you stay productive with AI assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Button asChild size="lg" className="text-lg">
                <Link href="/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground animate-fade-in animation-delay-600">
              No credit card required • 7-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Everything you need to stay organized
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to streamline your workflow and boost productivity
            </p>
          </div>
          <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Writing</CardTitle>
                <CardDescription>
                  Get intelligent suggestions, auto-formatting, and content generation powered by advanced AI
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Calendar Integration</CardTitle>
                <CardDescription>
                  Drag text to your calendar to create events instantly. Never miss a meeting or deadline again
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Collaboration</CardTitle>
                <CardDescription>
                  Share notes and collaborate with your team in real-time with granular permission controls
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Public & Private Sharing</CardTitle>
                <CardDescription>
                  Share notes publicly with a link or keep them private. Perfect for documentation and wikis
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Rich Text Editor</CardTitle>
                <CardDescription>
                  Full-featured editor with markdown support, code blocks, tables, and media embedding
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Time Tracking</CardTitle>
                <CardDescription>
                  Track time spent on notes and projects. Perfect for freelancers and consultants
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that works best for you
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for personal use</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Up to 10 notes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">3 folders</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Basic text editor</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">7-day note history</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link href="/login">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Beta Plan */}
            <Card className="border-primary relative shadow-lg scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
                  <Zap className="h-3 w-3 mr-1" />
                  BETA ACCESS
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>Beta</CardTitle>
                <CardDescription>Early access with all features</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/7 days trial</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Everything in Free</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Unlimited notes & folders</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">AI writing assistant</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Collaboration features</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Calendar integration</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6">
                  <Link href="/login">Start Beta Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For professionals and teams</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Everything in Beta</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Advanced AI features</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">99.9% uptime SLA</span>
                  </li>
                </ul>
                <Button asChild className="w-full mt-6" variant="outline">
                  <Link href="/login">Coming Soon</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Loved by thousands of users
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our users have to say about NotesFlow
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 fill-primary text-primary"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  "NotesFlow has completely transformed how I organize my thoughts. The AI features are incredible!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10" />
                  <div>
                    <p className="text-sm font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 fill-primary text-primary"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  "The calendar integration is a game-changer. I can create events from my notes with just a drag!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10" />
                  <div>
                    <p className="text-sm font-semibold">Michael Chen</p>
                    <p className="text-sm text-muted-foreground">Software Engineer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 fill-primary text-primary"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="mb-4 text-muted-foreground">
                  "Real-time collaboration makes working with my team seamless. Best note-taking app I've used!"
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10" />
                  <div>
                    <p className="text-sm font-semibold">Emily Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Marketing Director</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Ready to transform your note-taking?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of users who are already using NotesFlow to stay organized and productive
            </p>
            <Button asChild size="lg" className="text-lg">
              <Link href="/login">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/50">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <FileText className="h-6 w-6" />
                <span className="text-xl font-semibold">NotesFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Your thoughts and time, beautifully unified.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} NotesFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}