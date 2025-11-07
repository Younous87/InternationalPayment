import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { PrimaryButton } from '../../components/shared/Button';
import { validateAgainstWhitelist } from '../../utils/inputValidation';

export default function EmployeeTransactionDetailView() {
    const { transactionId } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    const fetchTransactionDetails = useCallback(async () => {
        try {
            // Validate transactionId using whitelist
            const txnCheck = validateAgainstWhitelist(transactionId, 'alphanumeric');
            if (!txnCheck.isValid) {
                alert('Invalid transaction identifier');
                navigate('/employee/transactions');
                return;
            }
            const token = localStorage.getItem("employeeToken");
            const response = await fetch(`https://localhost:4000/api/payments/employee/${transactionId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (response.ok) {
                setTransaction(data.payment);
            } else {
                alert(data.message || "Transaction not found");
                navigate('/employee/transactions');
            }
        } catch (error) {
            alert("Something went wrong. Try again.");
            navigate('/employee/transactions');
        } finally {
            setLoading(false);
        }
    }, [transactionId, navigate]);

    useEffect(() => {
        fetchTransactionDetails();
    }, [fetchTransactionDetails]);

    const handleSendToSwift = async () => {
        if (!window.confirm('Are you sure you want to send this transaction to SWIFT?')) {
            return;
        }

        setProcessing(true);
        try {
            const txnCheck = validateAgainstWhitelist(transactionId, 'alphanumeric');
            if (!txnCheck.isValid) {
                alert('Invalid transaction identifier');
                setProcessing(false);
                return;
            }
            const token = localStorage.getItem("employeeToken");
            const response = await fetch(`https://localhost:4000/api/payments/employee/${transactionId}/approve`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ action: 'send_to_swift' }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Transaction sent to SWIFT successfully!");
                navigate('/employee/transactions');
            } else {
                alert(data.message || "Failed to send transaction to SWIFT");
            }
        } catch (error) {
            alert("Something went wrong. Try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('Are you sure you want to reject this transaction?')) {
            return;
        }

        setProcessing(true);
        try {
            const txnCheck = validateAgainstWhitelist(transactionId, 'alphanumeric');
            if (!txnCheck.isValid) {
                alert('Invalid transaction identifier');
                setProcessing(false);
                return;
            }
            const token = localStorage.getItem("employeeToken");
            const response = await fetch(`https://localhost:4000/api/payments/employee/${transactionId}/reject`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert("Transaction rejected successfully!");
                navigate('/employee/transactions');
            } else {
                alert(data.message || "Failed to reject transaction");
            }
        } catch (error) {
            alert("Something went wrong. Try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleBack = () => {
        navigate('/employee/transactions');
    };

    if (loading) {
        return (
            <div className="App">
                <Card>
                    <div className="loading-text">Loading transaction details...</div>
                </Card>
            </div>
        );
    }

    if (!transaction) {
        return null;
    }

    // Get sender name from populated user or use a default
    const senderName = transaction.userId?.fullname || transaction.userId?.username || 'N/A';

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

                <div className="transaction-details">
                    <div className="transaction-detail">
                        <span className="transaction-label">Transaction ID:</span>
                        <span className="transaction-value">{transaction.transactionId}</span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Sender Name:</span>
                        <span className="transaction-value">{senderName}</span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Receiver Name:</span>
                        <span className="transaction-value">{transaction.beneficiaryName}</span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Amount:</span>
                        <span className="transaction-value">
                            {transaction.currency} {transaction.amount?.toFixed(2)}
                        </span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Date:</span>
                        <span className="transaction-value">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Status:</span>
                        <span className="transaction-status transaction-status-pending">
                            {transaction.status || 'Pending'}
                        </span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Beneficiary Bank:</span>
                        <span className="transaction-value">{transaction.beneficiaryBankName}</span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">SWIFT Code:</span>
                        <span className="transaction-value">{transaction.swiftCode}</span>
                    </div>
                    <div className="transaction-detail">
                        <span className="transaction-label">Beneficiary Account:</span>
                        <span className="transaction-value">{transaction.beneficiaryAccountNumber}</span>
                    </div>
                </div>

                <div className="transaction-actions">
                    <PrimaryButton 
                        onClick={handleSendToSwift}
                        disabled={processing}
                        style={{ marginBottom: '12px' }}
                    >
                        {processing ? 'Processing...' : 'Send to SWIFT'}
                    </PrimaryButton>
                    <button
                        type="button"
                        className="btn btn-reject"
                        onClick={handleReject}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : 'Reject'}
                    </button>
                </div>
            </Card>
        </div>
    );
}

