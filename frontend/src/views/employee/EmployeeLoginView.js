import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    validateAgainstWhitelist,
    checkForInjectionPatterns,
    sanitizeInput
} from '../../utils/inputValidation';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';

export default function EmployeeLoginView() {
    const [formData, setFormData] = useState({
        username: '',
        accountNumber: '',
        password: ''
    });
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

        const { username, accountNumber, password } = formData;

        // Client-side validation using whitelist and regex patterns
        const usernameSanitized = sanitizeInput(username);
        const usernameCheck = validateAgainstWhitelist(usernameSanitized, 'username');
        const accountSanitized = sanitizeInput(accountNumber);
        const accountCheck = validateAgainstWhitelist(accountSanitized, 'accountNumber');
        const passwordThreats = checkForInjectionPatterns(password);

        if (!usernameCheck.isValid) {
            alert('Invalid username format');
            return;
        }
        if (!accountCheck.isValid) {
            alert('Invalid employee number format');
            return;
        }
        if (!password || password.length < 8 || !passwordThreats.isSafe) {
            alert('Invalid password');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('https://localhost:4000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameSanitized,
                    accountNumber: accountSanitized,
                    password
                })
            });

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (!response.ok) {
                alert(data.message || 'Login failed');
                return;
            }

            if (data?.user?.accountType !== 'employee') {
                alert('This portal is restricted to employees.');
                return;
            }

            localStorage.setItem('employeeToken', data.token);
            localStorage.setItem('employee', JSON.stringify(data.user));

            alert('Login Successful!');
            navigate('/employee/transactions', { replace: true });
        } catch (error) {
            alert(error?.message || 'Something went wrong. Try again.');
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
                        placeholder="Employee Number"
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

                    <div className="link-text">
                        <Link to="/">← Back to Home</Link>
                    </div>

                    <div className="link-text">
                        <Link to="/recover-password">Forgot Password?</Link>
                    </div>

                    <div className="link-text">
                        <Link to="/recoverUsername">Forgot Username?</Link>
                    </div>

                </form>
            </Card>
        </div>
    );
}

