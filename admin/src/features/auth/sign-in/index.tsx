import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-provider';
import { api } from '@/lib/api';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof formSchema>;

export function SignIn() {
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'owner'>('admin');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const endpoint = loginMode === 'owner' ? '/api/owners/login' : '/api/auth/sign-in';
      const response = await api.post(endpoint, data);
      
      if (loginMode === 'owner') {
        const { token, owner } = response.data;
        login(token, { ...owner, role: 'owner' });
      } else {
        const { token, user } = response.data;
        login(token, { ...user, role: 'admin' });
      }
      
      toast.success('Logged in successfully');
      navigate({ to: '/' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#7a3317' }}>
            ZVenue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loginMode === 'admin' ? 'Admin Dashboard' : 'Owner Portal'}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-lg border p-1 mb-6">
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'admin' ? 'bg-[#7a3317] text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('owner')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'owner' ? 'bg-[#7a3317] text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Venue Owner
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...form.register('email')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7a3317] focus:border-[#7a3317]"
              placeholder={loginMode === 'owner' ? 'owner@example.com' : 'admin@example.com'}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#7a3317] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              {...form.register('password')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#7a3317] focus:border-[#7a3317]"
              placeholder="••••••••"
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#7a3317] hover:bg-[#5c2511] text-white rounded-md text-sm font-medium transition-colors"
          >
            {loading ? 'Signing in...' : `Sign In as ${loginMode === 'owner' ? 'Owner' : 'Admin'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
