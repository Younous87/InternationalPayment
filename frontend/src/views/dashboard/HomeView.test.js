import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeView from './HomeView';

test('renders home view', () => {
  render(
    <MemoryRouter>
      <HomeView />
    </MemoryRouter>
  );
  const welcomeElement = screen.getByText(/Welcome/i);
  expect(welcomeElement).toBeInTheDocument();
});