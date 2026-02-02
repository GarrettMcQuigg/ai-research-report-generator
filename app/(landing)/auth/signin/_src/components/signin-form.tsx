'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/packages/lib/components/button';
import { Input } from '@/packages/lib/components/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/packages/lib/components/form';
import { Alert } from '@/packages/lib/components/alert';
import { createClient } from '@/packages/lib/supabase/client';
import { AUTH_SIGNUP_ROUTE, DASHBOARD_ROUTE } from '@/packages/lib/routes';

const signinSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export function SigninForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SigninFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push(DASHBOARD_ROUTE);
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Welcome back! Generate research reports with AI.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary/90">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-sm text-muted-foreground">Don&apos;t have an account?</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="mt-6">
              <Link href={AUTH_SIGNUP_ROUTE}>
                <Button variant="outline" className="w-full">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
