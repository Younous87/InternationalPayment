import React, { useState } from 'react';
import { validateAgainstWhitelist, checkForInjectionPatterns, sanitizeInput } from '../../utils/inputValidation';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';

export default function EmployeeLoginView() {
    const [formData, setFormData] = useState({
        username: '',
        accountNumber: '',
        password: ''
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
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
            alert('Invalid account number');
            return;
        }
        if (!password || password.length < 8 || !passwordThreats.isSafe) {
            alert('Invalid password');
            return;
        }

        try {
            // Use existing backend login endpoint
            const response = await fetch("https://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: usernameSanitized, accountNumber: Number(accountSanitized), password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login Failed");
                return;
            }

            localStorage.setItem("employeeToken", data.token);
            localStorage.setItem("employee", JSON.stringify(data.user));

            alert("Login Successful!");
            window.location.href = "/employee/transactions";
        } catch (error) {
            alert("Something went wrong. Try again.");
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

                    <PrimaryButton type="submit">
                        Login
                    </PrimaryButton>

                    <div className="link-text">
                        <Link to="/recover-password">Forgot Password?</Link>
                    </div>

                    <div className="link-text">
                        <Link to="/recoverUsername">Forgot Username?</Link>
                    </div>

                    <div className="link-text">
                        <Link to="/register">Register</Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

