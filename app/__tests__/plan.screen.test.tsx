import { fireEvent, render, screen } from '@testing-library/react-native';
import PlanRoute from '../src/app/(tabs)/plan';
import PlanStepperScreen from '../src/plan/PlanStepperScreen';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn()
  }
}));

describe('PlanStepperScreen', () => {
  it('renders the six planning steps', () => {
    render(<PlanStepperScreen onOpenStep={jest.fn()} />);

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
    render(<PlanStepperScreen onOpenStep={onOpenStep} />);

    fireEvent.press(screen.getByLabelText('Open step 3: Asset references'));

    expect(onOpenStep).toHaveBeenCalledWith('/asset-references');
  });

  it('starts with the first step from the primary action', () => {
    const onOpenStep = jest.fn();
    render(<PlanStepperScreen onOpenStep={onOpenStep} />);

    fireEvent.press(screen.getByText('Start with family'));

    expect(onOpenStep).toHaveBeenCalledWith('/family-members');
  });

  it('is exposed through the plan tab route', () => {
    render(<PlanRoute />);

    expect(screen.getByText('Six-step flow')).toBeTruthy();
    expect(screen.getByText('Setup inputs')).toBeTruthy();
    expect(screen.getByText('Review outputs')).toBeTruthy();
  });
});
