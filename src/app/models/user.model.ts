export type AccountStatus = 'CREATED' | 'DEACTIVATED' | 'ACTIVATED' | 'SUSPENDED';

export interface Role {
  id: number;
  roleName: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  roles: Role[];
  status: AccountStatus;
  twoFactor: boolean;
  locked: boolean;
  emailVerifiated: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface AddRoleRequest {
  userId: number;
  roleIds: number[];
}

export interface ActivateAccountRequest {
  userId: number;
  value: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateRoleRequest {
  roleName: string;
}
