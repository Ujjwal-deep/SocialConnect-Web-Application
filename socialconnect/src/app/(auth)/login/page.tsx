'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      login: '',
      password: '',
    },
  })

  const loginValue = form.watch('login')

  useEffect(() => {
    if (!loginValue) return
    const timer = setTimeout(() => {
      form.trigger('login')
    }, 500)
    return () => clearTimeout(timer)
  }, [loginValue, form])


  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
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
          <p className="t-xs uppercase tracking-widest text-text-muted mb-1.5">Welcome back</p>
          <CardTitle className="t-h1 text-text-primary">
            Sign in to <span className="text-accent">Social<span className="text-text-primary">Connect</span></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel className="form-label">Email or Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        {...field} 
                        className="form-input"
                      />
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
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="form-input"
                      />
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
                {loading ? <div className="spinner" /> : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="p-0 mt-6 justify-center">
          <p className="t-sm text-text-muted">
            Don't have an account?{' '}
            <Link href="/register" className="text-accent font-medium hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
