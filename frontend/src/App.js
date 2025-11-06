import './App.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import {Helmet} from "react-helmet";

// Dashboard Views
import HomeView from './views/dashboard/HomeView';
import DashboardView from './views/dashboard/DashboardView';

// Auth Views
import LoginView from './views/auth/LoginView';
import RegisterView from './views/auth/RegisterView';
import AccountRegisteredView from './views/auth/AccountRegisteredView';
import RecoverUsernameView from './views/auth/RecoverUsernameView';
import RecoverPasswordView from './views/auth/RecoverPasswordView';

// Transaction Views
import SendMoneyView from './views/transactions/SendMoneyView';
import MoneySentView from './views/transactions/MoneySentView';
import MoneyReceivedView from './views/transactions/MoneyReceivedView';
import VerifyTransactionsView from './views/transactions/VerifyTransactionsView';

// Employee Views
import EmployeeLoginView from './views/employee/EmployeeLoginView';
import EmployeeTransactionsListView from './views/employee/EmployeeTransactionsListView';
import EmployeeTransactionDetailView from './views/employee/EmployeeTransactionDetailView';

function App() {
    return (
        <BrowserRouter>

          <Helmet>
            <meta charSet='utf-8'/>
            <title>Secure App</title>
            <meta
              httpEquiv="Content-Security-Policy"
              content="
                  default-src 'self';
                  script-src 'self';
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' data:;
                  connect-src 'self' https://localhost:4000;
                  frame-ancestors 'none';
                  "
            />
          </Helmet>
            <div>
                <Routes>
                    {/* Dashboard Routes */}
                    <Route exact path='/' element={<HomeView />} />
                    <Route path='/dashboard' element={<DashboardView />} />

                    {/* Auth Routes */}
                    <Route exact path='/login' element={<LoginView />} />
                    <Route path='/register' element={<RegisterView />} />
                    <Route path='/account-registered' element={<AccountRegisteredView />} />
                    <Route path='/recoverUsername' element={<RecoverUsernameView />} />
                    <Route path='/recoverPassword' element={<RecoverPasswordView />} />
                    <Route path='/recover-password' element={<RecoverPasswordView />} />

                    {/* Transaction Routes */}
                    <Route path='/send-money' element={<SendMoneyView />} />
                    <Route path='/money-sent' element={<MoneySentView />} />
                    <Route path='/money-received' element={<MoneyReceivedView />} />
                    <Route path='/verify-transactions' element={<VerifyTransactionsView />} />

                    {/* Employee Routes */}
                    <Route path='/employee/login' element={<EmployeeLoginView />} />
                    <Route path='/employee/transactions' element={<EmployeeTransactionsListView />} />
                    <Route path='/employee/transactions/:transactionId' element={<EmployeeTransactionDetailView />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
export default App;