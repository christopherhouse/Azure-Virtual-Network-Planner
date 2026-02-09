'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calculator, FileCode, Settings2, FolderKanban } from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Subnet Calculator',
    description: 'Automatically calculate CIDR blocks and IP ranges. Visual feedback shows available addresses and prevents overlaps.',
    color: 'primary', // cyan
  },
  {
    icon: FileCode,
    title: 'IaC Export',
    description: 'Export your designs to ARM templates, Bicep, or Terraform. Deploy directly to Azure with generated code.',
    color: 'accent', // purple
  },
  {
    icon: Settings2,
    title: 'Service Configuration',
    description: 'Configure subnet delegations for Azure services and enable service endpoints with a few clicks.',
    color: 'success', // green
  },
  {
    icon: FolderKanban,
    title: 'Multi-Project',
    description: 'Manage multiple network designs in separate projects. Perfect for multi-environment or multi-tenant architectures.',
    color: 'warning', // yellow
  },
] as const;

const colorClasses = {
  primary: {
    iconBg: 'bg-[oklch(0.75_0.18_195/0.15)]',
    iconText: 'text-[oklch(0.75_0.18_195)]',
    glow: 'oklch(0.75 0.18 195 / 0.1)',
  },
  accent: {
    iconBg: 'bg-[oklch(0.70_0.15_300/0.15)]',
    iconText: 'text-[oklch(0.70_0.15_300)]',
    glow: 'oklch(0.70 0.15 300 / 0.1)',
  },
  success: {
    iconBg: 'bg-[oklch(0.70_0.18_145/0.15)]',
    iconText: 'text-[oklch(0.70_0.18_145)]',
    glow: 'oklch(0.70 0.18 145 / 0.1)',
  },
  warning: {
    iconBg: 'bg-[oklch(0.75_0.15_85/0.15)]',
    iconText: 'text-[oklch(0.75_0.15_85)]',
    glow: 'oklch(0.75 0.15 85 / 0.1)',
  },
};

export function FeatureCards() {
  return (
    <section className="py-12" aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">Features</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const colors = colorClasses[feature.color];
          const Icon = feature.icon;
          
          return (
            <Card 
              key={feature.title}
              className="card-glow border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group"
            >
              <CardContent className="p-6">
                {/* Icon with colored background */}
                <div className={`inline-flex p-3 rounded-xl ${colors.iconBg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${colors.iconText}`} />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
