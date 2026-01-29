'use client';

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Network, ArrowLeft, Sparkles } from 'lucide-react';

export function Header() {
  const { activeProject, setActiveProject } = useApp();

  return (
    <header className="border-b border-border/50 bg-gradient-to-r from-card via-card to-[oklch(0.18_0.03_270)]">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveProject(null)}
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <Network className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
                Azure VNet Planner
                <Sparkles className="h-4 w-4 text-[oklch(0.75_0.15_85)]" />
              </h1>
              <p className="text-xs text-muted-foreground">Visual Network Design Tool</p>
            </div>
          </div>
        </div>
        {activeProject && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Project</span>
            <span className="font-semibold text-primary">{activeProject.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
