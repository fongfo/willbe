export interface AccountUser {
  id: string;
  privyUserId: string;
  email?: string | null;
  name?: string | null;
  walletAddress?: string | null;
}

export interface AuthSession {
  user: AccountUser;
}

export interface SignInInput {
  email: string;
  name: string;
}
