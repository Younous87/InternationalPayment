import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeTransactionDetailView from './EmployeeTransactionDetailView';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockGetItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    removeItem: jest.fn(),
  },
});

// Mock alert & confirm
global.alert = jest.fn();
global.confirm = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ transactionId: '123' }),
  useNavigate: () => mockNavigate,
}));

const basePayment = ({ overrides = {} } = {}) => ({
  transactionId: '123',
  userId: { fullname: 'John Doe' },
  beneficiaryName: 'Jane Doe',
  amount: 100,
  currency: 'USD',
  createdAt: new Date().toISOString(),
  status: 'pending',
  beneficiaryBankName: 'Bank',
  swiftCode: 'SWFTAA00',
  beneficiaryAccountNumber: '123456',
  ...overrides,
});

const setEmployeeContext = (overrides = {}) => {
  mockGetItem.mockImplementation((key) => {
    if (key === 'employeeToken') {
      return overrides.token ?? 'test-token';
    }
    if (key === 'employee') {
      return overrides.employee ?? JSON.stringify({ accountType: 'employee' });
    }
    return null;
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockReset();
  mockGetItem.mockReset();
  global.confirm.mockReset();
  setEmployeeContext();
});

const renderView = () => {
  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );
};

test('renders employee transaction detail', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ payment: basePayment() }),
  });

  renderView();

  await waitFor(() => {
    expect(screen.getByText(/transaction id:/i)).toBeInTheDocument();
  });

  expect(screen.getByText('123')).toBeInTheDocument();
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('USD 100.00')).toBeInTheDocument();
  expect(screen.getByText(/pending/i)).toBeInTheDocument();
});

test('shows loading state initially', () => {
  fetch.mockImplementation(() => new Promise(() => {}));

  renderView();

  expect(screen.getByText('Loading transaction details...')).toBeInTheDocument();
});

test('redirects to login when token missing', async () => {
  setEmployeeContext({ token: null });

  renderView();

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/employee/login', { replace: true });
  });
});

test('handles transaction not found', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Transaction not found' }),
  });

  renderView();

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Transaction not found');
  });

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles network error', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'));

  renderView();

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Something went wrong. Try again.');
  });

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles send to SWIFT success and refreshes details', async () => {
  global.confirm.mockReturnValue(true);

  fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ payment: basePayment() }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Success' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ payment: basePayment({ overrides: { status: 'processing' } }) }),
    });

  renderView();

  await waitFor(() => {
    expect(screen.getByText('Send to SWIFT')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Send to SWIFT'));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/payments/employee/123/approve',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'send_to_swift' }),
      })
    );
  });

  expect(global.alert).toHaveBeenCalledWith('Transaction sent to SWIFT successfully!');
  expect(mockNavigate).not.toHaveBeenCalledWith('/employee/transactions');

  await waitFor(() => {
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
});

test('handles send to SWIFT cancellation', async () => {
  global.confirm.mockReturnValue(false);

  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ payment: basePayment() }),
  });

  renderView();

  await waitFor(() => {
    expect(screen.getByText('Send to SWIFT')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Send to SWIFT'));

  expect(fetch).toHaveBeenCalledTimes(1);
});

test('handles reject transaction success and refreshes details', async () => {
  global.confirm.mockReturnValue(true);

  fetch
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ payment: basePayment() }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Success' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ payment: basePayment({ overrides: { status: 'cancelled' } }) }),
    });

  renderView();

  await waitFor(() => {
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Reject'));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/payments/employee/123/reject',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  expect(global.alert).toHaveBeenCalledWith('Transaction rejected successfully!');
  expect(mockNavigate).not.toHaveBeenCalledWith('/employee/transactions');

  await waitFor(() => {
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });
});

test('handles back button click', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ payment: basePayment() }),
  });

  renderView();

  await waitFor(() => {
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByLabelText('Go back'));

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles missing user data gracefully', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ payment: basePayment({ overrides: { userId: null } }) }),
  });

  renderView();

  await waitFor(() => {
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});