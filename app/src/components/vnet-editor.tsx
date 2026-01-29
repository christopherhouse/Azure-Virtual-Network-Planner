'use client';

import { useState } from 'react';
import { VNet } from '@/types';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Merge, Network, Zap, Server, Shield } from 'lucide-react';
import { InlineSubnetRow } from './inline-subnet-row';
import { getCIDRInfo } from '@/lib/cidr';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VNetEditorProps {
  projectId: string;
  vnet: VNet;
}

export function VNetEditor({ projectId, vnet }: VNetEditorProps) {
  const { splitSubnetInTwo, mergeSubnetsIntoOne, canMergeSubnets } = useApp();
  const [selectedForMerge, setSelectedForMerge] = useState<string | null>(null);

  const vnetInfo = getCIDRInfo(vnet.addressSpace);

  const handleSplit = (subnetId: string) => {
    const subnet = vnet.subnets.find(s => s.id === subnetId);
    if (!subnet) return;
    
    const info = getCIDRInfo(subnet.cidr);
    if (!info || info.prefix >= 29) {
      alert('Cannot split this subnet further. Azure minimum subnet size is /29.');
      return;
    }
    
    splitSubnetInTwo(projectId, vnet.id, subnetId);
  };

  const handleMergeSelect = (subnetId: string) => {
    if (!selectedForMerge) {
      setSelectedForMerge(subnetId);
    } else if (selectedForMerge === subnetId) {
      setSelectedForMerge(null);
    } else {
      // Try to merge
      if (canMergeSubnets(projectId, vnet.id, selectedForMerge, subnetId)) {
        mergeSubnetsIntoOne(projectId, vnet.id, selectedForMerge, subnetId);
      } else {
        alert('These subnets cannot be merged. Subnets must be adjacent and the same size.');
      }
      setSelectedForMerge(null);
    }
  };

  const getMergeableSubnets = (subnetId: string): string[] => {
    return vnet.subnets
      .filter(s => s.id !== subnetId && canMergeSubnets(projectId, vnet.id, subnetId, s.id))
      .map(s => s.id);
  };

  // Sort subnets by CIDR for consistent display
  const sortedSubnets = [...vnet.subnets].sort((a, b) => {
    const aIP = a.cidr.split('/')[0].split('.').map(Number);
    const bIP = b.cidr.split('/')[0].split('.').map(Number);
    
    for (let i = 0; i < 4; i++) {
      if (aIP[i] !== bIP[i]) return aIP[i] - bIP[i];
    }
    return 0;
  });

  // Calculate utilization stats
  const totalAllocated = sortedSubnets.reduce((sum, s) => {
    const info = getCIDRInfo(s.cidr);
    return sum + (info?.totalHosts ?? 0);
  }, 0);
  const utilization = vnetInfo ? Math.round((totalAllocated / vnetInfo.totalHosts) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="card-glow gradient-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="h-5 w-5 text-primary" />
                </div>
                <span className="gradient-text text-xl">{vnet.name}</span>
                <Badge variant="outline" className="badge-cyan border font-mono">
                  {vnet.addressSpace}
                </Badge>
              </CardTitle>
              {vnet.description && (
                <CardDescription className="mt-1 ml-12">{vnet.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vnetInfo && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/50 rounded-xl border border-border/50">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total IPs</p>
                </div>
                <p className="text-2xl font-bold gradient-text">{vnetInfo.totalHosts.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">First IP</p>
                <p className="text-lg font-semibold font-mono text-[oklch(0.75_0.18_195)]">{vnetInfo.firstIP}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last IP</p>
                <p className="text-lg font-semibold font-mono text-[oklch(0.70_0.15_300)]">{vnetInfo.lastIP}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Server className="h-4 w-4 text-[oklch(0.70_0.18_145)]" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Subnets</p>
                </div>
                <p className="text-2xl font-bold text-[oklch(0.70_0.18_145)]">{vnet.subnets.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-[oklch(0.75_0.15_85)]" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Utilization</p>
                </div>
                <p className="text-2xl font-bold text-[oklch(0.75_0.15_85)]">{utilization}%</p>
              </div>
            </div>
          )}

          {selectedForMerge && (
            <Alert className="mb-4 border-primary/50 bg-primary/5">
              <Merge className="h-4 w-4 text-primary" />
              <AlertDescription>
                Select another adjacent subnet to merge, or click the same subnet to cancel.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg text-sm text-muted-foreground border border-border/50">
            <strong className="text-foreground">💡 Tip:</strong> Click on <strong className="text-primary">Name</strong> or <strong className="text-primary">Description</strong> to edit inline. 
            Use the dropdown menus to change <strong className="text-[oklch(0.70_0.18_145)]">Delegation</strong> and <strong className="text-[oklch(0.75_0.18_195)]">Service Endpoints</strong> directly.
          </div>

          <TooltipProvider>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                    <TableHead className="font-semibold">Address Range</TableHead>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold">Usable IPs</TableHead>
                    <TableHead className="font-semibold">Delegation</TableHead>
                    <TableHead className="font-semibold">Endpoints</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubnets.map(subnet => {
                    const subnetInfo = getCIDRInfo(subnet.cidr);
                    const canSplit = subnetInfo && subnetInfo.prefix < 29;
                    const mergeableWith = getMergeableSubnets(subnet.id);
                    const canMerge = mergeableWith.length > 0;
                    const isSelectedForMerge = selectedForMerge === subnet.id;
                    const isMergeTarget = !!(selectedForMerge && mergeableWith.includes(selectedForMerge));
                    
                    return (
                      <InlineSubnetRow
                        key={subnet.id}
                        projectId={projectId}
                        vnetId={vnet.id}
                        subnet={subnet}
                        isSelectedForMerge={isSelectedForMerge}
                        isMergeTarget={isMergeTarget}
                        canSplit={!!canSplit}
                        canMerge={canMerge}
                        onSplit={() => handleSplit(subnet.id)}
                        onMergeSelect={() => handleMergeSelect(subnet.id)}
                        onMergeClick={() => handleMergeSelect(subnet.id)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
