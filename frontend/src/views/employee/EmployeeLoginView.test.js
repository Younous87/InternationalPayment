import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeLoginView from './EmployeeLoginView';

// Mock fetch
global.fetch = jest.fn();

// Mock navigate and alert
const mockNavigate = jest.fn();
global.alert = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const setup = () => {
  const mockSetItem = jest.fn();
  Object.defineProperty(window, 'localStorage', {
    value: { setItem: mockSetItem },
    writable: true,
  });

  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );

  const usernameInput = screen.getByPlaceholderText(/username/i);
  const accountInput = screen.getByPlaceholderText(/employee number/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /login/i });

  return {
    mockSetItem,
    usernameInput,
    accountInput,
    passwordInput,
    loginButton,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders employee login form', () => {
  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );
  const loginButton = screen.getByRole('button', { name: /login/i });
  expect(loginButton).toBeInTheDocument();
});

test('handles successful login for employee', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: {
      get: () => 'application/json',
    },
    json: async () => ({
      token: 'test-token',
      user: { id: '1', accountType: 'employee' },
    }),
  });

  const { usernameInput, accountInput, passwordInput, loginButton, mockSetItem } = setup();

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(accountInput, { target: { value: '123456' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass1' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          accountNumber: '123456',
          password: 'testpass1',
        }),
      })
    );
  });

  expect(mockSetItem).toHaveBeenCalledWith('employeeToken', 'test-token');
  expect(global.alert).toHaveBeenCalledWith('Login Successful!');
  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions', { replace: true });
});

test('blocks non-employee account type', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: {
      get: () => 'application/json',
    },
    json: async () => ({
      token: 'test-token',
      user: { id: '1', accountType: 'client' },
    }),
  });

  const { usernameInput, accountInput, passwordInput, loginButton, mockSetItem } = setup();

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(accountInput, { target: { value: '123456' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass1' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(global.alert).toHaveBeenCalledWith('This portal is restricted to employees.');
  expect(mockSetItem).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('handles login failure from API', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    headers: {
      get: () => 'application/json',
    },
    json: async () => ({ message: 'Invalid credentials' }),
  });

  const { usernameInput, accountInput, passwordInput, loginButton } = setup();

  fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
  fireEvent.change(accountInput, { target: { value: '123456' } });
  fireEvent.change(passwordInput, { target: { value: 'wrongpass1' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(global.alert).toHaveBeenCalledWith('Invalid credentials');
});

test('handles network error', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));

  const { usernameInput, accountInput, passwordInput, loginButton } = setup();

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(accountInput, { target: { value: '123456' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass1' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(global.alert).toHaveBeenCalledWith('Something went wrong. Try again.');
});