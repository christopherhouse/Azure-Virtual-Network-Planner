'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { ProjectList } from '@/components/project-list';
import { ProjectWorkspace } from '@/components/project-workspace';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeatureCards } from '@/components/feature-cards';
import { SlimBanner } from '@/components/slim-banner';

const HERO_COLLAPSED_KEY = 'azvnet-hero-collapsed';

export default function Home() {
  const { state, activeProject } = useApp();
  const [heroCollapsed, setHeroCollapsed] = useState<boolean | null>(null);

  // Determine if hero should be collapsed
  // - If user has projects, default to collapsed
  // - If user manually toggled, respect that preference
  useEffect(() => {
    const stored = localStorage.getItem(HERO_COLLAPSED_KEY);
    if (stored !== null) {
      setHeroCollapsed(stored === 'true');
    } else {
      // Default: collapsed if user has projects
      setHeroCollapsed(state.projects.length > 0);
    }
  }, [state.projects.length]);

  const handleCollapse = useCallback(() => {
    setHeroCollapsed(true);
    localStorage.setItem(HERO_COLLAPSED_KEY, 'true');
  }, []);

  const handleExpand = useCallback(() => {
    setHeroCollapsed(false);
    localStorage.setItem(HERO_COLLAPSED_KEY, 'false');
  }, []);

  const handleGetStarted = useCallback(() => {
    // Collapse hero and scroll to projects
    handleCollapse();
    // The project list will be visible after collapse
  }, [handleCollapse]);

  // Don't render hero section during SSR to avoid hydration mismatch
  const showHeroSection = heroCollapsed === false;
  const showSlimBanner = heroCollapsed === true;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section OR Slim Banner - only show on project list view */}
      {!activeProject && heroCollapsed !== null && (
        <>
          {showHeroSection && (
            <>
              <HeroSection onGetStarted={handleGetStarted} onCollapse={handleCollapse} />
              <div className="container mx-auto px-4">
                <FeatureCards />
              </div>
            </>
          )}
          {showSlimBanner && <SlimBanner onExpand={handleExpand} />}
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
      {!activeProject && showSlimBanner && (
        <section className="container mx-auto px-4 py-8 border-t border-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold gradient-text mb-4">
              About Azure VNet Planner
            </h2>
            <p className="text-muted-foreground mb-6">
              Azure VNet Planner is a free online tool for Azure network engineers and cloud architects.
              Plan your Azure Virtual Network infrastructure, calculate subnet CIDR blocks, configure
              subnet delegations and service endpoints, and export your designs to ARM templates, Bicep
              templates, or Terraform configurations.
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
