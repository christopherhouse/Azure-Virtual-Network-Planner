'use client';

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Network, ArrowLeft } from 'lucide-react';

export function Header() {
  const { activeProject, setActiveProject } = useApp();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeProject && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveProject(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Azure VNet Planner</h1>
          </div>
        </div>
        {activeProject && (
          <div className="text-sm text-muted-foreground">
            Project: <span className="font-medium text-foreground">{activeProject.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
