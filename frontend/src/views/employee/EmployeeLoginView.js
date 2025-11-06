import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { FormGroup, FormInput } from '../../components/shared/Form';
import { PrimaryButton } from '../../components/shared/Button';

export default function EmployeeLoginView() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const { username, password } = formData;

        try {
            // Employee login endpoint (to be created in backend)
            const response = await fetch("https://localhost:4000/api/auth/employee/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login Failed");
                return;
            }

            localStorage.setItem("employeeToken", data.token);
            localStorage.setItem("employee", JSON.stringify(data.employee));

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

