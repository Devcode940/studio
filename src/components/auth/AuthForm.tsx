"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Mail, User, Chrome } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Name at least 2 chars" }),
  email: z.string().email({ message: "Valid email required" }),
  password: z.string().min(6, { message: "Password min 6" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function AuthForm() {
  const { login, register, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<'login'|'register'>('login');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onLogin(values: z.infer<typeof loginSchema>) {
    try {
      await login(values.email, values.password);
      toast({ title: "Login Successful", description: "Welcome back to KenyaWatch!" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.code === 'auth/invalid-credential' ? "Invalid email or password" : error.message || "Unexpected error",
      });
    }
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    try {
      await register(values.email, values.password, values.displayName);
      toast({ title: "Account Created", description: "Welcome to KenyaWatch!" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account",
      });
    }
  }

  async function onGoogle() {
    try {
      await loginWithGoogle();
      toast({ title: "Google Login Successful" });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Login Failed", description: error.message });
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl text-primary">KenyaWatch</CardTitle>
        <CardDescription>Transparency • Accountability • Progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <Button onClick={onGoogle} variant="outline" className="w-full" disabled={loading}>
              <Chrome className="w-4 h-4 mr-2" /> Continue with Google
            </Button>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
            </div>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 text-primary" />Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><KeyRound className="w-4 h-4 mr-2 text-primary" />Password</FormLabel>
                    <FormControl><Input placeholder="••••••••" {...field} type="password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField control={registerForm.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="w-4 h-4 mr-2 text-primary" />Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 text-primary" />Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><KeyRound className="w-4 h-4 mr-2 text-primary" />Password</FormLabel>
                    <FormControl><Input placeholder="••••••••" {...field} type="password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input placeholder="••••••••" {...field} type="password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms and Data Protection compliance per Kenya DPA 2019.
        </p>
      </CardContent>
    </Card>
  );
}
