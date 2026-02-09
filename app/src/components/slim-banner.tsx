'use client';

import { Button } from '@/components/ui/button';
import { Network, ChevronDown, Sparkles } from 'lucide-react';

interface SlimBannerProps {
  onExpand: () => void;
}

export function SlimBanner({ onExpand }: SlimBannerProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-card via-primary/5 to-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: branding message */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <Network className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                Free Azure VNet Planning Tool
              </p>
              <p className="text-xs text-muted-foreground">
                Subnet calculator • IaC export • No sign-up
              </p>
            </div>
          </div>

          {/* Right side: expand button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExpand}
            className="gap-2 text-muted-foreground hover:text-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Learn More</span>
            <ChevronDown className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    </section>
  );
}
