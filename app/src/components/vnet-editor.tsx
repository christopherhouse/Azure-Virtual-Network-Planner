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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Split, Merge, Info, AlertCircle } from 'lucide-react';
import { SubnetEditor } from './subnet-editor';
import { getCIDRInfo, parseCIDR } from '@/lib/cidr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VNetEditorProps {
  projectId: string;
  vnet: VNet;
}

export function VNetEditor({ projectId, vnet }: VNetEditorProps) {
  const { splitSubnetInTwo, mergeSubnetsIntoOne, canMergeSubnets } = useApp();
  const [editSubnetId, setEditSubnetId] = useState<string | null>(null);
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

  const editingSubnet = vnet.subnets.find(s => s.id === editSubnetId);

  // Sort subnets by CIDR for consistent display
  const sortedSubnets = [...vnet.subnets].sort((a, b) => {
    const aIP = a.cidr.split('/')[0].split('.').map(Number);
    const bIP = b.cidr.split('/')[0].split('.').map(Number);
    
    for (let i = 0; i < 4; i++) {
      if (aIP[i] !== bIP[i]) return aIP[i] - bIP[i];
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {vnet.name}
                <Badge variant="outline">{vnet.addressSpace}</Badge>
              </CardTitle>
              {vnet.description && (
                <CardDescription>{vnet.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vnetInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total IPs</p>
                <p className="text-lg font-semibold">{vnetInfo.totalHosts.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">First IP</p>
                <p className="text-lg font-semibold font-mono">{vnetInfo.firstIP}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last IP</p>
                <p className="text-lg font-semibold font-mono">{vnetInfo.lastIP}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subnets</p>
                <p className="text-lg font-semibold">{vnet.subnets.length}</p>
              </div>
            </div>
          )}

          {selectedForMerge && (
            <Alert className="mb-4">
              <Merge className="h-4 w-4" />
              <AlertDescription>
                Select another adjacent subnet to merge, or click the same subnet to cancel.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <strong>Tip:</strong> Use <strong>Split</strong> to divide a subnet into two smaller subnets, 
            or <strong>Merge</strong> to combine two adjacent same-size subnets back together.
          </div>

          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address Range</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Usable IPs</TableHead>
                  <TableHead>Delegation</TableHead>
                  <TableHead>Service Endpoints</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSubnets.map(subnet => {
                  const subnetInfo = getCIDRInfo(subnet.cidr);
                  const canSplit = subnetInfo && subnetInfo.prefix < 29;
                  const mergeableWith = getMergeableSubnets(subnet.id);
                  const canMerge = mergeableWith.length > 0;
                  const isSelectedForMerge = selectedForMerge === subnet.id;
                  const isMergeTarget = selectedForMerge && mergeableWith.includes(selectedForMerge);
                  
                  return (
                    <TableRow 
                      key={subnet.id}
                      className={
                        isSelectedForMerge 
                          ? 'bg-primary/10 border-primary' 
                          : isMergeTarget 
                            ? 'bg-green-500/10 cursor-pointer hover:bg-green-500/20' 
                            : ''
                      }
                      onClick={isMergeTarget ? () => handleMergeSelect(subnet.id) : undefined}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {subnet.name}
                          {subnet.description && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{subnet.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {subnet.cidr}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">/{subnetInfo?.prefix}</Badge>
                      </TableCell>
                      <TableCell>
                        {subnetInfo?.usableHosts.toLocaleString() ?? '-'}
                        <span className="text-xs text-muted-foreground ml-1">
                          (Azure reserves 5)
                        </span>
                      </TableCell>
                      <TableCell>
                        {subnet.delegation ? (
                          <Badge variant="secondary">{subnet.delegation.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subnet.serviceEndpoints.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subnet.serviceEndpoints.slice(0, 2).map(ep => (
                              <Badge key={ep.id} variant="outline" className="text-xs">
                                {ep.name}
                              </Badge>
                            ))}
                            {subnet.serviceEndpoints.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{subnet.serviceEndpoints.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditSubnetId(subnet.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleSplit(subnet.id)}
                              disabled={!canSplit}
                            >
                              <Split className="h-4 w-4 mr-2" />
                              Split in Half
                              {!canSplit && (
                                <span className="ml-2 text-xs text-muted-foreground">(min /29)</span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMergeSelect(subnet.id)}
                              disabled={!canMerge && !isSelectedForMerge}
                            >
                              <Merge className="h-4 w-4 mr-2" />
                              {isSelectedForMerge ? 'Cancel Merge' : 'Merge with Adjacent'}
                              {!canMerge && !isSelectedForMerge && (
                                <span className="ml-2 text-xs text-muted-foreground">(no match)</span>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Subnet Editor Dialog */}
      {editingSubnet && (
        <SubnetEditor
          projectId={projectId}
          vnetId={vnet.id}
          subnet={editingSubnet}
          open={!!editSubnetId}
          onOpenChange={(open: boolean) => !open && setEditSubnetId(null)}
        />
      )}
    </div>
  );
}
