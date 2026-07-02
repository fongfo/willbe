import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Badge, Button, Card, Screen } from '../src/components';

describe('Button', () => {
  it('renders its label and fires onPress', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByText('Continue'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Save" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports the secondary and danger variants', () => {
    const { rerender } = render(
      <Button label="Cancel" variant="secondary" onPress={jest.fn()} />
    );
    expect(screen.getByText('Cancel')).toBeTruthy();

    rerender(<Button label="Delete" variant="danger" onPress={jest.fn()} />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <Text>Inside card</Text>
      </Card>
    );
    expect(screen.getByText('Inside card')).toBeTruthy();
  });
});

describe('Badge', () => {
  it('renders its label and defaults to the success tone', () => {
    render(<Badge label="Verified" />);
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('renders the warn tone', () => {
    render(<Badge label="Pending" tone="warn" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });
});

describe('Screen', () => {
  it('renders its children within the safe area', () => {
    render(
      <Screen>
        <Text>Screen content</Text>
      </Screen>
    );
    expect(screen.getByText('Screen content')).toBeTruthy();
  });

  it('renders with padding disabled', () => {
    render(
      <Screen padded={false}>
        <Text>Full bleed</Text>
      </Screen>
    );
    expect(screen.getByText('Full bleed')).toBeTruthy();
  });
});
