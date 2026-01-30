'use client';

import { useState } from 'react';
import { Project } from '@/types';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Network, MoreVertical, Trash2, Edit, Download } from 'lucide-react';
import { VNetEditor } from './vnet-editor';
import { ExportDialog } from './export-dialog';
import { RegionPicker } from './region-picker';
import { getRegionDisplayName } from '@/lib/azure-regions';
import { validateCIDR, getCIDRInfo } from '@/lib/cidr';
import { DEFAULT_REGION } from '@/lib/azure-regions';

interface ProjectWorkspaceProps {
  project: Project;
}

export function ProjectWorkspace({ project }: ProjectWorkspaceProps) {
  const { createNewVNet, updateVNetDetails, removeVNet } = useApp();
  const [newVNetOpen, setNewVNetOpen] = useState(false);
  const [editVNetId, setEditVNetId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeVNetId, setActiveVNetId] = useState<string | null>(project.vnets[0]?.id ?? null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addressSpace, setAddressSpace] = useState('');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleAddressChange = (value: string) => {
    setAddressSpace(value);
    if (value.trim()) {
      const validation = validateCIDR(value);
      setAddressError(validation.isValid ? null : (validation.error ?? null));
    } else {
      setAddressError(null);
    }
  };

  const handleCreate = () => {
    if (name.trim() && addressSpace.trim() && !addressError) {
      const vnet = createNewVNet(
        project.id,
        name.trim(),
        addressSpace.trim(),
        description.trim(),
        region
      );
      setActiveVNetId(vnet.id);
      resetForm();
      setNewVNetOpen(false);
    }
  };

  const handleEdit = (vnetId: string) => {
    const vnet = project.vnets.find(v => v.id === vnetId);
    if (vnet) {
      setName(vnet.name);
      setDescription(vnet.description);
      setAddressSpace(vnet.addressSpace);
      setRegion(vnet.region || DEFAULT_REGION);
      setEditVNetId(vnetId);
    }
  };

  const handleUpdate = () => {
    if (editVNetId && name.trim() && addressSpace.trim() && !addressError) {
      updateVNetDetails(project.id, editVNetId, {
        name: name.trim(),
        description: description.trim(),
        addressSpace: addressSpace.trim(),
        region: region,
      });
      resetForm();
      setEditVNetId(null);
    }
  };

  const handleDelete = (vnetId: string) => {
    if (confirm('Are you sure you want to delete this VNet? This cannot be undone.')) {
      removeVNet(project.id, vnetId);
      if (activeVNetId === vnetId) {
        setActiveVNetId(project.vnets.find(v => v.id !== vnetId)?.id ?? null);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAddressSpace('');
    setRegion(DEFAULT_REGION);
    setAddressError(null);
  };

  const activeVNet = project.vnets.find(v => v.id === activeVNetId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">{project.name}</h2>
          {project.description && <p className="text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 hover:border-primary/50 hover:bg-primary/5"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog
            open={newVNetOpen}
            onOpenChange={open => {
              setNewVNetOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 btn-glow">
                <Plus className="h-4 w-4" />
                Add VNet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New VNet</DialogTitle>
                <DialogDescription>
                  Define the virtual network&apos;s address space.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vnet-name">VNet Name</Label>
                  <Input
                    id="vnet-name"
                    placeholder="e.g., vnet-prod-eastus"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vnet-address">Address Space (CIDR)</Label>
                  <Input
                    id="vnet-address"
                    placeholder="e.g., 10.0.0.0/16"
                    value={addressSpace}
                    onChange={e => handleAddressChange(e.target.value)}
                    className={addressError ? 'border-destructive' : ''}
                  />
                  {addressError && <p className="text-sm text-destructive">{addressError}</p>}
                  {addressSpace.trim() &&
                    !addressError &&
                    (() => {
                      const info = getCIDRInfo(addressSpace);
                      if (!info) return null;
                      return (
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total IPs:</span>
                            <span className="font-medium">{info.totalHosts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Range:</span>
                            <span className="font-mono text-xs">
                              {info.firstIP} - {info.lastIP}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Usable (Azure reserves 5 per subnet):
                            </span>
                            <span className="font-medium">{info.usableHosts.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vnet-region">Azure Region</Label>
                  <RegionPicker value={region} onValueChange={setRegion} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vnet-description">Description (optional)</Label>
                  <Textarea
                    id="vnet-description"
                    placeholder="Describe the purpose of this VNet..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewVNetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || !addressSpace.trim() || !!addressError}
                >
                  Create VNet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {project.vnets.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-card to-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
              <Network className="relative h-16 w-16 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2 gradient-text">No VNets yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first virtual network to start planning subnets
            </p>
            <Button onClick={() => setNewVNetOpen(true)} className="gap-2 btn-glow">
              <Plus className="h-4 w-4" />
              Add Your First VNet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeVNetId ?? undefined} onValueChange={setActiveVNetId}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              {project.vnets.map(vnet => (
                <TabsTrigger key={vnet.id} value={vnet.id} className="gap-2">
                  <Network className="h-4 w-4" />
                  {vnet.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {activeVNet && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(activeVNet.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit VNet
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(activeVNet.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete VNet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {project.vnets.map(vnet => (
            <TabsContent key={vnet.id} value={vnet.id}>
              <VNetEditor projectId={project.id} vnet={vnet} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit VNet Dialog */}
      <Dialog
        open={!!editVNetId}
        onOpenChange={open => {
          if (!open) {
            setEditVNetId(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit VNet</DialogTitle>
            <DialogDescription>Update the virtual network details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vnet-name">VNet Name</Label>
              <Input id="edit-vnet-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vnet-address">Address Space (CIDR)</Label>
              <Input
                id="edit-vnet-address"
                value={addressSpace}
                onChange={e => handleAddressChange(e.target.value)}
                className={addressError ? 'border-destructive' : ''}
              />
              {addressError && <p className="text-sm text-destructive">{addressError}</p>}
              {addressSpace.trim() &&
                !addressError &&
                (() => {
                  const info = getCIDRInfo(addressSpace);
                  if (!info) return null;
                  return (
                    <div className="mt-2 p-3 bg-muted rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total IPs:</span>
                        <span className="font-medium">{info.totalHosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Range:</span>
                        <span className="font-mono text-xs">
                          {info.firstIP} - {info.lastIP}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Usable (Azure reserves 5 per subnet):
                        </span>
                        <span className="font-medium">{info.usableHosts.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vnet-region">Azure Region</Label>
              <RegionPicker value={region} onValueChange={setRegion} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-vnet-description">Description (optional)</Label>
              <Textarea
                id="edit-vnet-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVNetId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!name.trim() || !addressSpace.trim() || !!addressError}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} project={project} />
    </div>
  );
}
