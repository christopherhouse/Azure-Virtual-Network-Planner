// CIDR and Subnet Math Utilities

import { CIDRInfo, CIDRValidationResult, SubnetSplitResult } from '@/types';

/**
 * Convert IP address string to 32-bit integer
 */
export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Convert 32-bit integer to IP address string
 */
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

/**
 * Parse CIDR notation and return network and prefix
 */
export function parseCIDR(cidr: string): { network: string; prefix: number } | null {
  const match = cidr.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return null;
  
  const network = match[1];
  const prefix = parseInt(match[2], 10);
  
  if (prefix < 0 || prefix > 32) return null;
  
  const octets = network.split('.').map(Number);
  if (octets.some(o => o < 0 || o > 255)) return null;
  
  return { network, prefix };
}

/**
 * Validate CIDR notation
 */
export function validateCIDR(cidr: string): CIDRValidationResult {
  const trimmed = cidr.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'CIDR block is required' };
  }
  
  const parsed = parseCIDR(trimmed);
  if (!parsed) {
    return { isValid: false, error: 'Invalid CIDR format. Use format like 10.0.0.0/16' };
  }
  
  // Calculate the actual network address
  const networkInt = ipToInt(parsed.network);
  const mask = getNetmaskInt(parsed.prefix);
  const actualNetworkInt = networkInt & mask;
  const actualNetwork = intToIp(actualNetworkInt);
  
  // Check if the provided network is the actual network address
  if (actualNetwork !== parsed.network) {
    return {
      isValid: false,
      error: `Invalid network address. Did you mean ${actualNetwork}/${parsed.prefix}?`,
      normalized: `${actualNetwork}/${parsed.prefix}`,
    };
  }
  
  return { isValid: true, normalized: trimmed };
}

/**
 * Get netmask as 32-bit integer
 */
