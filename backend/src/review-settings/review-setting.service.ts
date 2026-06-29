import { CheckInFrequency } from '../generated/prisma/enums';
import type { CloudProvider } from '../generated/prisma/enums';
import type { ReviewSettingModel as ReviewSetting } from '../generated/prisma/models';
import type { UpdateReviewSettingInput } from './review-setting.schema';

// Shape returned by `get()` before the singleton has ever been saved. The persisted
// `ReviewSetting` is a superset (adds id/timestamps), so both satisfy the API consumer.
export interface ReviewSettingView {
  checkInFrequency: CheckInFrequency;
  connectedProviders: CloudProvider[];
}

export interface ReviewSettingRepositoryLike {
  get(): Promise<ReviewSetting | null>;
  upsert(data: UpdateReviewSettingInput): Promise<ReviewSetting>;
}

const DEFAULT_SETTING: ReviewSettingView = {
  checkInFrequency: CheckInFrequency.EVERY_6_MONTHS,
  connectedProviders: []
};

export class ReviewSettingService {
  constructor(private readonly repository: ReviewSettingRepositoryLike) {}

  async get(): Promise<ReviewSetting | ReviewSettingView> {
    const setting = await this.repository.get();
    return setting ?? DEFAULT_SETTING;
  }

  save(input: UpdateReviewSettingInput): Promise<ReviewSetting> {
    return this.repository.upsert(input);
  }
}
