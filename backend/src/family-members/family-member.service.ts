import { HttpError } from '../shared/http-error';
import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from './family-member.schema';

export interface FamilyMemberRepositoryLike {
  findAll(): Promise<FamilyMember[]>;
  findById(id: string): Promise<FamilyMember | null>;
  create(data: CreateFamilyMemberInput): Promise<FamilyMember>;
  update(id: string, data: UpdateFamilyMemberInput): Promise<FamilyMember | null>;
  delete(id: string): Promise<FamilyMember | null>;
}

const NOT_FOUND_MESSAGE = 'Family member not found';

export class FamilyMemberService {
  constructor(private readonly repository: FamilyMemberRepositoryLike) {}

  list(): Promise<FamilyMember[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<FamilyMember> {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return member;
  }

  create(input: CreateFamilyMemberInput): Promise<FamilyMember> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateFamilyMemberInput): Promise<FamilyMember> {
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
  }
}
