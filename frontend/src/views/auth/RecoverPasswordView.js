import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';
import {
    sanitizeInput,
    validateAgainstWhitelist,
    checkForInjectionPatterns
} from '../../utils/inputValidation';

export default function RecoverPasswordView() {
    const [formData, setFormData] = useState({
        email: '',
        recoveryCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset password, 4: success
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
            const response = await fetch('https://localhost:4000/api/auth/recover-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sanitizedEmail })
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (response.ok) {
                setStep(2);
                let message = data.message || 'If an account exists, a recovery code has been sent.';
                if (data?.developmentOnly?.recoveryCode) {
                    message = `${message} (Dev code: ${data.developmentOnly.recoveryCode})`;
                }
                setFeedback(message);
                setFormData(prev => ({ ...prev, email: sanitizedEmail }));
            } else {
                const message = data.message || 'Failed to send recovery code';
                setError(message);
                alert(message);
            }
        } catch (err) {
            const message = err?.message || 'Something went wrong. Try again.';
            setError(message);
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (event) => {
        event.preventDefault();
        if (loading) return;

        const sanitizedEmail = sanitizeInput(formData.email).toLowerCase();
        const sanitizedCode = sanitizeInput(formData.recoveryCode);

        const emailCheck = validateAgainstWhitelist(sanitizedEmail, 'email');
        if (!emailCheck.isValid) {
            setError('Invalid email address.');
            return;
        }

        if (!/^[0-9]{6}$/.test(sanitizedCode)) {
            setError('Recovery code must be a 6-digit number.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://localhost:4000/api/auth/verify-recovery-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sanitizedEmail, recoveryCode: sanitizedCode })
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (response.ok) {
                setStep(3);
                setFeedback('Recovery code verified. You can now reset your password.');
                setFormData(prev => ({ ...prev, email: sanitizedEmail, recoveryCode: sanitizedCode }));
            } else {
                const message = data.message || 'Invalid recovery code';
                setError(message);
                alert(message);
            }
        } catch (err) {
            const message = err?.message || 'Something went wrong. Try again.';
            setError(message);
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        if (loading) return;

        const sanitizedEmail = sanitizeInput(formData.email).toLowerCase();
        const sanitizedCode = sanitizeInput(formData.recoveryCode);
        const sanitizedPassword = sanitizeInput(formData.newPassword);
        const sanitizedConfirm = sanitizeInput(formData.confirmPassword);

        const emailCheck = validateAgainstWhitelist(sanitizedEmail, 'email');
        if (!emailCheck.isValid) {
            setError('Invalid email address.');
            return;
        }

        if (!/^[0-9]{6}$/.test(sanitizedCode)) {
            setError('Recovery code must be a 6-digit number.');
            return;
        }

        if (sanitizedPassword !== sanitizedConfirm) {
            setError('Passwords do not match.');
            return;
        }

        if (sanitizedPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        const passwordThreats = checkForInjectionPatterns(sanitizedPassword);
        if (!passwordThreats.isSafe) {
            setError('Password contains prohibited characters.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://localhost:4000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: sanitizedEmail,
                    recoveryCode: sanitizedCode,
                    newPassword: sanitizedPassword
                })
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (response.ok) {
                setStep(4);
                setFeedback(data.message || 'Password updated successfully.');
                setFormData({ email: sanitizedEmail, recoveryCode: sanitizedCode, newPassword: '', confirmPassword: '' });
            } else {
                const message = data.message || 'Failed to reset password';
                setError(message);
                alert(message);
            }
        } catch (err) {
            const message = err?.message || 'Something went wrong. Try again.';
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
                        <h1 className="card-title">Recover Password</h1>
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
                        <h1 className="card-title">Recover Password</h1>
                        <p className="card-subtitle">
                            A 6-digit recovery code has been sent to your email address. Please enter it below.
                        </p>
                        {feedback && <p className="card-subtitle">{feedback}</p>}
                        {error && <p className="error-text" role="alert">{error}</p>}
                    </div>

                    <form onSubmit={handleVerifyCode}>
                        <FormGroup>
                            <FormInput
                                type="text"
                                value={formData.recoveryCode}
                                name="recoveryCode"
                                placeholder="Recovery Code"
                                onChange={handleChange}
                                required
                                maxLength="6"
                            />
                        </FormGroup>

                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? 'Verifying…' : 'Verify Code'}
                        </PrimaryButton>
                    </form>
                </Card>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="App">
                <Card>
                    <div className="card-header">
                        <div className="card-icon">
                            🔒
                        </div>
                        <h1 className="card-title">Reset Password</h1>
                        {feedback && <p className="card-subtitle">{feedback}</p>}
                        {error && <p className="error-text" role="alert">{error}</p>}
                    </div>

                    <form onSubmit={handleResetPassword}>
                        <FormGroup>
                            <FormInput
                                type="password"
                                value={formData.newPassword}
                                name="newPassword"
                                placeholder="New Password"
                                onChange={handleChange}
                                required
                                minLength="8"
                            />
                        </FormGroup>

                        <FormGroup>
                            <FormInput
                                type="password"
                                value={formData.confirmPassword}
                                name="confirmPassword"
                                placeholder="Confirm New Password"
                                onChange={handleChange}
                                required
                                minLength="8"
                            />
                        </FormGroup>

                        <PrimaryButton type="submit" disabled={loading}>
                            {loading ? 'Updating…' : 'Reset Password'}
                        </PrimaryButton>
                    </form>
                </Card>
            </div>
        );
    }

    if (step === 4) {
        return (
            <div className="App">
                <Card>
                    <div className="card-header">
                        <div className="card-icon success-icon">
                            ✓
                        </div>
                        <h1 className="card-title">Reset Password</h1>
                        <p className="card-subtitle">
                            Your password has been reset successfully. Please login with your new password.
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


