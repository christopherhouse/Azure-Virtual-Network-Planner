'use client';

import { Button } from '@/components/ui/button';
import { Network, Sparkles, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onCollapse?: () => void;
}

export function HeroSection({ onGetStarted, onCollapse }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative px-4 py-16 md:py-24 text-center">
        {/* Main headline */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <Network className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          <span className="gradient-text">Azure Virtual Network</span>
          <br />
          <span className="text-foreground">Planning Made Simple</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Design Azure VNets, calculate subnet CIDR blocks, configure delegations, and export to{' '}
          <span className="text-primary font-medium">ARM</span>,
          <span className="text-primary font-medium"> Bicep</span>, or
          <span className="text-primary font-medium"> Terraform</span> — all for free.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button size="lg" className="gap-2 btn-glow text-lg px-8 py-6" onClick={onGetStarted}>
            <Sparkles className="h-5 w-5" />
            Start Planning
          </Button>
          <p className="text-sm text-muted-foreground">
            No sign-up required • Works in your browser
          </p>
        </div>

        {/* Collapse button for returning users */}
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            aria-label="Collapse hero section"
          >
            <ChevronDown className="h-4 w-4" />
            Skip to projects
          </button>
        )}
      </div>
    </section>
  );
}
