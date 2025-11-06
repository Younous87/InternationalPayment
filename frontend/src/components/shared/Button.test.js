import { render, screen } from '@testing-library/react';
import { PrimaryButton } from './Button';

test('renders primary button', () => {
  render(<PrimaryButton>Click me</PrimaryButton>);
  const buttonElement = screen.getByText(/Click me/i);
  expect(buttonElement).toBeInTheDocument();
});