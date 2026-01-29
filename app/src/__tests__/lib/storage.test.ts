import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadAppState,
  saveAppState,
  generateId,
  createProject,
  createVNet,
  createSubnet,
  addProject,
  updateProject,
  deleteProject,
  getProject,
  getActiveProject,
  addVNet,
  updateVNet,
  deleteVNet,
  getVNet,
  addSubnet,
  updateSubnet,
  deleteSubnet,
  getSubnet,
  splitSubnet,
  mergeSubnets,
} from '@/lib/storage';
import { AppState, Project, VNet } from '@/types';

describe('Storage Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('loadAppState', () => {
    it('should return default state when localStorage is empty', () => {
      const state = loadAppState();
      expect(state).toEqual({
        projects: [],
        activeProjectId: null,
        version: '1.0.0',
      });
    });

    it('should load state from localStorage', () => {
      const savedState: AppState = {
        projects: [
          {
            id: 'test-1',
            name: 'Test Project',
            description: '',
            vnets: [],
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
        activeProjectId: 'test-1',
        version: '1.0.0',
      };
      localStorage.setItem('azure-vnet-planner', JSON.stringify(savedState));

      const state = loadAppState();
      expect(state.projects).toHaveLength(1);
      expect(state.activeProjectId).toBe('test-1');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('azure-vnet-planner', 'invalid json');
      const state = loadAppState();
      expect(state).toEqual({
        projects: [],
        activeProjectId: null,
        version: '1.0.0',
      });
    });
  });

  describe('saveAppState', () => {
    it('should save state to localStorage', () => {
      const state: AppState = {
        projects: [],
        activeProjectId: null,
        version: '1.0.0',
      };
      saveAppState(state);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'azure-vnet-planner',
        JSON.stringify(state)
      );
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with timestamp prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('createProject', () => {
    it('should create a project with default values', () => {
      const project = createProject('My Project');
      expect(project.name).toBe('My Project');
      expect(project.description).toBe('');
      expect(project.vnets).toEqual([]);
      expect(project.id).toBeDefined();
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create a project with description', () => {
      const project = createProject('My Project', 'A test project');
      expect(project.description).toBe('A test project');
    });
  });

  describe('createVNet', () => {
    it('should create a VNet with required fields', () => {
      const vnet = createVNet('my-vnet', '10.0.0.0/16');
      expect(vnet.name).toBe('my-vnet');
      expect(vnet.addressSpace).toBe('10.0.0.0/16');
      expect(vnet.subnets).toEqual([]);
      expect(vnet.description).toBe('');
    });

    it('should create a VNet with description', () => {
      const vnet = createVNet('my-vnet', '10.0.0.0/16', 'Production VNet');
      expect(vnet.description).toBe('Production VNet');
    });
  });

  describe('createSubnet', () => {
    it('should create a subnet with required fields', () => {
      const subnet = createSubnet('web-subnet', '10.0.1.0/24');
      expect(subnet.name).toBe('web-subnet');
      expect(subnet.cidr).toBe('10.0.1.0/24');
      expect(subnet.addressPrefix).toBe('10.0.1.0/24');
      expect(subnet.delegation).toBeNull();
      expect(subnet.serviceEndpoints).toEqual([]);
      expect(subnet.isAllocated).toBe(true);
    });
  });

  describe('Project Operations', () => {
    let initialState: AppState;

    beforeEach(() => {
      initialState = {
        projects: [],
        activeProjectId: null,
        version: '1.0.0',
      };
    });

    describe('addProject', () => {
      it('should add a project and set it as active', () => {
        const project = createProject('Test');
        const newState = addProject(initialState, project);
        expect(newState.projects).toHaveLength(1);
        expect(newState.activeProjectId).toBe(project.id);
      });
    });

    describe('updateProject', () => {
      it('should update project fields', () => {
        const project = createProject('Test');
        let state = addProject(initialState, project);
        state = updateProject(state, project.id, { name: 'Updated' });
        expect(state.projects[0].name).toBe('Updated');
      });

      it('should set the updatedAt timestamp', () => {
        const project = createProject('Test');
        let state = addProject(initialState, project);
        state = updateProject(state, project.id, { name: 'Updated' });
        // Verify updatedAt is a valid ISO date string
        expect(state.projects[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    describe('deleteProject', () => {
      it('should remove a project', () => {
        const project = createProject('Test');
        let state = addProject(initialState, project);
        state = deleteProject(state, project.id);
        expect(state.projects).toHaveLength(0);
      });

      it('should clear activeProjectId if deleted project was active', () => {
        const project = createProject('Test');
        let state = addProject(initialState, project);
        state = deleteProject(state, project.id);
        expect(state.activeProjectId).toBeNull();
      });

      it('should set next project as active when active is deleted', () => {
        const project1 = createProject('Test 1');
        const project2 = createProject('Test 2');
        let state = addProject(initialState, project1);
        state = addProject(state, project2);
        state = deleteProject(state, project2.id);
        expect(state.activeProjectId).toBe(project1.id);
      });
    });

    describe('getProject', () => {
      it('should return project by ID', () => {
        const project = createProject('Test');
        const state = addProject(initialState, project);
        expect(getProject(state, project.id)).toEqual(project);
      });

      it('should return undefined for non-existent ID', () => {
        expect(getProject(initialState, 'non-existent')).toBeUndefined();
      });
    });

    describe('getActiveProject', () => {
      it('should return active project', () => {
        const project = createProject('Test');
        const state = addProject(initialState, project);
        expect(getActiveProject(state)?.id).toBe(project.id);
      });

      it('should return undefined when no active project', () => {
        expect(getActiveProject(initialState)).toBeUndefined();
      });
    });
  });

  describe('VNet Operations', () => {
    let stateWithProject: AppState;
    let project: Project;

    beforeEach(() => {
      project = createProject('Test');
      stateWithProject = addProject(
        { projects: [], activeProjectId: null, version: '1.0.0' },
        project
      );
    });

    describe('addVNet', () => {
      it('should add a VNet to a project', () => {
        const vnet = createVNet('my-vnet', '10.0.0.0/16');
        const state = addVNet(stateWithProject, project.id, vnet);
        expect(getProject(state, project.id)?.vnets).toHaveLength(1);
      });
    });

    describe('updateVNet', () => {
      it('should update VNet fields', () => {
        const vnet = createVNet('my-vnet', '10.0.0.0/16');
        let state = addVNet(stateWithProject, project.id, vnet);
        state = updateVNet(state, project.id, vnet.id, { name: 'updated-vnet' });
        expect(getVNet(state, project.id, vnet.id)?.name).toBe('updated-vnet');
      });
    });

    describe('deleteVNet', () => {
      it('should remove a VNet', () => {
        const vnet = createVNet('my-vnet', '10.0.0.0/16');
        let state = addVNet(stateWithProject, project.id, vnet);
        state = deleteVNet(state, project.id, vnet.id);
        expect(getProject(state, project.id)?.vnets).toHaveLength(0);
      });
    });

    describe('getVNet', () => {
      it('should return VNet by ID', () => {
        const vnet = createVNet('my-vnet', '10.0.0.0/16');
        const state = addVNet(stateWithProject, project.id, vnet);
        expect(getVNet(state, project.id, vnet.id)?.name).toBe('my-vnet');
      });

      it('should return undefined for non-existent VNet', () => {
        expect(getVNet(stateWithProject, project.id, 'non-existent')).toBeUndefined();
      });
    });
  });

  describe('Subnet Operations', () => {
    let stateWithVNet: AppState;
    let project: Project;
    let vnet: VNet;

    beforeEach(() => {
      project = createProject('Test');
      vnet = createVNet('my-vnet', '10.0.0.0/16');
      let state: AppState = { projects: [], activeProjectId: null, version: '1.0.0' };
      state = addProject(state, project);
      stateWithVNet = addVNet(state, project.id, vnet);
    });

    describe('addSubnet', () => {
      it('should add a subnet to a VNet', () => {
        const subnet = createSubnet('web', '10.0.1.0/24');
        const state = addSubnet(stateWithVNet, project.id, vnet.id, subnet);
        expect(getVNet(state, project.id, vnet.id)?.subnets).toHaveLength(1);
      });
    });

    describe('updateSubnet', () => {
      it('should update subnet fields', () => {
        const subnet = createSubnet('web', '10.0.1.0/24');
        let state = addSubnet(stateWithVNet, project.id, vnet.id, subnet);
        state = updateSubnet(state, project.id, vnet.id, subnet.id, { name: 'api' });
        expect(getSubnet(state, project.id, vnet.id, subnet.id)?.name).toBe('api');
      });
    });

    describe('deleteSubnet', () => {
      it('should remove a subnet', () => {
        const subnet = createSubnet('web', '10.0.1.0/24');
        let state = addSubnet(stateWithVNet, project.id, vnet.id, subnet);
        state = deleteSubnet(state, project.id, vnet.id, subnet.id);
        expect(getVNet(state, project.id, vnet.id)?.subnets).toHaveLength(0);
      });
    });

    describe('getSubnet', () => {
      it('should return subnet by ID', () => {
        const subnet = createSubnet('web', '10.0.1.0/24');
        const state = addSubnet(stateWithVNet, project.id, vnet.id, subnet);
        expect(getSubnet(state, project.id, vnet.id, subnet.id)?.name).toBe('web');
      });
    });

    describe('splitSubnet', () => {
      it('should replace one subnet with two', () => {
        const subnet = createSubnet('web', '10.0.0.0/24');
        let state = addSubnet(stateWithVNet, project.id, vnet.id, subnet);

        const newSubnet1 = createSubnet('web-1', '10.0.0.0/25');
        const newSubnet2 = createSubnet('web-2', '10.0.0.128/25');

        state = splitSubnet(state, project.id, vnet.id, subnet.id, [newSubnet1, newSubnet2]);

        const subnets = getVNet(state, project.id, vnet.id)?.subnets ?? [];
        expect(subnets).toHaveLength(2);
        expect(subnets[0].name).toBe('web-1');
        expect(subnets[1].name).toBe('web-2');
      });

      it('should return unchanged state if subnet not found', () => {
        const state = splitSubnet(
          stateWithVNet,
          project.id,
          vnet.id,
          'non-existent',
          [createSubnet('a', '10.0.0.0/25'), createSubnet('b', '10.0.0.128/25')]
        );
        expect(state).toEqual(stateWithVNet);
      });
    });

    describe('mergeSubnets', () => {
      it('should replace two subnets with one', () => {
        const subnet1 = createSubnet('web-1', '10.0.0.0/25');
        const subnet2 = createSubnet('web-2', '10.0.0.128/25');
        let state = addSubnet(stateWithVNet, project.id, vnet.id, subnet1);
        state = addSubnet(state, project.id, vnet.id, subnet2);

        const merged = createSubnet('web', '10.0.0.0/24');
        state = mergeSubnets(state, project.id, vnet.id, subnet1.id, subnet2.id, merged);

        const subnets = getVNet(state, project.id, vnet.id)?.subnets ?? [];
        expect(subnets).toHaveLength(1);
        expect(subnets[0].name).toBe('web');
        expect(subnets[0].cidr).toBe('10.0.0.0/24');
      });
    });
  });
});
