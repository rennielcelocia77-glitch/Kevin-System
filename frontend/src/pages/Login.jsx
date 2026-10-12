import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError('');
    try { await login(form); navigate('/dashboard'); } catch (err) { setError(err.message); }
  }
  return <main className="login-page"><section className="login-art"><span className="brand-mark large">B</span><p className="eyebrow">Production control</p><h1>Keep every strand<br />moving forward.</h1><p>One clear view of materials, people, and the work that turns Pinanitan into finished brooms.</p></section><section className="login-panel"><div className="login-box"><p className="eyebrow">Welcome back</p><h2>Sign in to operations</h2><form onSubmit={submit}><label>Username<input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label><label>Password<input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">Enter workspace</button></form><p className="login-note">Development credentials are configured in the project seed documentation.</p></div></section></main>;
}
