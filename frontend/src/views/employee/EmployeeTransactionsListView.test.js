import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmployeeTransactionsListView from './EmployeeTransactionsListView';

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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

test('renders employee transactions list', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ payments: [] }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.getByText(/no pending transactions/i)).toBeInTheDocument();
  });
});

test('shows loading state initially', () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock pending fetch
  fetch.mockImplementation(() => new Promise(() => {}));

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
});

test('renders transactions list with data', async () => {
  mockGetItem.mockReturnValue('test-token');

  const mockTransactions = [
    {
      _id: '1',
      transactionId: 'TXN001',
      amount: 100.50,
      currency: 'USD',
      status: 'Pending'
    },
    {
      _id: '2',
      transactionId: 'TXN002',
      amount: 250.75,
      currency: 'EUR',
      status: 'Pending'
    }
  ];

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ payments: mockTransactions }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('TXN001')).toBeInTheDocument();
  });

  expect(screen.getByText('USD 100.50')).toBeInTheDocument();
  expect(screen.getByText('TXN002')).toBeInTheDocument();
  expect(screen.getByText('EUR 250.75')).toBeInTheDocument();
  expect(screen.getAllByText('Pending')).toHaveLength(2);
  expect(screen.getAllByText('View Details')).toHaveLength(2);
});

test('handles fetch error', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock failed fetch
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: 'Failed to fetch transactions' }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Failed to fetch transactions');
  });
});

test('handles network error', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock network error
  fetch.mockRejectedValueOnce(new Error('Network error'));

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Something went wrong. Try again.');
  });
});

test('handles view details button click', async () => {
  mockGetItem.mockReturnValue('test-token');

  const mockTransactions = [
    {
      _id: '1',
      transactionId: 'TXN001',
      amount: 100.50,
      currency: 'USD',
      status: 'Pending'
    }
  ];

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ payments: mockTransactions }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  const viewDetailsButton = screen.getByText('View Details');
  fireEvent.click(viewDetailsButton);

  expect(mockNavigate).toHaveBeenCalledWith('/employee/transactions/TXN001');
});

test('handles back button click', async () => {
  mockGetItem.mockReturnValue('test-token');

  // Mock successful fetch
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ payments: [] }),
  });

  render(
    <MemoryRouter>
      <EmployeeTransactionsListView />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  const backButton = screen.getByLabelText('Go back');
  fireEvent.click(backButton);

  expect(mockNavigate).toHaveBeenCalledWith('/employee/login');
});