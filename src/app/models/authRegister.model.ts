export interface AuthRegister {
    password: string
    email: string
    username: string
}
export interface Register{
  user: AuthRegister,
  client: ClientRegister
}
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: number
}
export interface ClientRegister {
  firstname: string;
  lastname: string;
  country: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  gender: string;
  userId?: number;
}
export interface AuthUserData {
  id: number;
  username: string;
  email: string;
  roles: Roles;
  status: string;
  twoFactor: boolean;
  emailVerifiated: boolean;
  temporaryActivationCode: string;
  temporaryActivationCodeTimeStamp: string;
  locked: boolean;
}

interface Roles {
  id: number;
  roleName: string;
}