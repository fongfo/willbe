import { fireEvent, render, screen } from '@testing-library/react-native';
import AssetReferencesRoute from '../src/app/asset-references';
import AssetReferenceForm from '../src/asset-references/AssetReferenceForm';
import AssetReferencesScreen from '../src/asset-references/AssetReferencesScreen';
import * as api from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';

jest.mock('../src/asset-references/assetReference.api');

const mockedApi = api as jest.Mocked<typeof api>;

function makeReference(overrides: Partial<AssetReference> = {}): AssetReference {
  return {
    id: 'a1',
    name: 'Maybank — main account',
    category: 'BANK',
    locationHint: 'Drive ▸ Family ▸ Banking',
    detail: 'Joint with spouse',
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides
  };
}

afterEach(() => jest.clearAllMocks());

describe('AssetReferencesScreen', () => {
  it('renders references with a category icon and location hint', async () => {
    mockedApi.listAssetReferences.mockResolvedValue([makeReference()]);

    render(<AssetReferencesScreen />);

    expect(await screen.findByText('Maybank — main account')).toBeTruthy();
    expect(screen.getByText('BANK')).toBeTruthy();
    expect(screen.getByText('▸ Drive ▸ Family ▸ Banking')).toBeTruthy();
  });

  it('flags a reference with no location documented', async () => {
    mockedApi.listAssetReferences.mockResolvedValue([
      makeReference({ id: 'a2', name: 'DBS Singapore account', locationHint: null })
    ]);

    render(<AssetReferencesScreen />);

    expect(await screen.findByText('▸ Not yet documented')).toBeTruthy();
  });

  it('shows the empty state and the compliance notice', async () => {
    mockedApi.listAssetReferences.mockResolvedValue([]);

    render(<AssetReferencesScreen />);

    expect(await screen.findByText(/Nothing referenced yet/)).toBeTruthy();
    expect(screen.getByText(/never account\s+numbers, balances, or passwords/)).toBeTruthy();
  });

  it('surfaces a load error', async () => {
    mockedApi.listAssetReferences.mockRejectedValue(new Error('Network down'));

    render(<AssetReferencesScreen />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('adds a reference through the two-step form', async () => {
    mockedApi.listAssetReferences.mockResolvedValue([]);
    mockedApi.createAssetReference.mockResolvedValue(
      makeReference({ id: 'a3', name: 'Condo, Mont Kiara', category: 'PROPERTY' })
    );

    render(<AssetReferencesScreen />);
    await screen.findByText(/Nothing referenced yet/);

    // Step 1: choose a category, then advance.
    fireEvent.press(screen.getByText('Property'));
    fireEvent.press(screen.getByText('Next'));

    // Step 2: fill the name and submit.
    fireEvent.changeText(screen.getByLabelText('Name'), 'Condo, Mont Kiara');
    fireEvent.press(screen.getByText('Add reference'));

    expect(await screen.findByText('Condo, Mont Kiara')).toBeTruthy();
    expect(mockedApi.createAssetReference).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Condo, Mont Kiara', category: 'PROPERTY' })
    );
  });

  it('is exposed through the asset-references route', async () => {
    mockedApi.listAssetReferences.mockResolvedValue([]);

    render(<AssetReferencesRoute />);

    expect(await screen.findByText('What would your family need to find?')).toBeTruthy();
  });
});

describe('AssetReferenceForm (two-step)', () => {
  it('does not advance to step 2 until a category is chosen', () => {
    render(<AssetReferenceForm onSubmit={jest.fn().mockResolvedValue(undefined)} />);

    // Next is disabled; pressing it keeps us on the category step.
    fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText('Step 1 of 2 · Category')).toBeTruthy();

    fireEvent.press(screen.getByText('Banking'));
    fireEvent.press(screen.getByText('Next'));
    expect(screen.getByText('Where should your family look?')).toBeTruthy();
  });

  it('can navigate back to the category step', () => {
    render(<AssetReferenceForm onSubmit={jest.fn().mockResolvedValue(undefined)} />);

    fireEvent.press(screen.getByText('Crypto'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('‹ Back'));

    expect(screen.getByText('Step 1 of 2 · Category')).toBeTruthy();
  });

  it('validates a required name on step 2', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<AssetReferenceForm onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Banking'));
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Add reference'));

    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
