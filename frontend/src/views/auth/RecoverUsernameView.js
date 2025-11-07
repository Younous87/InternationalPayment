import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';
import { sanitizeInput, validateAgainstWhitelist } from '../../utils/inputValidation';

export default function RecoverUsernameView() {
    const [formData, setFormData] = useState({
        email: ''
    });
    const [step, setStep] = useState(1); // 1: email, 2: success
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSendCode = async (event) => {
        event.preventDefault();
        if (loading) return;

        const sanitizedEmail = sanitizeInput(formData.email).toLowerCase();
        const emailCheck = validateAgainstWhitelist(sanitizedEmail, 'email');
        if (!emailCheck.isValid) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');
        setFeedback('');

        try {
            const response = await fetch('https://localhost:4000/api/auth/recover-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sanitizedEmail }),
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (response.ok) {
                setStep(2);
                let message = data.message || 'If an account exists, your username has been sent to the email provided.';
                if (data?.developmentOnly?.username) {
                    message = `${message} (Dev username: ${data.developmentOnly.username})`;
                }
                setFeedback(message);
                setFormData({ email: sanitizedEmail });
            } else {
                const message = data.message || 'Failed to send username';
                setError(message);
                alert(message);
            }
        } catch (error) {
            // Error sending username recovery
            const message = error?.message || 'Something went wrong. Try again.';
            setError(message);
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <div className="App">
                <Card>
                    <div className="card-header">
                        <div className="card-icon">
                            🔄
                        </div>
                        <h1 className="card-title">Recover Username</h1>
                        {feedback && <p className="card-subtitle">{feedback}</p>}
                        {error && <p className="error-text" role="alert">{error}</p>}
                    </div>

                    <form onSubmit={handleSendCode}>
                        <FormGroup>
                            <FormInput
                                type="email"
                                value={formData.email}
                                name="email"
                                placeholder="Email"
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? 'Sending…' : 'Send Code'}
                        </PrimaryButton>
                    </form>
                </Card>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="App">
                <Card>
                    <div className="card-header">
                        <div className="card-icon success-icon">
                            ✓
                        </div>
                        <h1 className="card-title">Recover Username</h1>
                        <p className="card-subtitle">
                            Your username has been sent to your email address.
                        </p>
                        {feedback && <p className="card-subtitle">{feedback}</p>}
                        {error && <p className="error-text" role="alert">{error}</p>}
                    </div>

                    <PrimaryButton>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Back to Login
                        </Link>
                    </PrimaryButton>
                </Card>
            </div>
        );
    }

    return null;
}


