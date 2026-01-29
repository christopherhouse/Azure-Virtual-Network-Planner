import { describe, it, expect } from 'vitest';
import {
  ipToInt,
  intToIp,
  parseCIDR,
  validateCIDR,
  getNetmaskInt,
  getNetmask,
  getWildcardMask,
  getTotalHosts,
  getUsableHosts,
  getFirstIP,
  getLastIP,
  getCIDRInfo,
  cidrContains,
  cidrOverlaps,
  splitCIDR,
  canMergeCIDR,
  mergeCIDR,
  findAvailableBlocks,
  formatCIDRDisplay,
  getSuggestedSubnetSizes,
} from '@/lib/cidr';

describe('CIDR Utilities', () => {
  describe('ipToInt', () => {
    it('should convert 0.0.0.0 to 0', () => {
      expect(ipToInt('0.0.0.0')).toBe(0);
    });

    it('should convert 255.255.255.255 to max uint32', () => {
      expect(ipToInt('255.255.255.255')).toBe(4294967295);
    });

    it('should convert 10.0.0.0 correctly', () => {
      expect(ipToInt('10.0.0.0')).toBe(167772160);
    });

    it('should convert 192.168.1.1 correctly', () => {
      expect(ipToInt('192.168.1.1')).toBe(3232235777);
    });

    it('should convert 172.16.0.1 correctly', () => {
      expect(ipToInt('172.16.0.1')).toBe(2886729729);
    });
  });

  describe('intToIp', () => {
    it('should convert 0 to 0.0.0.0', () => {
      expect(intToIp(0)).toBe('0.0.0.0');
    });

    it('should convert max uint32 to 255.255.255.255', () => {
      expect(intToIp(4294967295)).toBe('255.255.255.255');
    });

    it('should convert 167772160 to 10.0.0.0', () => {
      expect(intToIp(167772160)).toBe('10.0.0.0');
    });

    it('should be inverse of ipToInt', () => {
      const testIPs = ['10.0.0.1', '192.168.1.1', '172.16.0.0', '8.8.8.8'];
      testIPs.forEach(ip => {
        expect(intToIp(ipToInt(ip))).toBe(ip);
      });
    });
  });

  describe('parseCIDR', () => {
    it('should parse valid CIDR notation', () => {
      expect(parseCIDR('10.0.0.0/16')).toEqual({ network: '10.0.0.0', prefix: 16 });
    });

    it('should parse /24 subnet', () => {
      expect(parseCIDR('192.168.1.0/24')).toEqual({ network: '192.168.1.0', prefix: 24 });
    });

    it('should parse /32 host route', () => {
      expect(parseCIDR('10.0.0.1/32')).toEqual({ network: '10.0.0.1', prefix: 32 });
    });

    it('should parse /0 default route', () => {
      expect(parseCIDR('0.0.0.0/0')).toEqual({ network: '0.0.0.0', prefix: 0 });
    });

    it('should return null for invalid CIDR', () => {
      expect(parseCIDR('invalid')).toBeNull();
      expect(parseCIDR('10.0.0.0')).toBeNull();
      expect(parseCIDR('10.0.0.0/')).toBeNull();
      expect(parseCIDR('/24')).toBeNull();
    });

    it('should return null for invalid prefix', () => {
      expect(parseCIDR('10.0.0.0/33')).toBeNull();
      expect(parseCIDR('10.0.0.0/-1')).toBeNull();
    });

    it('should return null for invalid octets', () => {
      expect(parseCIDR('256.0.0.0/24')).toBeNull();
      expect(parseCIDR('10.0.0.256/24')).toBeNull();
    });
  });

  describe('validateCIDR', () => {
    it('should validate correct CIDR', () => {
      const result = validateCIDR('10.0.0.0/16');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('10.0.0.0/16');
    });

    it('should reject empty input', () => {
      const result = validateCIDR('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CIDR block is required');
    });

    it('should reject invalid format', () => {
      const result = validateCIDR('invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid CIDR format');
    });

    it('should suggest correct network address', () => {
      const result = validateCIDR('10.0.0.5/24');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Did you mean 10.0.0.0/24');
      expect(result.normalized).toBe('10.0.0.0/24');
    });

    it('should suggest correct network for /16', () => {
      const result = validateCIDR('10.0.1.0/16');
      expect(result.isValid).toBe(false);
      expect(result.normalized).toBe('10.0.0.0/16');
    });

    it('should handle whitespace', () => {
      const result = validateCIDR('  10.0.0.0/16  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getNetmaskInt', () => {
    it('should return 0 for /0', () => {
      expect(getNetmaskInt(0)).toBe(0);
    });

    it('should return all 1s for /32', () => {
      expect(getNetmaskInt(32)).toBe(4294967295);
    });

    it('should return correct mask for /24', () => {
      expect(getNetmaskInt(24)).toBe(4294967040); // 255.255.255.0
    });

    it('should return correct mask for /16', () => {
      expect(getNetmaskInt(16)).toBe(4294901760); // 255.255.0.0
    });

    it('should return correct mask for /8', () => {
      expect(getNetmaskInt(8)).toBe(4278190080); // 255.0.0.0
    });
  });

  describe('getNetmask', () => {
    it('should return 255.255.255.0 for /24', () => {
      expect(getNetmask(24)).toBe('255.255.255.0');
    });

    it('should return 255.255.0.0 for /16', () => {
      expect(getNetmask(16)).toBe('255.255.0.0');
    });

    it('should return 255.0.0.0 for /8', () => {
      expect(getNetmask(8)).toBe('255.0.0.0');
    });

    it('should return 255.255.255.255 for /32', () => {
      expect(getNetmask(32)).toBe('255.255.255.255');
    });

    it('should return 0.0.0.0 for /0', () => {
      expect(getNetmask(0)).toBe('0.0.0.0');
    });
  });

  describe('getWildcardMask', () => {
    it('should return 0.0.0.255 for /24', () => {
      expect(getWildcardMask(24)).toBe('0.0.0.255');
    });

    it('should return 0.0.255.255 for /16', () => {
      expect(getWildcardMask(16)).toBe('0.0.255.255');
    });

    it('should return 0.0.0.0 for /32', () => {
      expect(getWildcardMask(32)).toBe('0.0.0.0');
    });
  });

  describe('getTotalHosts', () => {
    it('should return 256 for /24', () => {
      expect(getTotalHosts(24)).toBe(256);
    });

    it('should return 65536 for /16', () => {
      expect(getTotalHosts(16)).toBe(65536);
    });

    it('should return 1 for /32', () => {
      expect(getTotalHosts(32)).toBe(1);
    });

    it('should return 4294967296 for /0', () => {
      expect(getTotalHosts(0)).toBe(4294967296);
    });
  });

  describe('getUsableHosts', () => {
    it('should return total - 5 for Azure subnets', () => {
      expect(getUsableHosts(24)).toBe(251); // 256 - 5
    });

    it('should return 0 for very small subnets', () => {
      expect(getUsableHosts(32)).toBe(0); // 1 - 5 = -4, clamped to 0
      expect(getUsableHosts(31)).toBe(0); // 2 - 5 = -3, clamped to 0
    });

    it('should return correct count for /28', () => {
      expect(getUsableHosts(28)).toBe(11); // 16 - 5
    });
  });

  describe('getFirstIP', () => {
    it('should return network address', () => {
      expect(getFirstIP('10.0.0.0/24')).toBe('10.0.0.0');
    });

    it('should return empty for invalid CIDR', () => {
      expect(getFirstIP('invalid')).toBe('');
    });
  });

  describe('getLastIP', () => {
    it('should return broadcast address for /24', () => {
      expect(getLastIP('10.0.0.0/24')).toBe('10.0.0.255');
    });

    it('should return broadcast address for /16', () => {
      expect(getLastIP('10.0.0.0/16')).toBe('10.0.255.255');
    });

    it('should return same address for /32', () => {
      expect(getLastIP('10.0.0.1/32')).toBe('10.0.0.1');
    });

    it('should return empty for invalid CIDR', () => {
      expect(getLastIP('invalid')).toBe('');
    });
  });

  describe('getCIDRInfo', () => {
    it('should return complete info for valid CIDR', () => {
      const info = getCIDRInfo('10.0.0.0/24');
      expect(info).toEqual({
        network: '10.0.0.0',
        prefix: 24,
        firstIP: '10.0.0.0',
        lastIP: '10.0.0.255',
        totalHosts: 256,
        usableHosts: 251,
        netmask: '255.255.255.0',
        wildcardMask: '0.0.0.255',
      });
    });

    it('should return null for invalid CIDR', () => {
      expect(getCIDRInfo('invalid')).toBeNull();
    });
  });

  describe('cidrContains', () => {
    it('should return true when parent contains child', () => {
      expect(cidrContains('10.0.0.0/16', '10.0.1.0/24')).toBe(true);
    });

    it('should return true when CIDRs are identical', () => {
      expect(cidrContains('10.0.0.0/24', '10.0.0.0/24')).toBe(true);
    });

    it('should return false when child is larger than parent', () => {
      expect(cidrContains('10.0.1.0/24', '10.0.0.0/16')).toBe(false);
    });

    it('should return false when CIDRs dont overlap', () => {
      expect(cidrContains('10.0.0.0/24', '10.1.0.0/24')).toBe(false);
    });

    it('should return false for invalid CIDRs', () => {
      expect(cidrContains('invalid', '10.0.0.0/24')).toBe(false);
      expect(cidrContains('10.0.0.0/24', 'invalid')).toBe(false);
    });
  });

  describe('cidrOverlaps', () => {
    it('should return true for identical CIDRs', () => {
      expect(cidrOverlaps('10.0.0.0/24', '10.0.0.0/24')).toBe(true);
    });

    it('should return true when one contains the other', () => {
      expect(cidrOverlaps('10.0.0.0/16', '10.0.1.0/24')).toBe(true);
      expect(cidrOverlaps('10.0.1.0/24', '10.0.0.0/16')).toBe(true);
    });

    it('should return false for non-overlapping CIDRs', () => {
      expect(cidrOverlaps('10.0.0.0/24', '10.0.1.0/24')).toBe(false);
      expect(cidrOverlaps('192.168.0.0/24', '10.0.0.0/24')).toBe(false);
    });
  });

  describe('splitCIDR', () => {
    it('should split /24 into two /25s', () => {
      const result = splitCIDR('10.0.0.0/24');
      expect(result).toEqual({
        subnet1: { cidr: '10.0.0.0/25', addressPrefix: '10.0.0.0/25' },
        subnet2: { cidr: '10.0.0.128/25', addressPrefix: '10.0.0.128/25' },
      });
    });

    it('should split /16 into two /17s', () => {
      const result = splitCIDR('10.0.0.0/16');
      expect(result).toEqual({
        subnet1: { cidr: '10.0.0.0/17', addressPrefix: '10.0.0.0/17' },
        subnet2: { cidr: '10.0.128.0/17', addressPrefix: '10.0.128.0/17' },
      });
    });

    it('should return null for /29 (Azure minimum)', () => {
      expect(splitCIDR('10.0.0.0/29')).toBeNull();
    });

    it('should return null for invalid CIDR', () => {
      expect(splitCIDR('invalid')).toBeNull();
    });
  });

  describe('canMergeCIDR', () => {
    it('should return true for adjacent siblings', () => {
      expect(canMergeCIDR('10.0.0.0/25', '10.0.0.128/25')).toBe(true);
    });

    it('should return false for non-adjacent blocks', () => {
      expect(canMergeCIDR('10.0.0.0/25', '10.0.1.0/25')).toBe(false);
    });

    it('should return false for different sizes', () => {
      expect(canMergeCIDR('10.0.0.0/24', '10.0.1.0/25')).toBe(false);
    });

    it('should return false for invalid CIDRs', () => {
      expect(canMergeCIDR('invalid', '10.0.0.0/25')).toBe(false);
    });

    it('should return false for /8 or larger', () => {
      expect(canMergeCIDR('10.0.0.0/8', '11.0.0.0/8')).toBe(false);
    });
  });

  describe('mergeCIDR', () => {
    it('should merge two /25s into /24', () => {
      expect(mergeCIDR('10.0.0.0/25', '10.0.0.128/25')).toBe('10.0.0.0/24');
    });

    it('should merge regardless of order', () => {
      expect(mergeCIDR('10.0.0.128/25', '10.0.0.0/25')).toBe('10.0.0.0/24');
    });

    it('should return null if cannot merge', () => {
      expect(mergeCIDR('10.0.0.0/25', '10.0.1.0/25')).toBeNull();
    });
  });

  describe('findAvailableBlocks', () => {
    it('should find all blocks when none allocated', () => {
      const available = findAvailableBlocks('10.0.0.0/24', [], 26);
      expect(available).toHaveLength(4);
      expect(available).toContain('10.0.0.0/26');
      expect(available).toContain('10.0.0.64/26');
      expect(available).toContain('10.0.0.128/26');
      expect(available).toContain('10.0.0.192/26');
    });

    it('should exclude allocated blocks', () => {
      const available = findAvailableBlocks('10.0.0.0/24', ['10.0.0.0/26'], 26);
      expect(available).toHaveLength(3);
      expect(available).not.toContain('10.0.0.0/26');
    });

    it('should return empty for invalid parent', () => {
      expect(findAvailableBlocks('invalid', [], 24)).toEqual([]);
    });

    it('should return empty if desired prefix smaller than parent', () => {
      expect(findAvailableBlocks('10.0.0.0/24', [], 16)).toEqual([]);
    });
  });

  describe('formatCIDRDisplay', () => {
    it('should format CIDR with host count', () => {
      expect(formatCIDRDisplay('10.0.0.0/24')).toBe('10.0.0.0/24 (256 IPs)');
    });

    it('should return input for invalid CIDR', () => {
      expect(formatCIDRDisplay('invalid')).toBe('invalid');
    });

    it('should format large numbers with commas', () => {
      const display = formatCIDRDisplay('10.0.0.0/16');
      expect(display).toContain('65,536');
    });
  });

  describe('getSuggestedSubnetSizes', () => {
    it('should return array of suggested sizes', () => {
      const sizes = getSuggestedSubnetSizes();
      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
    });

    it('should include /24 subnet', () => {
      const sizes = getSuggestedSubnetSizes();
      const size24 = sizes.find(s => s.prefix === 24);
      expect(size24).toBeDefined();
      expect(size24?.hosts).toBe(251);
    });

    it('should have prefix, label, and hosts for each entry', () => {
      const sizes = getSuggestedSubnetSizes();
      sizes.forEach(size => {
        expect(size).toHaveProperty('prefix');
        expect(size).toHaveProperty('label');
        expect(size).toHaveProperty('hosts');
        expect(typeof size.prefix).toBe('number');
        expect(typeof size.label).toBe('string');
        expect(typeof size.hosts).toBe('number');
      });
    });
  });
});
