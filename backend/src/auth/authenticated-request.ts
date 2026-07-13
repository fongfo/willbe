import type { Request } from 'express';
import type { UserModel as User } from '../generated/prisma/models';

export interface AuthenticatedRequest extends Request {
  authUser: User;
}

