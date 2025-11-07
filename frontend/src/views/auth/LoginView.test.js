import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginView from './LoginView';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockReset();
  mockNavigate.mockReset();

  const mockSetItem = jest.fn();
  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: mockSetItem,
    },
    writable: true,
  });
});

const renderView = () =>
  render(
    <MemoryRouter>
      <LoginView />
    </MemoryRouter>
  );

const fillValidForm = () => {
  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: 'valid_user' },
  });
  fireEvent.change(screen.getByPlaceholderText(/account number/i), {
    target: { value: '12345678' },
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: 'Password1!' },
  });
};

test('shows validation error for invalid username', () => {
  renderView();

  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: 'ab' },
  });
  fireEvent.change(screen.getByPlaceholderText(/account number/i), {
    target: { value: '12345678' },
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: 'Password1!' },
  });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/invalid username format/i);
});

test('surfaces API error message when login fails', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Invalid credentials' }),
  });

  renderView();
  fillValidForm();

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i);
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('sanitises payload and navigates on successful login', async () => {
  const mockSetItem = jest.spyOn(window.localStorage, 'setItem');

  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({
      token: 'token-123',
      user: { username: 'valid_user' },
    }),
  });

  renderView();

  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: ' valid_user ' },
  });
  fireEvent.change(screen.getByPlaceholderText(/account number/i), {
    target: { value: ' 12345678 ' },
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: 'Password1!' },
  });

  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'valid_user',
          accountNumber: '12345678',
          password: 'Password1!',
        }),
      })
    );
  });

  expect(mockSetItem).toHaveBeenCalledWith('token', 'token-123');
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
});

