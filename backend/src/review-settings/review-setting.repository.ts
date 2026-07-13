import { prisma } from '../db/client';
import type { ReviewSettingModel as ReviewSetting } from '../generated/prisma/models';
import type { UpdateReviewSettingInput } from './review-setting.schema';

export class ReviewSettingRepository {
  get(userId: string): Promise<ReviewSetting | null> {
    return prisma.reviewSetting.findUnique({ where: { userId } });
  }

  upsert(userId: string, data: UpdateReviewSettingInput): Promise<ReviewSetting> {
    return prisma.reviewSetting.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data
    });
  }
}
