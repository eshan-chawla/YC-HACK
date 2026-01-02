'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TripWeaverLogo } from '@/components/TripWeaverLogo'
import { motion } from 'framer-motion'
import { ShieldCheck, UserCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('admin')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Set mock session for demo purposes
    localStorage.setItem('tripweaver_session', JSON.stringify({
      role: activeTab,
      timestamp: new Date().toISOString()
    }))
    
    if (activeTab === 'admin') {
      router.push('/admin')
    } else {
      router.push('/employee')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Brand Panel */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-green-500 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-green-600 blur-[160px]" />
        </div>
        
        <div className="relative z-10 max-w-md">
          <TripWeaverLogo size="lg" className="mb-8" />
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Next-generation corporate travel management.
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Streamline your team's travel with AI-powered itineraries, policy automation, and real-time expense tracking.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <span>Automated policy compliance</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-green-400" />
              </div>
              <span>Personalized employee experiences</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden flex justify-center mb-8">
            <TripWeaverLogo size="md" />
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>

          <Tabs defaultValue="admin" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="admin">Management</TabsTrigger>
              <TabsTrigger value="employee">Employee</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <Card className="border-none shadow-none p-0">
                <form onSubmit={handleLogin}>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl">Admin / Management Login</CardTitle>
                    <CardDescription>
                      Access management dashboard and travel policies.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0">
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input id="admin-email" type="email" placeholder="admin@company.com" required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="admin-password">Password</Label>
                        <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground h-auto">
                          Forgot password?
                        </Button>
                      </div>
                      <Input id="admin-password" type="password" required />
                    </div>
                  </CardContent>
                  <CardFooter className="px-0 pb-0 pt-6">
                    <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-green-600 text-primary-foreground gap-2 h-11"
                        disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Sign in as Admin
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="employee">
              <Card className="border-none shadow-none p-0">
                <form onSubmit={handleLogin}>
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl">Employee Login</CardTitle>
                    <CardDescription>
                      View your itineraries and chat with your travel agent.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0">
                    <div className="space-y-2">
                      <Label htmlFor="employee-email">Email</Label>
                      <Input id="employee-email" type="email" placeholder="john.doe@company.com" required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="employee-password">Password</Label>
                        <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground h-auto">
                          Forgot password?
                        </Button>
                      </div>
                      <Input id="employee-password" type="password" required />
                    </div>
                  </CardContent>
                  <CardFooter className="px-0 pb-0 pt-6">
                    <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-green-600 text-primary-foreground gap-2 h-11"
                        disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Sign in as Employee
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-primary">
              Contact your administrator
            </Button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

