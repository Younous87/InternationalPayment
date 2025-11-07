import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecoverPasswordView from './RecoverPasswordView';

global.fetch = jest.fn();
global.alert = jest.fn();

const renderView = () =>
  render(
    <MemoryRouter>
      <RecoverPasswordView />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockReset();
});

test('validates email before sending recovery code', async () => {
  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'invalid-email' },
  });

  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
});

test('handles successful recovery code request with sanitised email', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({
      message: 'Code sent',
      developmentOnly: { recoveryCode: '654321' },
    }),
  });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: ' USER@Example.COM ' },
  });

  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/recover-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );
  });

  expect(screen.getByText(/verify code/i)).toBeInTheDocument();
  expect(screen.getByText(/dev code: 654321/i)).toBeInTheDocument();
});

test('verifies recovery code successfully and advances to reset step', async () => {
  fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code sent' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code verified' }),
    });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  await waitFor(() => {
    expect(screen.getByText(/verify code/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText(/recovery code/i), {
    target: { value: '123456' },
  });

  fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/verify-recovery-code',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', recoveryCode: '123456' }),
      })
    );
  });

  expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  expect(screen.getByText(/recovery code verified/i)).toBeInTheDocument();
});

test('shows error when passwords do not match', async () => {
  fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code sent' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code verified' }),
    });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  await waitFor(() => {
    expect(screen.getByText(/verify code/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText(/recovery code/i), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

  await waitFor(() => {
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText(/new password/i), {
    target: { value: 'Password1!' },
  });
  fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
    target: { value: 'Different1!' },
  });

  fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i);
  expect(fetch).toHaveBeenCalledTimes(2); // only send + verify
});

test('resets password successfully', async () => {
  fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code sent' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Code verified' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Password reset success' }),
    });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send code/i }));

  await waitFor(() => {
    expect(screen.getByText(/verify code/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText(/recovery code/i), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

  await waitFor(() => {
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByPlaceholderText(/new password/i), {
    target: { value: 'Password1!' },
  });
  fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
    target: { value: 'Password1!' },
  });

  fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          recoveryCode: '123456',
          newPassword: 'Password1!'
        }),
      })
    );
  });

  expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  expect(screen.getByText(/password reset success/i)).toBeInTheDocument();
});

