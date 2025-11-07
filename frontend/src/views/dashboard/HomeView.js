import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import { PrimaryButton, SecondaryButton } from '../../components/shared/Button';

export default function HomeView() {
    return (
        <div className="App">
            <Card>
                <div className="card-header">
                    <div className="card-icon">
                        🏦
                    </div>
                    <h1 className="card-title">Welcome</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <PrimaryButton>
                        <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Client Login
                        </Link>
                    </PrimaryButton>

                    <SecondaryButton>
                        <Link to="/employee/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Employee Login
                        </Link>
                    </SecondaryButton>

                </div>
            </Card>
        </div>
    );
}


