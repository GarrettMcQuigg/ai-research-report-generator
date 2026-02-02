'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/packages/lib/components/button';
import { Input } from '@/packages/lib/components/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/packages/lib/components/form';
import { Alert } from '@/packages/lib/components/alert';
import { createClient } from '@/packages/lib/supabase/client';
import { AUTH_SIGNIN_ROUTE, DASHBOARD_ROUTE, API_AUTH_SIGNUP_ROUTE } from '@/packages/lib/routes';
import { fetcher } from '@/packages/lib/helpers/fetcher';

const signupSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Call our custom signup API route
      const response = await fetcher({
        url: API_AUTH_SIGNUP_ROUTE,
        requestBody: {
          email: data.email,
          password: data.password,
          name: data.name
        }
      });

      if (response.err) {
        throw new Error(response.message || 'Signup failed');
      }

      // Sign in the user after successful signup
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (signInError) {
        throw signInError;
      }

      router.push(DASHBOARD_ROUTE);
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during signup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">Create your account</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10 border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Input type="password" placeholder="Minimum 8 characters" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <p className="text-sm">{error}</p>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 border-t" />
              <span className="text-sm text-muted-foreground">Already have an account?</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="mt-6">
              <Link href={AUTH_SIGNIN_ROUTE}>
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
