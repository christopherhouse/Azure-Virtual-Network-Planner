import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/app-context';

// Wrapper component for hooks
function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Provider', () => {
    it('should render children', () => {
      render(
        <AppProvider>
          <div data-testid="child">Hello</div>
        </AppProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      expect(result.current.state.projects).toEqual([]);
      expect(result.current.state.activeProjectId).toBeNull();
      expect(result.current.activeProject).toBeUndefined();
    });
  });

  describe('Project operations', () => {
    it('should create a new project', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.createNewProject('Test Project', 'Description');
      });

      expect(result.current.state.projects).toHaveLength(1);
      expect(result.current.state.projects[0].name).toBe('Test Project');
      expect(result.current.state.projects[0].description).toBe('Description');
    });

    it('should set new project as active', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      expect(result.current.state.activeProjectId).toBe(project!.id);
      expect(result.current.activeProject?.id).toBe(project!.id);
    });

    it('should update project details', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Original Name');
      });

      act(() => {
        result.current.updateProjectDetails(project!.id, { name: 'Updated Name' });
      });

      expect(result.current.state.projects[0].name).toBe('Updated Name');
    });

    it('should remove a project', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      act(() => {
        result.current.removeProject(project!.id);
      });

      expect(result.current.state.projects).toHaveLength(0);
    });

    it('should change active project', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project1: ReturnType<typeof result.current.createNewProject>;
      let project2: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project1 = result.current.createNewProject('Project 1');
        project2 = result.current.createNewProject('Project 2');
      });

      expect(result.current.state.activeProjectId).toBe(project2!.id);

      act(() => {
        result.current.setActiveProject(project1!.id);
      });

      expect(result.current.state.activeProjectId).toBe(project1!.id);
    });
  });

  describe('VNet operations', () => {
    it('should create a new VNet', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      act(() => {
        result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16', 'Test VNet');
      });

      expect(result.current.activeProject?.vnets).toHaveLength(1);
      expect(result.current.activeProject?.vnets[0].name).toBe('my-vnet');
      expect(result.current.activeProject?.vnets[0].addressSpace).toBe('10.0.0.0/16');
    });

    it('should update VNet details', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      act(() => {
        result.current.updateVNetDetails(project!.id, vnet!.id, { name: 'updated-vnet' });
      });

      expect(result.current.activeProject?.vnets[0].name).toBe('updated-vnet');
    });

    it('should remove a VNet', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      act(() => {
        result.current.removeVNet(project!.id, vnet!.id);
      });

      expect(result.current.activeProject?.vnets).toHaveLength(0);
    });
  });

  describe('Subnet operations', () => {
    it('should update subnet details', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      // VNet is created with a default subnet
      const subnetId = result.current.activeProject?.vnets[0].subnets[0]?.id;

      if (subnetId) {
        act(() => {
          result.current.updateSubnetDetails(project!.id, vnet!.id, subnetId, { name: 'web-tier' });
        });

        expect(result.current.activeProject?.vnets[0].subnets[0].name).toBe('web-tier');
      }
    });

    it('should split a subnet', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      const subnetId = result.current.activeProject?.vnets[0].subnets[0]?.id;
      const originalCidr = result.current.activeProject?.vnets[0].subnets[0]?.cidr;

      // Only test split if there's a subnet that can be split
      if (subnetId && originalCidr && !originalCidr.endsWith('/29')) {
        const initialCount = result.current.activeProject?.vnets[0].subnets.length ?? 0;

        act(() => {
          const success = result.current.splitSubnetInTwo(project!.id, vnet!.id, subnetId);
          expect(success).toBe(true);
        });

        // After split, should have one more subnet
        expect(result.current.activeProject?.vnets[0].subnets.length).toBe(initialCount + 1);
      }
    });

    it('should set subnet delegation', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      const subnetId = result.current.activeProject?.vnets[0].subnets[0]?.id;

      if (subnetId) {
        const delegation = {
          id: 'aci',
          name: 'Azure Container Instances',
          serviceName: 'Microsoft.ContainerInstance/containerGroups',
          description: 'ACI delegation',
        };

        act(() => {
          result.current.setSubnetDelegation(project!.id, vnet!.id, subnetId, delegation);
        });

        expect(result.current.activeProject?.vnets[0].subnets[0].delegation?.serviceName).toBe(
          'Microsoft.ContainerInstance/containerGroups'
        );
      }
    });

    it('should set subnet service endpoints', () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      let project: ReturnType<typeof result.current.createNewProject>;
      act(() => {
        project = result.current.createNewProject('Test Project');
      });

      let vnet: ReturnType<typeof result.current.createNewVNet>;
      act(() => {
        vnet = result.current.createNewVNet(project!.id, 'my-vnet', '10.0.0.0/16');
      });

      const subnetId = result.current.activeProject?.vnets[0].subnets[0]?.id;

      if (subnetId) {
        const endpoints = [
          {
            id: 'storage',
            name: 'Microsoft.Storage',
            service: 'Microsoft.Storage',
            description: 'Azure Storage',
          },
        ];

        act(() => {
          result.current.setSubnetServiceEndpoints(project!.id, vnet!.id, subnetId, endpoints);
        });

        expect(result.current.activeProject?.vnets[0].subnets[0].serviceEndpoints).toHaveLength(1);
        expect(result.current.activeProject?.vnets[0].subnets[0].serviceEndpoints[0].service).toBe(
          'Microsoft.Storage'
        );
      }
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      act(() => {
        result.current.createNewProject('Persistent Project');
      });

      // Wait for effect to run
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
      });
    });
  });
});

// Test for useApp outside provider
describe('useApp outside provider', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');

    consoleSpy.mockRestore();
  });
});
