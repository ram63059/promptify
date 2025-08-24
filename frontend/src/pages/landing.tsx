import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  MessageSquare,
  Target,
  MousePointer,
  Globe,
  Clock,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Promptify</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="#features" className="text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link to="#pricing" className="text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
              <Link to="/auth/login" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/auth/signup">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 bg-secondary text-secondary-foreground">
            <Zap className="w-4 h-4 mr-1" />
            Chrome Extension
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Generate Perfect AI Prompts
            <span className="text-primary"> Without Leaving Any Website</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your rough ideas into powerful AI prompts with our floating button that works on every website. No
            more switching tabs or copying text between apps.
          </p>

          <div className="bg-secondary rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Any Website</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                <span>Click Floating Button</span>
              </div>
              <ArrowRight className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Get Perfect Prompt</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              <Download className="w-5 h-5 mr-2" />
              Download Extension
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link to="#pricing">
                View Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Starting at $1 for 20 prompts • Works on every website</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Never Leave Your Current Webpage Again</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our Chrome extension integrates seamlessly into your browsing experience, providing instant AI prompt
              generation wherever you are.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-background border-border">
              <CardHeader>
                <MousePointer className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Floating Button on Every Site</CardTitle>
                <CardDescription>
                  Access Promptify instantly with a subtle floating button that appears on any website you visit.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <Clock className="w-10 h-10 text-accent mb-2" />
                <CardTitle>Instant Prompt Generation</CardTitle>
                <CardDescription>
                  Type your rough idea and get a polished AI prompt in seconds, without disrupting your workflow.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <Globe className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Works Everywhere</CardTitle>
                <CardDescription>
                  Gmail, Notion, Google Docs, social media, or any website - Promptify works seamlessly everywhere.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <Target className="w-10 h-10 text-accent mb-2" />
                <CardTitle>Smart Prompt Engineering</CardTitle>
                <CardDescription>
                  Transform vague ideas into structured, effective prompts that get precise AI responses.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Your ideas and prompts are processed securely and never stored permanently on our servers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border">
              <CardHeader>
                <Sparkles className="w-10 h-10 text-accent mb-2" />
                <CardTitle>AI-Powered Generation</CardTitle>
                <CardDescription>
                  Powered by multiple AI models with intelligent fallback for reliable prompt generation.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Simple, Affordable Pricing</h2>
            <p className="text-lg text-muted-foreground">Pay only for what you use. No monthly commitments.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle>Starter Pack</CardTitle>
                <CardDescription>Perfect for occasional prompt generation</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">$1</span>
                  <span className="text-muted-foreground"> for 20 prompts</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    20 AI-generated prompts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Works on all websites
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Floating button access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    All prompt types
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Get Started - $1</Button>
              </CardContent>
            </Card>

            <Card className="bg-background border-border border-primary relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle>Power Pack</CardTitle>
                <CardDescription>For regular AI users and professionals</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-foreground">$9</span>
                  <span className="text-muted-foreground"> for 200 prompts</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    200 AI-generated prompts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Works on all websites
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Priority processing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Advanced prompt templates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Usage analytics
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
                  Best Value - $9
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Transform Your AI Experience Today</h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join users who are getting better AI responses without ever leaving their favorite websites
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Chrome Extension
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Promptify</span>
              </div>
              <p className="text-background/70">Generate perfect AI prompts for any task, right in your browser.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-background">Product</h3>
              <ul className="space-y-2 text-background/70">
                <li>
                  <Link to="#features" className="text-background/70 hover:text-background">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="#pricing" className="text-background/70 hover:text-background">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-background">Support</h3>
              <ul className="space-y-2 text-background/70">
                <li>
                  <Link to="/help" className="text-background/70 hover:text-background">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-background/70 hover:text-background">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-background/70 hover:text-background">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-background">Company</h3>
              <ul className="space-y-2 text-background/70">
                <li>
                  <Link to="/about" className="text-background/70 hover:text-background">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-background/70 hover:text-background">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-background/70 hover:text-background">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/70">
            <p>&copy; 2024 Promptify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
