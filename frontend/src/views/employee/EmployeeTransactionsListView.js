import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { PrimaryButton } from '../../components/shared/Button';

export default function EmployeeTransactionsListView() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingTransactions();
    }, []);

    const fetchPendingTransactions = async () => {
        try {
            const token = localStorage.getItem("employeeToken");
            const response = await fetch("https://localhost:4000/api/payments/pending", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (response.ok) {
                setTransactions(data.payments || []);
            } else {
                alert(data.message || "Failed to fetch transactions");
            }
        } catch (error) {
            alert("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (transactionId) => {
        navigate(`/employee/transactions/${transactionId}`);
    };

    const handleBack = () => {
        navigate('/employee/login');
    };

    return (
        <div className="App">
            <Card className="wide">
                <div className="card-header">
                    <button className="back-arrow" onClick={handleBack} aria-label="Go back">
                        ←
                    </button>
                    <div className="card-icon">
                        🏦
                    </div>
                    <h1 className="card-title">Verify Transactions</h1>
                </div>

                {loading ? (
                    <div className="loading-text">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending transactions to verify.</p>
                    </div>
                ) : (
                    <div className="transactions-list">
                        {transactions.map((transaction) => (
                            <div key={transaction._id || transaction.transactionId} className="transaction-item">
                                <div className="transaction-item-content">
                                    <div className="transaction-item-row">
                                        <span className="transaction-label">Transaction ID:</span>
                                        <span className="transaction-value">{transaction.transactionId}</span>
                                    </div>
                                    <div className="transaction-item-row">
                                        <span className="transaction-label">Amount:</span>
                                        <span className="transaction-value">
                                            {transaction.currency} {transaction.amount?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="transaction-item-row">
                                        <span className="transaction-label">Status:</span>
                                        <span className="transaction-status transaction-status-pending">
                                            {transaction.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <PrimaryButton 
                                    onClick={() => handleViewDetails(transaction.transactionId)}
                                    style={{ marginTop: '12px' }}
                                >
                                    View Details
                                </PrimaryButton>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

