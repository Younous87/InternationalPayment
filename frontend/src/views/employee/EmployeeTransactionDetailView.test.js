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
  },
});

// Mock alert
global.alert = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ transactionId: '123' }),
  useNavigate: () => mockNavigate,
}));

test('renders employee transaction detail', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: { fullname: 'John Doe' },
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText(/transaction id:/i)).toBeInTheDocument();
  });

  expect(screen.getByText('123')).toBeInTheDocument();
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('USD 100.00')).toBeInTheDocument();
  expect(screen.getByText('Pending')).toBeInTheDocument();
});

test('shows loading state initially', () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock pending fetch
  fetch.mockImplementation(() => new Promise(() => {}));

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  expect(screen.getByText('Loading transaction details...')).toBeInTheDocument();
});

test('handles transaction not found', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock failed fetch
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: 'Transaction not found' }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Transaction not found');
  });

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles network error', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock network error
  fetch.mockRejectedValueOnce(new Error('Network error'));

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Something went wrong. Try again.');
  });

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles send to SWIFT success', async () => {
  mockGetItem.mockReturnValue('test-token');
  global.confirm.mockReturnValue(true);

  // Mock successful transaction fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: { fullname: 'John Doe' },
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  // Mock successful SWIFT send
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ message: 'Success' }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Send to SWIFT')).toBeInTheDocument();
  });

  const sendButton = screen.getByText('Send to SWIFT');
  fireEvent.click(sendButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/payments/employee/123/approve',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ action: 'send_to_swift' }),
      })
    );
  });

  expect(global.alert).toHaveBeenCalledWith('Transaction sent to SWIFT successfully!');
  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles send to SWIFT cancellation', async () => {
  mockGetItem.mockReturnValue('test-token');
  global.confirm.mockReturnValue(false); // User cancels

  // Mock successful transaction fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: { fullname: 'John Doe' },
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Send to SWIFT')).toBeInTheDocument();
  });

  const sendButton = screen.getByText('Send to SWIFT');
  fireEvent.click(sendButton);

  // Should not make API call when cancelled
  expect(fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
});

test('handles reject transaction success', async () => {
  mockGetItem.mockReturnValue('test-token');
  global.confirm.mockReturnValue(true);

  // Mock successful transaction fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: { fullname: 'John Doe' },
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  // Mock successful reject
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ message: 'Success' }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  const rejectButton = screen.getByText('Reject');
  fireEvent.click(rejectButton);

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:4000/api/payments/employee/123/reject',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }),
      })
    );
  });

  expect(global.alert).toHaveBeenCalledWith('Transaction rejected successfully!');
  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles back button click', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: { fullname: 'John Doe' },
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  const backButton = screen.getByLabelText('Go back');
  fireEvent.click(backButton);

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions');
});

test('handles missing user data gracefully', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock successful fetch with missing user data
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      payment: {
        transactionId: '123',
        userId: null, // Missing user data
        beneficiaryName: 'Jane Doe',
        amount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        beneficiaryBankName: 'Bank',
        swiftCode: 'SWFT',
        beneficiaryAccountNumber: '123456'
      }
    }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionDetailView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});