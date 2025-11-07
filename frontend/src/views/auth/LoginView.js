import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton, SecondaryButton } from '../../components/shared/Button';
import {
    sanitizeInput,
    validateAgainstWhitelist,
    checkForInjectionPatterns
} from '../../utils/inputValidation';

export default function LoginView() {
    const [formData, setFormData] = useState({
        username: '',
        accountNumber: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) {
            return;
        }

        setError('');

        const usernameSanitized = sanitizeInput(formData.username);
        const accountSanitized = sanitizeInput(String(formData.accountNumber));
        const passwordValue = formData.password;

        const usernameCheck = validateAgainstWhitelist(usernameSanitized, 'username');
        if (!usernameCheck.isValid) {
            setError('Invalid username format. Use 3-20 letters, numbers, or underscores.');
            return;
        }

        const accountCheck = validateAgainstWhitelist(accountSanitized, 'accountNumber');
        if (!accountCheck.isValid) {
            setError('Account number must be 8-18 digits.');
            return;
        }

        if (!passwordValue || passwordValue.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        const passwordThreats = checkForInjectionPatterns(passwordValue);
        if (!passwordThreats.isSafe) {
            setError('Password contains prohibited characters.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("https://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: usernameSanitized,
                    accountNumber: accountSanitized,
                    password: passwordValue
                }),
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (!response.ok) {
                setError(data.message || "Login failed. Please check your credentials.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setError('');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            // Login error occurred
            setError(error?.message || "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="App">
            <Card>
                <div className="card-header">
                    <div className="card-icon">
                        🏦
                    </div>
                    <h1 className="card-title">Welcome</h1>
                </div>

                {error && (
                    <div className="error-text" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <FormInput
                            type="text"
                            value={formData.username}
                            name="username"
                            placeholder="Username"
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="text"
                            value={formData.accountNumber}
                            name="accountNumber"
                            placeholder="Account Number"
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <PrimaryButton type="submit" disabled={submitting}>
                        {submitting ? 'Signing In…' : 'Login'}
                    </PrimaryButton>

                    <SecondaryButton>
                        <Link to="/register" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Register
                        </Link>
                    </SecondaryButton>

                    <div className="link-text">
                        <Link to="/">← Back to Home</Link>
                    </div>

                    <div className="link-text">
                        <Link to="/recover-password">Forgot Password?</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
