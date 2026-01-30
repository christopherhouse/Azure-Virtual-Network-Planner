'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getRegionsByGeography,
  getRegionDisplayName,
  DEFAULT_REGION,
  type AzureRegion,
} from '@/lib/azure-regions';

interface RegionPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function RegionPicker({
  value,
  onValueChange,
  disabled = false,
  className,
}: RegionPickerProps) {
  const regionGroups = React.useMemo(() => getRegionsByGeography(), []);
  const displayValue = value ? getRegionDisplayName(value) : undefined;

  return (
    <Select value={value || DEFAULT_REGION} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select region">{displayValue}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {regionGroups.map((group) => (
          <SelectGroup key={group.geography}>
            <SelectLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground bg-muted/50 -mx-1 px-3 py-2">
              {group.geography}
            </SelectLabel>
            {group.regions.map((region: AzureRegion) => (
              <SelectItem
                key={region.value}
                value={region.value}
                className="pl-4"
                disabled={region.isRestricted}
              >
                <span className="flex items-center gap-2">
                  {region.name}
                  {region.hasAvailabilityZones && (
                    <span className="text-xs text-muted-foreground">(AZ)</span>
                  )}
                  {region.isRestricted && (
                    <span className="text-xs text-amber-500">(Restricted)</span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
