import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecoverUsernameView from './RecoverUsernameView';

global.fetch = jest.fn();
global.alert = jest.fn();

const renderView = () =>
  render(
    <MemoryRouter>
      <RecoverUsernameView />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockReset();
});

test('validates email input before submission', () => {
  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'bad-email' },
  });

  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
});

test('handles successful username recovery request', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({
      message: 'Username sent',
      developmentOnly: { username: 'emp-user' },
    }),
  });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: '  EMPLOYEE@example.com ' },
  });

  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/recover-username',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee@example.com' }),
      })
    );
  });

  expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  expect(screen.getByText(/dev username: emp-user/i)).toBeInTheDocument();
});

