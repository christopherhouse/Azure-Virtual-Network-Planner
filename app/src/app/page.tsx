'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { useApp } from '@/context/app-context';
import { ProjectList } from '@/components/project-list';
import { ProjectWorkspace } from '@/components/project-workspace';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeatureCards } from '@/components/feature-cards';

const HERO_COLLAPSED_KEY = 'azvnet-hero-collapsed';

// Custom hook to sync with localStorage using React 18+ pattern
function useHeroCollapsed(hasProjects: boolean) {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback(() => {
    const stored = localStorage.getItem(HERO_COLLAPSED_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    // Default: collapsed if user has projects
    return hasProjects;
  }, [hasProjects]);

  // Return null during SSR
  const getServerSnapshot = useCallback(() => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function Home() {
  const { state, activeProject } = useApp();
  const heroCollapsed = useHeroCollapsed(state.projects.length > 0);
  const [, forceUpdate] = useState(0);

  const handleCollapse = useCallback(() => {
    localStorage.setItem(HERO_COLLAPSED_KEY, 'true');
    forceUpdate(n => n + 1); // Trigger re-render after localStorage update
  }, []);

  const handleExpand = useCallback(() => {
    localStorage.setItem(HERO_COLLAPSED_KEY, 'false');
    forceUpdate(n => n + 1); // Trigger re-render after localStorage update
  }, []);

  const handleGetStarted = useCallback(() => {
    // Collapse hero and scroll to projects
    handleCollapse();
    // The project list will be visible after collapse
  }, [handleCollapse]);

  // Don't render hero section during SSR to avoid hydration mismatch
  const showHeroSection = heroCollapsed === false;
  const showExpandInHeader = heroCollapsed === true && !activeProject;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showExpandHero={showExpandInHeader} onExpandHero={handleExpand} />

      {/* Hero Section - only show on project list view when not collapsed */}
      {!activeProject && heroCollapsed !== null && showHeroSection && (
        <>
          <HeroSection onGetStarted={handleGetStarted} onCollapse={handleCollapse} />
          <div className="container mx-auto px-4">
            <FeatureCards />
          </div>
        </>
      )}

      <main
        className="flex-1 container mx-auto px-4 py-6"
        role="main"
        aria-label={activeProject ? `Project workspace for ${activeProject.name}` : 'Project list'}
      >
        {activeProject ? <ProjectWorkspace project={activeProject} /> : <ProjectList />}
      </main>

      {/* SEO Content - Visible in collapsed mode for returning users */}
      {!activeProject && showExpandInHeader && (
        <section className="container mx-auto px-4 py-8 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold gradient-text mb-4">About Azure VNet Planner</h2>
            <p className="text-muted-foreground mb-6">
              Azure VNet Planner is a free online tool for Azure network engineers and cloud
              architects. Plan your Azure Virtual Network infrastructure, calculate subnet CIDR
              blocks, configure subnet delegations and service endpoints, and export your designs to
              ARM templates, Bicep templates, or Terraform configurations.
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-foreground mb-2">Key Features</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Azure Virtual Network (VNet) planning and design</li>
                  <li>• Subnet CIDR calculator with automatic IP math</li>
                  <li>• Subnet delegation configuration for Azure services</li>
                  <li>• Service endpoint configuration</li>
                  <li>• Export to ARM, Bicep, or Terraform templates</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Use Cases</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Planning Azure landing zone network architecture</li>
                  <li>• Designing hub-and-spoke network topologies</li>
                  <li>• Calculating subnet sizes for Azure services</li>
                  <li>• Generating Infrastructure as Code for deployments</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
