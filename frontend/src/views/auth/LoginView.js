import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton, SecondaryButton } from '../../components/shared/Button';

export default function LoginView() {
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

        try {
            const response = await fetch("https://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, accountNumber, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login Failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert("Login Successful!");
            window.location.href = "/dashboard";
        } catch (error) {
            // Login error occurred
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