export function getNetmaskInt(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

/**
 * Get netmask as dotted decimal string
 */
export function getNetmask(prefix: number): string {
  return intToIp(getNetmaskInt(prefix));
}

/**
 * Get wildcard mask as dotted decimal string
 */
export function getWildcardMask(prefix: number): string {
  return intToIp(~getNetmaskInt(prefix) >>> 0);
}

/**
 * Calculate total number of IP addresses in a CIDR block
 */
export function getTotalHosts(prefix: number): number {
  return Math.pow(2, 32 - prefix);
}

/**
 * Calculate usable hosts in a CIDR block (total - network - broadcast)
 * For Azure, 5 addresses are reserved per subnet
 */
export function getUsableHosts(prefix: number): number {
  const total = getTotalHosts(prefix);
  // Azure reserves 5 IPs per subnet
  return Math.max(0, total - 5);
}

/**
 * Get the first IP address in a CIDR block
 */
export function getFirstIP(cidr: string): string {
  const parsed = parseCIDR(cidr);
  if (!parsed) return '';
  return parsed.network;
}

/**
 * Get the last IP address (broadcast) in a CIDR block
 */
export function getLastIP(cidr: string): string {
  const parsed = parseCIDR(cidr);
  if (!parsed) return '';
  
  const networkInt = ipToInt(parsed.network);
  const hostBits = 32 - parsed.prefix;
  const broadcastInt = (networkInt | ((1 << hostBits) - 1)) >>> 0;
  
  return intToIp(broadcastInt);
}

/**
 * Get complete CIDR block information
 */
export function getCIDRInfo(cidr: string): CIDRInfo | null {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;
  
  return {
    network: parsed.network,
    prefix: parsed.prefix,
    firstIP: getFirstIP(cidr),
    lastIP: getLastIP(cidr),
    totalHosts: getTotalHosts(parsed.prefix),
    usableHosts: getUsableHosts(parsed.prefix),
    netmask: getNetmask(parsed.prefix),
    wildcardMask: getWildcardMask(parsed.prefix),
  };
}

/**
 * Check if one CIDR block contains another
 */
export function cidrContains(parent: string, child: string): boolean {
  const parentParsed = parseCIDR(parent);
  const childParsed = parseCIDR(child);
  
  if (!parentParsed || !childParsed) return false;
  if (childParsed.prefix < parentParsed.prefix) return false;
  
  const parentNetworkInt = ipToInt(parentParsed.network);
  const childNetworkInt = ipToInt(childParsed.network);
  const parentMask = getNetmaskInt(parentParsed.prefix);
  
  return (parentNetworkInt & parentMask) === (childNetworkInt & parentMask);
}

/**
 * Check if two CIDR blocks overlap
 */
export function cidrOverlaps(cidr1: string, cidr2: string): boolean {
  return cidrContains(cidr1, cidr2) || cidrContains(cidr2, cidr1);
}

/**
 * Split a CIDR block into two equal halves
 * Returns null if the block cannot be split (prefix >= 30)
 */
export function splitCIDR(cidr: string): SubnetSplitResult | null {
  const parsed = parseCIDR(cidr);
  if (!parsed) return null;
  
  // Cannot split smaller than /30 (need at least 4 IPs for 2 usable)
  if (parsed.prefix >= 30) return null;
  
  const newPrefix = parsed.prefix + 1;
  const networkInt = ipToInt(parsed.network);
  
  // First half keeps the same network address
  const subnet1Network = parsed.network;
  
  // Second half starts at the midpoint
  const halfSize = Math.pow(2, 32 - newPrefix);
  const subnet2NetworkInt = networkInt + halfSize;
  const subnet2Network = intToIp(subnet2NetworkInt);
  
  return {
    subnet1: {
      cidr: `${subnet1Network}/${newPrefix}`,
      addressPrefix: `${subnet1Network}/${newPrefix}`,
    },
    subnet2: {
      cidr: `${subnet2Network}/${newPrefix}`,
      addressPrefix: `${subnet2Network}/${newPrefix}`,
    },
  };
}

/**
 * Find available CIDR blocks within a parent that don't overlap with existing allocations
 */
export function findAvailableBlocks(
  parentCIDR: string,
  allocatedCIDRs: string[],
  desiredPrefix: number
): string[] {
  const parentParsed = parseCIDR(parentCIDR);
  if (!parentParsed || desiredPrefix < parentParsed.prefix) return [];
  
  const blockSize = Math.pow(2, 32 - desiredPrefix);
  const parentNetworkInt = ipToInt(parentParsed.network);
  const parentLastInt = parentNetworkInt + getTotalHosts(parentParsed.prefix) - 1;
  
  const available: string[] = [];
  
  for (let networkInt = parentNetworkInt; networkInt <= parentLastInt; networkInt += blockSize) {
    const candidateCIDR = `${intToIp(networkInt)}/${desiredPrefix}`;
    
    // Check if this candidate overlaps with any allocated block
    const overlaps = allocatedCIDRs.some(allocated => cidrOverlaps(candidateCIDR, allocated));
    
    if (!overlaps) {
      available.push(candidateCIDR);
    }
  }
  
  return available;
}

/**
 * Format CIDR for display (e.g., "10.0.0.0/24 (256 IPs)")
 */
export function formatCIDRDisplay(cidr: string): string {
  const info = getCIDRInfo(cidr);
  if (!info) return cidr;
  return `${cidr} (${info.totalHosts.toLocaleString()} IPs)`;
}

/**
 * Get suggested subnet sizes for Azure VNets
 */
export function getSuggestedSubnetSizes(): { prefix: number; label: string; hosts: number }[] {
  return [
    { prefix: 24, label: '/24 - Small', hosts: 251 },
    { prefix: 25, label: '/25 - Extra Small', hosts: 123 },
    { prefix: 26, label: '/26 - Tiny', hosts: 59 },
    { prefix: 27, label: '/27 - Micro', hosts: 27 },
    { prefix: 28, label: '/28 - Nano', hosts: 11 },
    { prefix: 23, label: '/23 - Medium', hosts: 507 },
    { prefix: 22, label: '/22 - Large', hosts: 1019 },
    { prefix: 21, label: '/21 - Extra Large', hosts: 2043 },
    { prefix: 20, label: '/20 - Huge', hosts: 4091 },
  ];
}
