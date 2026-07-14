import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanRoute from '../src/app/(tabs)/plan';
import PlanStepperScreen from '../src/plan/PlanStepperScreen';

jest.mock('../src/plan/usePlanProgress', () => ({
  usePlanProgress: () => ({
    progress: {
      completedSetupSteps: 0,
      hasFamilyMembers: false,
      hasTrustedContacts: false,
      hasAssetReferences: false,
      hasCheckInSetup: false
    },
    loading: false,
    error: null
  })
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn()
  }
}));

describe('PlanStepperScreen', () => {
  const emptyProgress = {
    completedSetupSteps: 0,
    hasFamilyMembers: false,
    hasTrustedContacts: false,
    hasAssetReferences: false,
    hasCheckInSetup: false
  };

  it('renders the six planning steps', () => {
    render(<PlanStepperScreen onOpenStep={jest.fn()} setupProgress={emptyProgress} />);

    expect(screen.getByText('Plan')).toBeTruthy();
    expect(screen.getByText('Family members')).toBeTruthy();
    expect(screen.getByText('Trusted contacts')).toBeTruthy();
    expect(screen.getByText('Asset references')).toBeTruthy();
    expect(screen.getByText('Check-in and cloud')).toBeTruthy();
    expect(screen.getByText('Readiness review')).toBeTruthy();
    expect(screen.getByText('Emergency handover')).toBeTruthy();
  });

  it('opens the selected step route', () => {
    const onOpenStep = jest.fn();
    render(<PlanStepperScreen onOpenStep={onOpenStep} setupProgress={emptyProgress} />);

    fireEvent.press(screen.getByLabelText('Open step 3: Asset references'));

    expect(onOpenStep).toHaveBeenCalledWith('/asset-references');
  });

  it('starts with the first step from the primary action', () => {
    const onOpenStep = jest.fn();
    render(<PlanStepperScreen onOpenStep={onOpenStep} setupProgress={emptyProgress} />);

    fireEvent.press(screen.getByText('Start with family'));

    expect(onOpenStep).toHaveBeenCalledWith('/family-members');
  });

  it('shows zero completed setup inputs before user data exists', () => {
    render(<PlanStepperScreen onOpenStep={jest.fn()} setupProgress={emptyProgress} />);

    expect(screen.getByText('0 of 6 steps ready')).toBeTruthy();
    expect(screen.getByLabelText('0 of 6 setup steps ready')).toBeTruthy();
    expect(screen.getByText('Setup inputs')).toBeTruthy();
  });

  it('is exposed through the plan tab route', () => {
    render(<PlanRoute />);

    expect(screen.getByText('Six-step flow')).toBeTruthy();
    expect(screen.getByText('Setup inputs')).toBeTruthy();
    expect(screen.getByText('Review outputs')).toBeTruthy();
  });
});
