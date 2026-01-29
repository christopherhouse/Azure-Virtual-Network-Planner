'use client';

import { useApp } from '@/context/app-context';
import { ProjectList } from '@/components/project-list';
import { ProjectWorkspace } from '@/components/project-workspace';
import { Header } from '@/components/header';

export default function Home() {
  const { activeProject } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main 
        className="flex-1 container mx-auto px-4 py-6"
        role="main"
        aria-label={activeProject ? `Project workspace for ${activeProject.name}` : 'Project list'}
      >
        {activeProject ? <ProjectWorkspace project={activeProject} /> : <ProjectList />}
      </main>
      
      {/* Hidden SEO content - provides context for search engines */}
      <footer className="sr-only" aria-hidden="true">
        <h2>About Azure VNet Planner</h2>
        <p>
          Azure VNet Planner is a free online tool for Azure network engineers and cloud architects. 
          Plan your Azure Virtual Network infrastructure, calculate subnet CIDR blocks, configure 
          subnet delegations and service endpoints, and export your designs to ARM templates, 
          Bicep templates, or Terraform configurations.
        </p>
        <h3>Features</h3>
        <ul>
          <li>Azure Virtual Network (VNet) planning and design</li>
          <li>Subnet CIDR calculator with automatic IP math</li>
          <li>Subnet delegation configuration for Azure services</li>
          <li>Service endpoint configuration</li>
          <li>Export to ARM, Bicep, or Terraform templates</li>
          <li>Multi-project management</li>
          <li>No sign-up required - works entirely in your browser</li>
        </ul>
        <h3>Use Cases</h3>
        <ul>
          <li>Planning Azure landing zone network architecture</li>
          <li>Designing hub-and-spoke network topologies</li>
          <li>Calculating subnet sizes for Azure services</li>
          <li>Generating Infrastructure as Code for network deployments</li>
        </ul>
      </footer>
    </div>
  );
}
