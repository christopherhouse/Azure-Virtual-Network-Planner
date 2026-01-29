'use client';

import { useState } from 'react';
import { VNet, Subnet } from '@/types';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Trash2, Edit, Split, Info } from 'lucide-react';
import { SubnetEditor } from './subnet-editor';
import { getCIDRInfo, validateCIDR, cidrContains, cidrOverlaps } from '@/lib/cidr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VNetEditorProps {
  projectId: string;
  vnet: VNet;
}

export function VNetEditor({ projectId, vnet }: VNetEditorProps) {
  const { createNewSubnet, removeSubnet, splitSubnetInTwo } = useApp();
  const [newSubnetOpen, setNewSubnetOpen] = useState(false);
  const [editSubnetId, setEditSubnetId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cidr, setCidr] = useState('');
  const [cidrError, setCidrError] = useState<string | null>(null);

  const vnetInfo = getCIDRInfo(vnet.addressSpace);

  const validateSubnetCIDR = (value: string): string | null => {
    if (!value.trim()) return null;
    
    const validation = validateCIDR(value);
    if (!validation.isValid) return validation.error ?? 'Invalid CIDR';
    
    // Check if subnet is within VNet address space
    if (!cidrContains(vnet.addressSpace, value)) {
      return `Subnet must be within VNet address space (${vnet.addressSpace})`;
    }
    
    // Check for overlaps with existing subnets
    for (const subnet of vnet.subnets) {
      if (cidrOverlaps(value, subnet.cidr)) {
        return `Overlaps with existing subnet ${subnet.name} (${subnet.cidr})`;
      }
    }
    
    return null;
  };

  const handleCidrChange = (value: string) => {
    setCidr(value);
    setCidrError(validateSubnetCIDR(value));
  };

  const handleCreate = () => {
    if (name.trim() && cidr.trim() && !cidrError) {
      createNewSubnet(projectId, vnet.id, name.trim(), cidr.trim(), description.trim());
      resetForm();
      setNewSubnetOpen(false);
    }
  };

  const handleDelete = (subnetId: string) => {
    if (confirm('Are you sure you want to delete this subnet?')) {
      removeSubnet(projectId, vnet.id, subnetId);
    }
  };

  const handleSplit = (subnetId: string) => {
    const subnet = vnet.subnets.find(s => s.id === subnetId);
    if (!subnet) return;
    
    const info = getCIDRInfo(subnet.cidr);
    if (!info || info.prefix >= 30) {
      alert('Cannot split this subnet further (minimum size is /30)');
      return;
    }
    
    if (confirm(`Split ${subnet.name} (${subnet.cidr}) into two /${info.prefix + 1} subnets? This will clear the subnet's metadata.`)) {
      splitSubnetInTwo(projectId, vnet.id, subnetId);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCidr('');
    setCidrError(null);
  };

  const editingSubnet = vnet.subnets.find(s => s.id === editSubnetId);

  // Calculate used and available space
  const totalUsed = vnet.subnets.reduce((acc, subnet) => {
    const info = getCIDRInfo(subnet.cidr);
    return acc + (info?.totalHosts ?? 0);
  }, 0);
  const totalAvailable = vnetInfo ? vnetInfo.totalHosts - totalUsed : 0;

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
            <Dialog open={newSubnetOpen} onOpenChange={open => {
              setNewSubnetOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subnet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subnet</DialogTitle>
                  <DialogDescription>
                    Define a subnet within {vnet.addressSpace}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subnet-name">Subnet Name</Label>
                    <Input
                      id="subnet-name"
                      placeholder="e.g., snet-app"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subnet-cidr">Address Range (CIDR)</Label>
                    <Input
                      id="subnet-cidr"
                      placeholder="e.g., 10.0.1.0/24"
                      value={cidr}
                      onChange={e => handleCidrChange(e.target.value)}
                      className={cidrError ? 'border-destructive' : ''}
                    />
                    {cidrError && (
                      <p className="text-sm text-destructive">{cidrError}</p>
                    )}
                    {cidr && !cidrError && (
                      <p className="text-sm text-muted-foreground">
                        {getCIDRInfo(cidr)?.usableHosts ?? 0} usable addresses (Azure reserves 5)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subnet-description">Description (optional)</Label>
                    <Textarea
                      id="subnet-description"
                      placeholder="Describe the purpose of this subnet..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewSubnetOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || !cidr.trim() || !!cidrError}
                  >
                    Create Subnet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-lg font-semibold">{totalUsed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-lg font-semibold">{totalAvailable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subnets</p>
                <p className="text-lg font-semibold">{vnet.subnets.length}</p>
              </div>
            </div>
          )}

          {vnet.subnets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No subnets configured yet.</p>
              <p className="text-sm">Click &quot;Add Subnet&quot; to create your first subnet.</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address Range</TableHead>
                    <TableHead>Usable IPs</TableHead>
                    <TableHead>Delegation</TableHead>
                    <TableHead>Service Endpoints</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vnet.subnets.map(subnet => {
                    const subnetInfo = getCIDRInfo(subnet.cidr);
                    return (
                      <TableRow key={subnet.id}>
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
                        <TableCell>{subnetInfo?.usableHosts.toLocaleString() ?? '-'}</TableCell>
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
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSplit(subnet.id)}>
                                <Split className="h-4 w-4 mr-2" />
                                Split
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(subnet.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
          )}
        </CardContent>
      </Card>

      {/* Subnet Editor Dialog */}
      {editingSubnet && (
        <SubnetEditor
          projectId={projectId}
          vnetId={vnet.id}
          subnet={editingSubnet}
          open={!!editSubnetId}
          onOpenChange={open => !open && setEditSubnetId(null)}
        />
      )}
    </div>
  );
}
