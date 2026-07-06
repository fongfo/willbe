export type CheckInFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface FrequencyOption {
  value: CheckInFrequency;
  label: string;
  description: string;
}

export interface CloudProviderOption {
  value: string;
  label: string;
  description: string;
  initials: string;
}

export const frequencyOptions: FrequencyOption[] = [
  {
    value: 'MONTHLY',
    label: 'Monthly',
    description: 'Best for active families updating contacts or documents often.'
  },
  {
    value: 'QUARTERLY',
    label: 'Quarterly',
    description: 'A balanced rhythm for most family plans.'
  },
  {
    value: 'YEARLY',
    label: 'Yearly',
    description: 'A light annual review for stable plans.'
  }
];

export const cloudProviderOptions: CloudProviderOption[] = [
  {
    value: 'google-drive',
    label: 'Google Drive',
    description: 'Attach a folder where family planning documents are stored.',
    initials: 'GD'
  },
  {
    value: 'icloud-drive',
    label: 'iCloud Drive',
    description: 'Keep Apple family documents easy to locate.',
    initials: 'ID'
  },
  {
    value: 'onedrive',
    label: 'OneDrive',
    description: 'Use a Microsoft folder shared with trusted contacts.',
    initials: 'OD'
  }
];
