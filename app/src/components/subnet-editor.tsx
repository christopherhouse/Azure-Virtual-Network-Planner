'use client';

import { useState, useEffect } from 'react';
import { Subnet, DelegationOption, ServiceEndpointOption } from '@/types';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AZURE_DELEGATIONS } from '@/lib/azure-delegations';
import { AZURE_SERVICE_ENDPOINTS } from '@/lib/azure-service-endpoints';

interface SubnetEditorProps {
  projectId: string;
  vnetId: string;
  subnet: Subnet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubnetEditor({ projectId, vnetId, subnet, open, onOpenChange }: SubnetEditorProps) {
  const { updateSubnetDetails, setSubnetDelegation, setSubnetServiceEndpoints } = useApp();
  
  const [name, setName] = useState(subnet.name);
  const [description, setDescription] = useState(subnet.description);
  const [delegationId, setDelegationId] = useState<string | null>(subnet.delegation?.id ?? null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(
    subnet.serviceEndpoints.map(ep => ep.id)
  );

  // Reset form when subnet changes
  useEffect(() => {
    setName(subnet.name);
    setDescription(subnet.description);
    setDelegationId(subnet.delegation?.id ?? null);
    setSelectedEndpoints(subnet.serviceEndpoints.map(ep => ep.id));
  }, [subnet]);

  const handleSave = () => {
    // Update basic details
    updateSubnetDetails(projectId, vnetId, subnet.id, {
      name: name.trim(),
      description: description.trim(),
    });
    
    // Update delegation
    const delegation = delegationId 
      ? AZURE_DELEGATIONS.find(d => d.id === delegationId) ?? null 
      : null;
    setSubnetDelegation(projectId, vnetId, subnet.id, delegation);
    
    // Update service endpoints
    const endpoints = selectedEndpoints
      .map(id => AZURE_SERVICE_ENDPOINTS.find(ep => ep.id === id))
      .filter((ep): ep is ServiceEndpointOption => !!ep);
    setSubnetServiceEndpoints(projectId, vnetId, subnet.id, endpoints);
    
    onOpenChange(false);
  };

  const toggleEndpoint = (endpointId: string) => {
    setSelectedEndpoints(prev =>
      prev.includes(endpointId)
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subnet</DialogTitle>
          <DialogDescription>
            Configure subnet properties, delegation, and service endpoints.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Basic Information</h4>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subnet-name">Name</Label>
                <Input
                  id="edit-subnet-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address Range</Label>
                <Input value={subnet.cidr} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">
                  Address range cannot be changed. To modify, delete and recreate the subnet.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subnet-description">Description</Label>
                <Textarea
                  id="edit-subnet-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this subnet..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Delegation */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Subnet Delegation</h4>
              <p className="text-sm text-muted-foreground">
                Delegate this subnet to a specific Azure service.
              </p>
            </div>
            <Select
              value={delegationId ?? 'none'}
              onValueChange={value => setDelegationId(value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a delegation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No delegation</SelectItem>
                {AZURE_DELEGATIONS.map(delegation => (
                  <SelectItem key={delegation.id} value={delegation.id}>
                    {delegation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {delegationId && (
              <p className="text-sm text-muted-foreground">
                Service: {AZURE_DELEGATIONS.find(d => d.id === delegationId)?.serviceName}
              </p>
            )}
          </div>

          <Separator />

          {/* Service Endpoints */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Service Endpoints</h4>
              <p className="text-sm text-muted-foreground">
                Enable service endpoints to allow traffic to Azure services over the Microsoft backbone network.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AZURE_SERVICE_ENDPOINTS.map(endpoint => (
                <div key={endpoint.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={`endpoint-${endpoint.id}`}
                    checked={selectedEndpoints.includes(endpoint.id)}
                    onCheckedChange={() => toggleEndpoint(endpoint.id)}
                  />
                  <div className="space-y-1 leading-none">
                    <label
                      htmlFor={`endpoint-${endpoint.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {endpoint.name}
                    </label>
                    <p className="text-xs text-muted-foreground">{endpoint.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
