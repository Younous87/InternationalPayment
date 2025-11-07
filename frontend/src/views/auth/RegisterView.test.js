import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterView from './RegisterView';

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
});

const renderView = () =>
  render(
    <MemoryRouter>
      <RegisterView />
    </MemoryRouter>
  );

const fillForm = (overrides = {}) => {
  const defaults = {
    username: 'valid_user',
    fullname: 'Valid User',
    idNumber: '123456789',
    accountNumber: '12345678',
    email: 'user@example.com',
    password: 'Password1!'
  };
  const values = { ...defaults, ...overrides };

  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: values.username },
  });
  fireEvent.change(screen.getByPlaceholderText(/full name/i), {
    target: { value: values.fullname },
  });
  fireEvent.change(screen.getByPlaceholderText(/id number/i), {
    target: { value: values.idNumber },
  });
  fireEvent.change(screen.getByPlaceholderText(/account number/i), {
    target: { value: values.accountNumber },
  });
  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
    target: { value: values.password },
  });
};

test('shows validation errors when inputs are invalid', () => {
  renderView();

  fillForm({ username: 'ab', email: 'bad-email', password: 'short' });

  fireEvent.click(screen.getByRole('button', { name: /register/i }));

  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(/please resolve the issues/i);
  expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
});

test('renders backend validation messages', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({
      message: 'Email already exists',
      errors: ['Username already taken'],
    }),
  });

  renderView();
  fillForm();

  fireEvent.click(screen.getByRole('button', { name: /register/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });

  expect(screen.getByRole('alert')).toHaveTextContent(/could not register/i);
  expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
  expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('submits sanitised payload and navigates on success', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Created' }),
  });

  renderView();

  fillForm({
    username: ' Valid_User ',
    fullname: ' Valid User ',
    idNumber: ' 123456789 ',
    accountNumber: ' 12345678 ',
    email: ' USER@example.com ',
    password: 'Password1!'
  });

  fireEvent.click(screen.getByRole('button', { name: /register/i }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Valid_User',
          fullname: 'Valid User',
          idNumber: '123456789',
          accountNumber: '12345678',
          email: 'user@example.com',
          password: 'Password1!'
        }),
      })
    );
  });

  expect(mockNavigate).toHaveBeenCalledWith('/account-registered', { replace: true });
});

