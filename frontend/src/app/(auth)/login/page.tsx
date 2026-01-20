'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/auth';
import { Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = await login(email, password);

        if (user) {
            router.push('/');
        } else {
            setError('Invalid email or password');
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex flex-col justify-between items-start p-12 relative overflow-hidden bg-zinc-900 text-white">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 z-0 opacity-80">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/30 blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
                </div>

                <div className="relative z-10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">MemberHub</span>
                </div>

                <div className="relative z-10 max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both" style={{ animationDelay: '200ms' }}>
                    <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
                        Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">community</span> with elegance.
                    </h1>
                    <p className="text-lg text-zinc-400">
                        The thoughtful platform for customer retention, point management, and seamless member experiences.
                    </p>
                </div>


            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                <div className="absolute top-8 right-8 flex gap-4">
                    <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Help
                    </Link>
                    <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Privacy
                    </Link>
                </div>

                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Enter your credentials to access your workspace.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-muted/30 border-input hover:border-ring/30 focus:border-ring transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs font-medium text-primary hover:underline">
                                    Forgot password?
                                </a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 bg-muted/30 border-input hover:border-ring/30 focus:border-ring transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all duration-300" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign in <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="pt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Demo Credentials
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div
                                onClick={() => { setEmail('admin@example.com'); setPassword('admin'); }}
                                className="cursor-pointer p-3 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all text-center group"
                            >
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">Admin</p>
                                <p className="text-xs text-muted-foreground">admin@example.com</p>
                            </div>
                            <div
                                onClick={() => { setEmail('staff@example.com'); setPassword('staff'); }}
                                className="cursor-pointer p-3 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all text-center group"
                            >
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">Staff</p>
                                <p className="text-xs text-muted-foreground">staff@example.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

