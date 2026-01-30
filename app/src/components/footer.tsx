'use client';

import { Github } from 'lucide-react';

const REPO_URL = 'https://github.com/christopherhouse/Azure-Virtual-Network-Planner';
const WORKFLOW_BADGE_URL = `${REPO_URL}/actions/workflows/deploy.yml/badge.svg`;

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-4">
        {/* GitHub repo link and build badge */}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">christopherhouse/</span>
          <span className="font-medium">Azure-Virtual-Network-Planner</span>
        </a>
        <a
          href={`${REPO_URL}/actions/workflows/deploy.yml`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WORKFLOW_BADGE_URL}
            alt="Build Status"
            className="h-5"
          />
        </a>
      </div>
    </footer>
  );
}
