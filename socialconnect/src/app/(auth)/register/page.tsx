'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
    },
  })

  const emailValue = form.watch('email')

  useEffect(() => {
    if (!emailValue) return
    const timer = setTimeout(() => {
      form.trigger('email')
    }, 500)
    return () => clearTimeout(timer)
  }, [emailValue, form])


  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      router.push('/feed')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <Card className="card--auth border-none shadow-none">
        <CardHeader className="p-0 mb-8">
          <p className="t-xs uppercase tracking-widest text-text-muted mb-1.5">Join the network</p>
          <CardTitle className="t-h1 text-text-primary">
            Create your account at <span className="text-accent">Social<span className="text-text-primary">Connect</span></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel className="form-label">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} className="form-input" />
                      </FormControl>
                      <FormMessage className="text-[0.8125rem] text-[#E24B4A] mt-0.5" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel className="form-label">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} className="form-input" />
                      </FormControl>
                      <FormMessage className="text-[0.8125rem] text-[#E24B4A] mt-0.5" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel className="form-label">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="john_doe" {...field} className="form-input" />
                    </FormControl>
                    <FormMessage className="text-[0.8125rem] text-[#E24B4A] mt-0.5" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel className="form-label">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} className="form-input" />
                    </FormControl>
                    <FormMessage className="text-[0.8125rem] text-[#E24B4A] mt-0.5" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel className="form-label">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="form-input" />
                    </FormControl>
                    <FormMessage className="text-[0.8125rem] text-[#E24B4A] mt-0.5" />
                  </FormItem>
                )}
              />

              {error && (
                <div className="form-error mt-2 bg-red-500/10 p-2 rounded text-xs">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="btn btn--primary btn--full mt-2" 
                disabled={loading}
              >
                {loading ? <div className="spinner" /> : 'Register'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-0 mt-6 justify-center">
          <p className="t-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
