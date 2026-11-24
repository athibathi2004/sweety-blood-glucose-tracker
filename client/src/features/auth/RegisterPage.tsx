import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Full name cannot be empty')
      .max(100, 'Full name must be less than 100 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100, 'Password must be less than 100 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Registration failed. Please check your information.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary shadow-sm mb-1">
          <HeartPulse className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Your Account</h1>
        <p className="text-xs text-muted-foreground">
          Join Sweety for precision blood glucose monitoring & reporting
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Register</CardTitle>
              <Badge variant="lavender" className="text-[11px] font-normal">
                Patient Portal
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Complete the fields below to start logging daily readings
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full Name</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="pl-9"
                    error={Boolean(errors.name)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p id="name-error" className="text-destructive text-[11px] font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9"
                    error={Boolean(errors.email)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-destructive text-[11px] font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="pl-9 pr-10"
                    error={Boolean(errors.password)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Visual Password Strength Check */}
                {passwordValue && passwordValue.length >= 8 && (
                  <div className="flex items-center gap-1 text-[11px] text-mint-600 font-medium">
                    <Check className="w-3.5 h-3.5 text-mint-600" />
                    Meets minimum length of 8 characters
                  </div>
                )}
                {errors.password && (
                  <p id="password-error" className="text-destructive text-[11px] font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
                  <Input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="pl-9 pr-10"
                    error={Boolean(errors.confirmPassword)}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirm-password-error" className="text-destructive text-[11px] font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-3 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    Create Patient Account
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <div>
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline focus:outline-none"
              >
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Security footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Zero plaintext password storage. Protected by bcrypt hashing and secure HttpOnly JWT.
        </p>
      </div>
    </div>
  );
};
