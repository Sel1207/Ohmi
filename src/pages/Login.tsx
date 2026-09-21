import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../constants/demo';
import { TIER_ORDER } from '../constants/tiers';
import { useAuth } from '../hooks/useAuth';
import type { SignupInput, SignupRole } from '../services/auth';
import type { TierId } from '../types';
import { errorMessage } from '../utils/errors';

type Mode = 'login' | 'signup';

export function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('maria@demo.ph');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [name, setName] = useState('');
  const [role, setRole] = useState<SignupRole>('client');
  const [tier, setTier] = useState<TierId>('ree');
  const [prcNumber, setPrcNumber] = useState('');
  const [locationText, setLocationText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? '/dashboard';
  }, [location.state]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const input: SignupInput = {
          name,
          email,
          password,
          role,
          tier: role === 'designer' ? tier : undefined,
          prcNumber,
          location: locationText,
        };
        await signup(input);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const pickDemo = (demoEmail: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFormError(null);
  };

  return (
    <main className="page narrow-page">
      <section className="card auth-card">
        <div>
          <p className="eyebrow">Local demo auth</p>
          <h1>{mode === 'login' ? 'Sign in to Ohmi' : 'Create an Ohmi account'}</h1>
          <p className="muted">Authentication is mocked in localStorage for this prototype.</p>
        </div>

        <div className="segmented" role="tablist" aria-label="Auth mode">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Sign in
          </button>
          <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
            Sign up
          </button>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <>
              <label className="field">
                Full name
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <div className="grid two">
                <label className="field">
                  Role
                  <select value={role} onChange={(event) => setRole(event.target.value as SignupRole)}>
                    <option value="client">Client</option>
                    <option value="designer">Designer</option>
                    <option value="pee_reviewer">PEE Reviewer</option>
                  </select>
                </label>
                <label className="field">
                  Location
                  <input value={locationText} onChange={(event) => setLocationText(event.target.value)} />
                </label>
              </div>
              {role === 'designer' ? (
                <div className="grid two">
                  <label className="field">
                    License tier
                    <select value={tier} onChange={(event) => setTier(event.target.value as TierId)}>
                      {TIER_ORDER.map((tierId) => (
                        <option key={tierId} value={tierId}>
                          {tierId.toUpperCase() === 'STUDENT' ? 'Student Practitioner' : tierId.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    PRC number
                    <input value={prcNumber} onChange={(event) => setPrcNumber(event.target.value)} />
                  </label>
                </div>
              ) : null}
              {role === 'pee_reviewer' ? (
                <label className="field">
                  PRC number
                  <input value={prcNumber} onChange={(event) => setPrcNumber(event.target.value)} required />
                </label>
              ) : null}
            </>
          ) : null}

          <label className="field">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>
          {formError ? <div className="alert error">{formError}</div> : null}
          <button className="btn btn-primary" type="submit">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="demo-list">
          <strong>Quick fill demo account</strong>
          {DEMO_ACCOUNTS.map((account) => (
            <button className="btn btn-ghost" type="button" key={account.email} onClick={() => pickDemo(account.email)}>
              {account.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
