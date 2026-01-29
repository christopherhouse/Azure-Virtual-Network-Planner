'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Subnet, ServiceEndpointOption } from '@/types';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, ChevronDown, Info, MoreVertical, Split, Merge, Pencil } from 'lucide-react';
import { getCIDRInfo } from '@/lib/cidr';
import { AZURE_DELEGATIONS } from '@/lib/azure-delegations';
import { AZURE_SERVICE_ENDPOINTS } from '@/lib/azure-service-endpoints';
import { cn } from '@/lib/utils';

interface InlineSubnetRowProps {
  projectId: string;
  vnetId: string;
  subnet: Subnet;
  isSelectedForMerge: boolean;
  isMergeTarget: boolean;
  canSplit: boolean;
  canMerge: boolean;
  onSplit: () => void;
  onMergeSelect: () => void;
  onMergeClick: () => void;
}

export function InlineSubnetRow({
  projectId,
  vnetId,
  subnet,
  isSelectedForMerge,
  isMergeTarget,
  canSplit,
  canMerge,
  onSplit,
  onMergeSelect,
  onMergeClick,
}: InlineSubnetRowProps) {
  const { updateSubnetDetails, setSubnetDelegation, setSubnetServiceEndpoints } = useApp();

  // Inline editing states
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  // Use key to reset state when subnet changes instead of useEffect with setState
  const subnetKey = useMemo(
    () => `${subnet.id}-${subnet.name}-${subnet.description}`,
    [subnet.id, subnet.name, subnet.description]
  );
  const [tempName, setTempName] = useState(subnet.name);
  const [tempDesc, setTempDesc] = useState(subnet.description);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  const subnetInfo = getCIDRInfo(subnet.cidr);

  // Focus input when editing starts
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDesc && descInputRef.current) {
      descInputRef.current.focus();
      descInputRef.current.select();
    }
  }, [editingDesc]);

  // Reset temps when subnet prop changes (tracked via subnetKey)
  useEffect(() => {
    // Only reset if not currently editing
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync from props
    if (!editingName) setTempName(subnet.name);

    if (!editingDesc) setTempDesc(subnet.description);
  }, [subnetKey, editingName, editingDesc, subnet.name, subnet.description]);

  const handleNameSave = () => {
    if (tempName.trim() && tempName !== subnet.name) {
      updateSubnetDetails(projectId, vnetId, subnet.id, { name: tempName.trim() });
    } else {
      setTempName(subnet.name);
    }
    setEditingName(false);
  };

  const handleDescSave = () => {
    if (tempDesc !== subnet.description) {
      updateSubnetDetails(projectId, vnetId, subnet.id, { description: tempDesc.trim() });
    }
    setEditingDesc(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    saveHandler: () => void,
    cancelHandler: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveHandler();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelHandler();
    }
  };

  const handleDelegationChange = (delegationId: string | null) => {
    const delegation = delegationId
      ? (AZURE_DELEGATIONS.find(d => d.id === delegationId) ?? null)
      : null;
    setSubnetDelegation(projectId, vnetId, subnet.id, delegation);
  };

  const handleEndpointToggle = (endpointId: string) => {
    const currentIds = subnet.serviceEndpoints.map(ep => ep.id);
    let newIds: string[];

    if (currentIds.includes(endpointId)) {
      newIds = currentIds.filter(id => id !== endpointId);
    } else {
      newIds = [...currentIds, endpointId];
    }

    const endpoints = newIds
      .map(id => AZURE_SERVICE_ENDPOINTS.find(ep => ep.id === id))
      .filter((ep): ep is ServiceEndpointOption => !!ep);

    setSubnetServiceEndpoints(projectId, vnetId, subnet.id, endpoints);
  };

  return (
    <TableRow
      className={cn(
        'table-row-glow transition-all duration-200',
        isSelectedForMerge && 'bg-primary/15 ring-1 ring-primary/50',
        isMergeTarget &&
          'bg-[oklch(0.70_0.18_145/0.1)] cursor-pointer hover:bg-[oklch(0.70_0.18_145/0.2)]'
      )}
      onClick={isMergeTarget ? onMergeClick : undefined}
    >
      {/* Name - Inline Editable */}
      <TableCell className="font-medium">
        {editingName ? (
          <div className="flex items-center gap-1">
            <Input
              ref={nameInputRef}
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={e =>
                handleKeyDown(e, handleNameSave, () => {
                  setTempName(subnet.name);
                  setEditingName(false);
                })
              }
              className="h-7 text-sm w-40"
            />
          </div>
        ) : (
          <div
            className="inline-edit-cell cursor-pointer flex items-center gap-2 group"
            onClick={() => setEditingName(true)}
          >
            <span>{subnet.name}</span>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            {subnet.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{subnet.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </TableCell>

      {/* Description - Inline Editable (hidden on small screens, shown on hover/click) */}
      <TableCell className="hidden md:table-cell">
        {editingDesc ? (
          <Input
            ref={descInputRef}
            value={tempDesc}
            onChange={e => setTempDesc(e.target.value)}
            onBlur={handleDescSave}
            onKeyDown={e =>
              handleKeyDown(e, handleDescSave, () => {
                setTempDesc(subnet.description);
                setEditingDesc(false);
              })
            }
            placeholder="Add description..."
            className="h-7 text-sm"
          />
        ) : (
          <div
            className="inline-edit-cell cursor-pointer text-muted-foreground text-sm group flex items-center gap-2"
            onClick={() => setEditingDesc(true)}
          >
            <span className="truncate max-w-[200px]">
              {subnet.description || 'Add description...'}
            </span>
            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
          </div>
        )}
      </TableCell>

      {/* Address Range */}
      <TableCell>
        <code className="text-sm bg-muted px-2 py-1 rounded font-mono badge-cyan border">
          {subnet.cidr}
        </code>
      </TableCell>

      {/* Size */}
      <TableCell>
        <Badge variant="secondary" className="badge-purple border">
          /{subnetInfo?.prefix}
        </Badge>
      </TableCell>

      {/* Usable IPs */}
      <TableCell>
        <span className="font-semibold text-primary">
          {subnetInfo?.usableHosts.toLocaleString() ?? '-'}
        </span>
        <span className="text-xs text-muted-foreground ml-1">(5 reserved)</span>
      </TableCell>

      {/* Delegation - Inline Dropdown */}
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 gap-1 justify-start font-normal',
                subnet.delegation ? 'badge-green border' : 'text-muted-foreground'
              )}
            >
              {subnet.delegation ? subnet.delegation.name : 'None'}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-2 border-b">
              <p className="text-sm font-medium">Subnet Delegation</p>
              <p className="text-xs text-muted-foreground">Delegate to an Azure service</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn('w-full justify-start font-normal', !subnet.delegation && 'bg-muted')}
                onClick={() => handleDelegationChange(null)}
              >
                <span className="flex-1 text-left">No delegation</span>
                {!subnet.delegation && <Check className="h-4 w-4" />}
              </Button>
              {AZURE_DELEGATIONS.map(delegation => (
                <Button
                  key={delegation.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start font-normal',
                    subnet.delegation?.id === delegation.id && 'bg-muted'
                  )}
                  onClick={() => handleDelegationChange(delegation.id)}
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm">{delegation.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {delegation.serviceName}
                    </p>
                  </div>
                  {subnet.delegation?.id === delegation.id && (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  )}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Service Endpoints - Inline Multi-select */}
      <TableCell>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 justify-start font-normal">
              {subnet.serviceEndpoints.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="badge-cyan border text-xs">
                    {subnet.serviceEndpoints.length}
                  </Badge>
                  <span className="text-sm">selected</span>
                </div>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-2 border-b">
              <p className="text-sm font-medium">Service Endpoints</p>
              <p className="text-xs text-muted-foreground">
                Enable secure access to Azure services
              </p>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1">
              {AZURE_SERVICE_ENDPOINTS.map(endpoint => {
                const isSelected = subnet.serviceEndpoints.some(ep => ep.id === endpoint.id);
                return (
                  <Button
                    key={endpoint.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'w-full justify-start font-normal',
                      isSelected && 'bg-primary/10'
                    )}
                    onClick={() => handleEndpointToggle(endpoint.id)}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border mr-2 flex items-center justify-center',
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm">{endpoint.name}</p>
                      <p className="text-xs text-muted-foreground">{endpoint.service}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSplit} disabled={!canSplit}>
              <Split className="h-4 w-4 mr-2" />
              Split in Half
              {!canSplit && <span className="ml-2 text-xs text-muted-foreground">(min /29)</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMergeSelect} disabled={!canMerge && !isSelectedForMerge}>
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
}
