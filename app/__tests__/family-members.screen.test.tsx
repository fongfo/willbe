import { fireEvent, render, screen } from '@testing-library/react-native';
import FamilyMembersRoute from '../src/app/family-members';
import FamilyMemberForm from '../src/family-members/FamilyMemberForm';
import FamilyMembersScreen from '../src/family-members/FamilyMembersScreen';
import * as api from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';

jest.mock('../src/family-members/familyMember.api');

const mockedApi = api as jest.Mocked<typeof api>;

function makeMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'm1',
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    detail: 'Petaling Jaya',
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides
  };
}

afterEach(() => jest.clearAllMocks());

describe('FamilyMembersScreen', () => {
  it('renders the loaded members with a relation · detail subtitle', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([makeMember()]);

    render(<FamilyMembersScreen />);

    expect(await screen.findByText('Imran Rahman')).toBeTruthy();
    expect(screen.getByText('Spouse · Petaling Jaya')).toBeTruthy();
  });

  it('shows the empty state when no one is added', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([]);

    render(<FamilyMembersScreen />);

    expect(await screen.findByText(/No one added yet/)).toBeTruthy();
  });

  it('surfaces a load error', async () => {
    mockedApi.listFamilyMembers.mockRejectedValue(new Error('Network down'));

    render(<FamilyMembersScreen />);

    expect(await screen.findByText('Network down')).toBeTruthy();
  });

  it('shows a generic message when a non-Error is thrown', async () => {
    mockedApi.listFamilyMembers.mockRejectedValue('boom');

    render(<FamilyMembersScreen />);

    expect(await screen.findByText('Something went wrong')).toBeTruthy();
  });

  it('is exposed through the family-members route', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([]);

    render(<FamilyMembersRoute />);

    expect(await screen.findByText('Your family directory')).toBeTruthy();
  });

  it('adds a new member through the form', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([]);
    mockedApi.createFamilyMember.mockResolvedValue(
      makeMember({ id: 'm2', name: 'Nur Rahman', relation: 'CHILD', detail: 'Age 14' })
    );

    render(<FamilyMembersScreen />);
    await screen.findByText(/No one added yet/);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Nur Rahman');
    fireEvent.press(screen.getByText('Child'));
    fireEvent.press(screen.getByText('Add family member'));

    expect(await screen.findByText('Nur Rahman')).toBeTruthy();
    expect(mockedApi.createFamilyMember).toHaveBeenCalledWith({
      name: 'Nur Rahman',
      relation: 'CHILD',
      detail: null
    });
  });

  it('edits an existing member through the form', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([makeMember()]);
    mockedApi.updateFamilyMember.mockResolvedValue(
      makeMember({ name: 'Imran Bin Rahman', detail: 'Kuala Lumpur' })
    );

    render(<FamilyMembersScreen />);
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Edit Imran Rahman'));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Imran Bin Rahman');
    fireEvent.changeText(screen.getByLabelText('Detail'), 'Kuala Lumpur');
    fireEvent.press(screen.getByText('Save changes'));

    expect(await screen.findByText('Imran Bin Rahman')).toBeTruthy();
    expect(screen.getByText('Spouse · Kuala Lumpur')).toBeTruthy();
    expect(mockedApi.updateFamilyMember).toHaveBeenCalledWith('m1', {
      name: 'Imran Bin Rahman',
      relation: 'SPOUSE',
      detail: 'Kuala Lumpur'
    });
  });

  it('deletes an existing member from the list', async () => {
    mockedApi.listFamilyMembers.mockResolvedValue([makeMember()]);
    mockedApi.deleteFamilyMember.mockResolvedValue(undefined);

    render(<FamilyMembersScreen />);
    expect(await screen.findByText('Imran Rahman')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Delete Imran Rahman'));

    expect(await screen.findByText(/No one added yet/)).toBeTruthy();
    expect(screen.queryByText('Imran Rahman')).toBeNull();
    expect(mockedApi.deleteFamilyMember).toHaveBeenCalledWith('m1');
  });
});

describe('FamilyMemberForm', () => {
  it('blocks submission and shows an error when the name is empty', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<FamilyMemberForm onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Add family member'));

    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('surfaces a submit failure from onSubmit', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<FamilyMemberForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText('Name'), 'Ada Lovelace');
    fireEvent.press(screen.getByText('Add family member'));

    expect(await screen.findByText('Save failed')).toBeTruthy();
  });

  it('prefills existing member values in edit mode', () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onCancel = jest.fn();

    render(
      <FamilyMemberForm
        initialValue={makeMember({ detail: 'Kuala Lumpur' })}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByDisplayValue('Imran Rahman')).toBeTruthy();
    expect(screen.getByDisplayValue('Kuala Lumpur')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel edit'));
    expect(onCancel).toHaveBeenCalled();
  });
});
