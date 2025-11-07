import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';
import {
    sanitizeInput,
    validateAgainstWhitelist,
    checkForInjectionPatterns
} from '../../utils/inputValidation';

export default function RegisterView() {
    const [formData, setFormData] = useState({
        username: "",
        fullname: '',
        idNumber: "",
        accountNumber: "",
        email: "",
        password: ""
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState([]);
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
        setFieldErrors([]);

        const sanitized = {
            username: sanitizeInput(formData.username),
            fullname: sanitizeInput(formData.fullname),
            idNumber: sanitizeInput(String(formData.idNumber)),
            accountNumber: sanitizeInput(String(formData.accountNumber)),
            email: sanitizeInput(formData.email).toLowerCase(),
            password: formData.password.trim()
        };

        const validationMessages = [];

        if (!validateAgainstWhitelist(sanitized.username, 'username').isValid) {
            validationMessages.push('Username must be 3-20 characters using letters, numbers, or underscores.');
        }

        if (!validateAgainstWhitelist(sanitized.fullname, 'fullname').isValid) {
            validationMessages.push('Full name may only include letters, spaces, periods, or hyphens.');
        }

        if (!validateAgainstWhitelist(sanitized.idNumber, 'idNumber').isValid) {
            validationMessages.push('ID number must be 5-20 digits.');
        }

        if (!validateAgainstWhitelist(sanitized.accountNumber, 'accountNumber').isValid) {
            validationMessages.push('Account number must be 8-18 digits.');
        }

        if (!validateAgainstWhitelist(sanitized.email, 'email').isValid) {
            validationMessages.push('Enter a valid email address.');
        }

        if (sanitized.password.length < 8) {
            validationMessages.push('Password must be at least 8 characters long.');
        }

        const passwordThreats = checkForInjectionPatterns(sanitized.password);
        if (!passwordThreats.isSafe) {
            validationMessages.push('Password contains prohibited characters.');
        }

        if (validationMessages.length > 0) {
            setFieldErrors(validationMessages);
            setError('Please resolve the issues below to continue.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("https://localhost:4000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sanitized),
            });
            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : {};

            if (response.ok) {
                setError('');
                setFieldErrors([]);
                navigate('/account-registered', { replace: true });
            } else {
                const backendErrors = [];
                if (Array.isArray(data.errors)) {
                    backendErrors.push(...data.errors);
                }
                if (data.message) {
                    backendErrors.push(data.message);
                }
                setFieldErrors(backendErrors);
                setError(backendErrors.length ? 'We could not register you because:' : 'Registration failed. Please try again.');
            }
        } catch (error) {
            // Registration error occurred
            setError(error?.message || "Registration failed. Please try again.");
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
                {fieldErrors.length > 0 && (
                    <ul className="error-list">
                        {fieldErrors.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
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
                            value={formData.fullname}
                            name="fullname"
                            placeholder="Full Name"
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="text"
                            name="idNumber"
                            placeholder="ID Number"
                            value={formData.idNumber}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="number"
                            name="accountNumber"
                            placeholder="Account Number"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <FormInput
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="8"
                        />
                    </FormGroup>

                    <PrimaryButton type="submit" disabled={submitting}>
                        {submitting ? 'Creating Account…' : 'Register'}
                    </PrimaryButton>

                    <div className="link-text">
                        <Link to="/login">or Login</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}


