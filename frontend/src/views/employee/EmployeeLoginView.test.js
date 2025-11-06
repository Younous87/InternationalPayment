import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeLoginView from './EmployeeLoginView';

// Mock fetch
global.fetch = jest.fn();

test('renders employee login form', () => {
  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );
  const loginButton = screen.getByRole('button', { name: /login/i });
  expect(loginButton).toBeInTheDocument();
});

test('renders form inputs', () => {
  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );
  const usernameInput = screen.getByPlaceholderText(/username/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  expect(usernameInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
});

test('handles input changes', () => {
  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );
  const usernameInput = screen.getByPlaceholderText(/username/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass' } });

  expect(usernameInput.value).toBe('testuser');
  expect(passwordInput.value).toBe('testpass');
});

test('handles successful login', async () => {
  // Mock successful login
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ token: 'test-token', employee: { id: 1 } }),
  });

  // Mock localStorage
  const mockSetItem = jest.fn();
  Object.defineProperty(window, 'localStorage', {
    value: { setItem: mockSetItem },
    writable: true,
  });

  // Mock alert
  global.alert = jest.fn();

  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );

  const usernameInput = screen.getByPlaceholderText(/username/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /login/i });

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/employee/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'testpass' }),
      })
    );
  });

  expect(mockSetItem).toHaveBeenCalledWith('employeeToken', 'test-token');
  expect(global.alert).toHaveBeenCalledWith('Login Successful!');
});

test('handles login failure', async () => {
  // Mock failed login
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: 'Invalid credentials' }),
  });

  // Mock alert
  global.alert = jest.fn();

  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );

  const usernameInput = screen.getByPlaceholderText(/username/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /login/i });

  fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
  fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(global.alert).toHaveBeenCalledWith('Invalid credentials');
});

test('handles network error', async () => {
  // Mock network error
  fetch.mockRejectedValueOnce(new Error('Network error'));

  // Mock alert
  global.alert = jest.fn();

  render(
    <MemoryRouter>
      <EmployeeLoginView />
    </MemoryRouter>
  );

  const usernameInput = screen.getByPlaceholderText(/username/i);
  const passwordInput = screen.getByPlaceholderText(/password/i);
  const loginButton = screen.getByRole('button', { name: /login/i });

  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'testpass' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(global.alert).toHaveBeenCalledWith('Something went wrong. Try again.');
});