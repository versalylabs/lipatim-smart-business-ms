import { UserRole } from './user';

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  kraPin: string;
  phone: string;
  createdAt: string;
  isDemoTenant?: boolean;
}

export interface AuthAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  tenantId: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
  };
  tenant: Tenant;
}

export interface RegisterTenantData {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  phone: string;
  kraPin?: string;
  branchName?: string;
}

export const DEMO_TENANT_ID = 'tenant_demo';

export const DEMO_TENANT: Tenant = {
  id: DEMO_TENANT_ID,
  name: 'LipaTim Supermarket & Pharmacy Ltd',
  ownerEmail: 'versalylabs@gmail.com',
  kraPin: 'P051239841K',
  phone: '+254 722 100 200',
  createdAt: '2026-01-01T00:00:00Z',
  isDemoTenant: true,
};

export const DEMO_ACCOUNT: AuthAccount = {
  id: 'usr_demo_admin',
  email: 'versalylabs@gmail.com',
  password: 'labversaly-16',
  name: 'David Omondi (Versaly Labs)',
  tenantId: DEMO_TENANT_ID,
  role: 'admin',
  createdAt: '2026-01-01T00:00:00Z',
};
