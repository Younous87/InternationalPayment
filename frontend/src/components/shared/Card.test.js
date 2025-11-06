import { render, screen } from '@testing-library/react';
import Card from './Card';

test('renders card', () => {
  render(<Card>Test content</Card>);
  const cardElement = screen.getByText(/Test content/i);
  expect(cardElement).toBeInTheDocument();
});