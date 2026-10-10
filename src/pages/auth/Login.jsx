import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Camera, Lock, Mail, AlertCircle, ArrowRight, Shield, UserCheck, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import turtledotLogo from '../../img/turtledot_app_icon_color.png';

export const Login = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: 'admin@studio.local',
      password: 'Admin@123456',
    },
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.post('/auth/login', data);
      const authData = response.data.data;
      setAuth(authData);

      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (authData.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (authData.user.role === 'EMPLOYEE') {
        navigate('/employee', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email, password) => {
    setValue('email', email);
    setValue('password', password);
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#eef2f7] px-4 py-12 overflow-hidden selection:bg-amber-500/20 selection:text-amber-900 font-sans">
      {/* Universal Ambient Diffuse Glowing Orbs */}
      <div className="absolute top-1/4 -left-20 w-[34rem] h-[34rem] bg-amber-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-[36rem] h-[36rem] bg-sky-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl neu-glass-btn p-2 mb-4 transform hover:scale-105 transition overflow-hidden border border-white/90">
            <img src={turtledotLogo} alt="Turtledot Studio" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight drop-shadow-xs">
            Turtledot Studio CRM
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-semibold tracking-wide">
            Commercial Photography Management & Client Delivery Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="neu-glass-panel rounded-3xl p-8 sm:p-9 shadow-2xl border border-white/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-stone-900">Sign in to your account</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your studio credentials to access your portal
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="name@studio.com"
                  className="w-full neu-glass-input rounded-2xl pl-10 pr-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 font-medium"
                />
              </div>
              {errors.email && (
                <span className="text-[11px] text-rose-600 mt-1 block font-medium">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full neu-glass-input rounded-2xl pl-10 pr-4 py-2.5 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 font-medium"
                />
              </div>
              {errors.password && (
                <span className="text-[11px] text-rose-600 mt-1 block font-medium">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-glass-btn-primary w-full py-3 px-4 rounded-2xl font-bold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 active:scale-[0.98]"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Logins Bar */}
          <div className="mt-8 pt-6 border-t border-stone-200/60">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider text-center mb-3">
              Fast Demo One-Click Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin@studio.local', 'Admin@123456')}
                className="neu-glass-btn flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl text-stone-700 text-xs font-semibold"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Portal</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('employee@studio.local', 'Employee@123456')}
                className="neu-glass-btn flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl text-stone-700 text-xs font-semibold"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Staff Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-stone-400 mt-6 font-medium">
          © 2026 Turtledot Studio CRM. High-Performance Client Delivery.
        </p>
      </div>
    </div>
  );
};

export default Login;
