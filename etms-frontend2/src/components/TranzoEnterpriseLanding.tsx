import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ArrowRight,
  Bus,
  Mail,
  Phone,
  MapPin,
  Shield,
  Users,
  BarChart3,
  Zap,
  Globe,
  Lock,
  TrendingUp,
  CheckCircle2,
  Activity,
  Gauge,
  Route as RouteIcon,
  MessageSquare,
  Sparkles,
  Clock,
  MapPinned,
  Award,
  Briefcase,
  Car,
  Train,
} from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import TransportAnimation from './TransportAnimation';

export default function TranzoEnterpriseLanding() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  const features = [
    {
      icon: Bus,
      title: 'Multi-Modal Fleet Management',
      description: 'Seamlessly manage buses, shuttles, cars, and metro integrations from a single unified platform. Track vehicle health, fuel consumption, and maintenance schedules with predictive analytics.',
      gradient: 'from-emerald-500 to-teal-500',
      stats: 'Real-time Telematics Integration',
    },
    {
      icon: Users,
      title: 'Intelligent Role-Based Dashboards',
      description: 'Purpose-built interfaces for Administrators, Drivers, and Employees with AI-powered personalization. Each role gets contextual data, real-time alerts, and actionable insights tailored to their workflow.',
      gradient: 'from-orange-500 to-red-500',
      stats: '3 Specialized User Interfaces',
    },
    {
      icon: Activity,
      title: 'Real-Time Operational Intelligence',
      description: 'Monitor live vehicle locations, route deviations, passenger counts, and ETA predictions with GPS accuracy. Advanced analytics provide insights on efficiency, cost optimization, and service quality.',
      gradient: 'from-teal-500 to-cyan-500',
      stats: 'Sub-second Latency Tracking',
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security & Compliance',
      description: 'ISO 27001 certified platform with end-to-end encryption, role-based access control (RBAC), and comprehensive audit trails. GDPR and Indian data protection compliance built-in.',
      gradient: 'from-red-500 to-pink-500',
      stats: 'ISO 27001 Certified',
    },
    {
      icon: TrendingUp,
      title: 'Scalable Cloud Infrastructure',
      description: 'Built on AWS/Azure with auto-scaling capabilities to handle peak loads. From small fleets to massive multi-region deployments. High availability SLA with disaster recovery and multi-region deployment.',
      gradient: 'from-indigo-500 to-purple-500',
      stats: 'Enterprise Grade SLA',
    },
    {
      icon: Zap,
      title: 'Smart Route Optimization Engine',
      description: 'AI-powered route planning considers traffic patterns, weather conditions, employee locations, and historical data. Significantly reduces fuel consumption and maximizes on-time performance through intelligent orchestration.',
      gradient: 'from-amber-500 to-orange-500',
      stats: 'Route Carbon Footprint Tracking',
    },
  ];

  const capabilities = [
    {
      title: 'Admin Control Center',
      description: 'Comprehensive command center for transport managers with real-time fleet visibility, employee management, driver allocation, financial analytics, compliance tracking, and executive reporting. Manage your entire workforce, assign routes dynamically, track payments, monitor SLA compliance, and generate custom reports with advanced filters.',
      image: 'https://images.unsplash.com/photo-1759752394755-1241472b589d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnRlcnByaXNlJTIwZGFzaGJvYXJkJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjY3NjgxMTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'Real-Time Fleet Dashboard with Live GPS',
        'Employee & Driver Lifecycle Management',
        'Dynamic Route Planning & Optimization',
        'Financial Analytics & Payment Processing',
        'Compliance & Safety Monitoring',
        'Custom Reports & Data Export',
      ],
    },
    {
      title: 'Driver Operations Panel',
      description: 'Mobile-optimized interface designed for on-the-go drivers with turn-by-turn navigation, trip management, digital attendance, earnings tracker, and direct communication with dispatch. Features offline mode for network-challenged areas, voice commands for hands-free operation, and real-time passenger pickup/drop notifications.',
      image: 'https://images.unsplash.com/photo-1765739099920-81a456008253?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBzaHV0dGxlJTIwYnVzfGVufDF8fHx8MTc2NjcyNzU1MXww&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'Smart Navigation with Traffic Updates',
        'Digital Trip Sheet & Attendance',
        'Real-Time Passenger Alerts',
        'Earnings & Incentive Tracker',
        'Emergency SOS & Support',
        'Offline Mode Support',
      ],
    },
    {
      title: 'Employee Booking & Tracking Interface',
      description: 'Consumer-grade user experience for employees with one-tap booking, live vehicle tracking with ETA, digital boarding passes, trip history with expense reports, feedback system for service quality, and integration with HR systems for automatic approvals. Support for adhoc bookings, recurring schedules, and multi-leg journeys.',
      image: 'https://images.unsplash.com/photo-1681569026551-2e95cc1caa11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBjYXIlMjBzZXJ2aWNlfGVufDF8fHx8MTc2Njc2ODk3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
      features: [
        'One-Tap Booking & Schedule Management',
        'Live GPS Tracking with ETA Precision',
        'Digital Boarding Pass & QR Code',
        'Trip History & Expense Integration',
        'Multi-Channel Feedback System',
        'Emergency Contact & SOS Button',
      ],
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Instant Registration',
      description: 'Sign up with corporate email or Google SSO. Automatic verification through company domain validation and HR system integration.',
      icon: Users,
    },
    {
      number: '02',
      title: 'Smart Role Assignment',
      description: 'AI-powered role detection based on email patterns, department codes, and organizational hierarchy. Instant provisioning of appropriate dashboard access.',
      icon: Shield,
    },
    {
      number: '03',
      title: 'Personalized Dashboard',
      description: 'Immediate access to role-specific interface with pre-configured widgets, relevant notifications, and customizable preferences.',
      icon: Gauge,
    },
    {
      number: '04',
      title: 'Live Operations',
      description: 'Start booking trips, tracking vehicles, managing routes, or monitoring fleet - all in real-time with instant synchronization across all devices.',
      icon: Activity,
    },
  ];

  const transportModes = [
    { icon: Bus, label: 'Fleet Management', count: 'Standardized' },
    { icon: Car, label: 'Executive Travel', count: 'On-Demand' },
    { icon: Train, label: 'Transit Integration', count: 'Multi-Modal' },
    { icon: Users, label: 'Corporate Partners', count: 'Tier-1' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Fixed Navigation Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`fixed top-6 left-6 z-[60] w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg border border-gray-200' : 'bg-white border border-gray-200'
          } hover:scale-105 hover:shadow-xl`}
      >
        {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Fixed Auth Buttons - Always Top Right */}
      <div className="fixed top-6 right-6 z-[60] flex gap-3">
        <Button
          onClick={() => navigate('/login')}
          variant="outline"
          className={`rounded-full px-6 transition-all duration-300 border-2 ${scrolled
            ? 'bg-white/95 backdrop-blur-lg border-orange-300 hover:border-orange-500 hover:bg-orange-50'
            : 'bg-white border-orange-300 hover:border-orange-500 hover:bg-orange-50'
            }`}
        >
          Login
        </Button>
        <Button
          onClick={() => navigate('/signup')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          Get Started
        </Button>
      </div>

      {/* Dropdown Navigation Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-24 left-6 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden w-80 border border-gray-200 animate-in slide-in-from-top-5 duration-300">
            <div className="p-2">
              <button
                onClick={() => scrollToSection('home')}
                className="w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900">Home</div>
                    <div className="text-xs text-gray-500">Employee transport platform</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => scrollToSection('why-tranzo')}
                className="w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900">Why TRANZO</div>
                    <div className="text-xs text-gray-500">Our value proposition</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900">Contact</div>
                    <div className="text-xs text-gray-500">Get in touch with us</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="grid lg:grid-cols-2 gap-24 items-start">
            {/* Left Column - Text Content */}
            <div className="space-y-8 pt-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm animate-in fade-in slide-in-from-top-3 duration-1000">
                <Sparkles className="w-4 h-4" />
                <span>Enterprise Employee Transportation Platform</span>
              </div>

              {/* Main Headline - TRANZO Biggest */}
              <div className="animate-in fade-in slide-in-from-top-5 duration-1000 delay-100">
                <h1 className="text-9xl md:text-[9.5rem] lg:text-[11rem] leading-none mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-orange-600">
                  TRANZO
                </h1>
                <h2 className="text-3xl md:text-4xl text-gray-900 leading-tight">
                  Transportation & Routing Automation Network Zone
                </h2>
              </div>

              {/* Subtext */}
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-7 duration-1000 delay-200">
                India's leading intelligent employee transport management system. Optimized for
                corporate shuttles, executive travel, and multi-modal transit integrations.
                Experience precision scaling with real-time GPS tracking, AI-driven route
                optimization, and enterprise-grade fleet control for modern organizations.
              </p>

              {/* Transport Modes */}
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-1000 delay-300">
                {transportModes.map((mode, index) => {
                  const Icon = mode.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{mode.label}</div>
                        <div className="text-lg text-gray-900">{mode.count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-top-9 duration-1000 delay-400 pt-4">
                <Button
                  onClick={() => navigate('/signup')}
                  className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 rounded-2xl text-lg shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => scrollToSection('contact')}
                  variant="outline"
                  className="group border-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 px-8 py-6 rounded-2xl text-lg transition-all duration-300"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Talk to Sales
                </Button>
              </div>
            </div>

            {/* Right Column — Premium Animated Visual */}
            <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200 flex items-center justify-center lg:-mt-16">
              {/* Glow halo behind animation */}
              <div className="absolute -inset-8 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
              <div className="relative w-full max-w-lg">
                <TransportAnimation />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-emerald-600 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-emerald-600 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Why TRANZO Section */}
      <section id="why-tranzo" className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm mb-6">
              Platform Capabilities
            </div>
            <h2 className="text-5xl md:text-7xl text-gray-900 mb-6">
              Why TRANZO
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The most comprehensive employee transportation platform built for Indian enterprises.
              Combining AI-powered optimization, real-time tracking, and enterprise-grade security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />

                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{feature.stats}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section id="capabilities" className="py-24 md:py-32 bg-gradient-to-br from-gray-50 to-emerald-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm mb-6">
              Specialized Dashboards
            </div>
            <h2 className="text-5xl md:text-7xl text-gray-900 mb-6">
              Purpose-Built Interfaces
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three distinct platforms optimized for Administrators, Drivers, and Employees.
              Each interface is crafted for maximum efficiency and user experience.
            </p>
          </div>

          <div className="space-y-32">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className={`flex flex-col lg:flex-row gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
              >
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-sm">
                    <Award className="w-4 h-4" />
                    {`Dashboard 0${index + 1}`}
                  </div>
                  <h3 className="text-4xl md:text-5xl text-gray-900">{capability.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{capability.description}</p>

                  <div className="grid grid-cols-1 gap-3 pt-4">
                    {capability.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
                    <ImageWithFallback
                      src={capability.image}
                      alt={capability.title}
                      className="relative rounded-3xl shadow-2xl border-4 border-white w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm mb-6">
              Quick Onboarding
            </div>
            <h2 className="text-5xl md:text-7xl text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deployment ready for global enterprise standards. Our intelligent
              deployment architecture handles role assignment, route mapping, and fleet integration with precision.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-teal-200 to-orange-200 transform -translate-y-1/2" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-emerald-600 hover:shadow-2xl transition-all duration-300 h-full">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-5xl font-mono text-emerald-200">{step.number}</div>
                        <h3 className="text-2xl text-gray-900">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div className="flex flex-col items-center">
              <Lock className="w-10 h-10 mb-3" />
              <div className="text-3xl mb-1">ISO 27001</div>
              <div className="text-emerald-100">Security Certified</div>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="w-10 h-10 mb-3" />
              <div className="text-3xl mb-1">National</div>
              <div className="text-emerald-100">Pan-India Coverage</div>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-10 h-10 mb-3" />
              <div className="text-3xl mb-1">24/7 Support</div>
              <div className="text-emerald-100">Always Available</div>
            </div>
            <div className="flex flex-col items-center">
              <Award className="w-10 h-10 mb-3" />
              <div className="text-3xl mb-1">Top Rated</div>
              <div className="text-emerald-100">Customer Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 md:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm mb-6">
              Get In Touch
            </div>
            <h2 className="text-5xl md:text-7xl text-gray-900 mb-6">
              Contact Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to revolutionize your employee transportation? Our team is available
              24/7 to discuss your specific requirements and provide a customized solution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-emerald-600">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-gray-900 text-center mb-3">Email Support</h3>
              <a
                href="mailto:hello@tranzo.in"
                className="text-emerald-600 hover:text-emerald-700 transition-colors text-center block text-lg"
              >
                hello@tranzo.in
              </a>
              <p className="text-gray-500 text-sm text-center mt-2">Response within 2 hours</p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-teal-600">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-gray-900 text-center mb-3">24/7 Helpline</h3>
              <a
                href="tel:+918080909090"
                className="text-teal-600 hover:text-teal-700 transition-colors text-center block text-lg"
              >
                +91 80809 09090
              </a>
              <p className="text-gray-500 text-sm text-center mt-2">Instant call support</p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-orange-600">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-gray-900 text-center mb-3">Headquarters</h3>
              <p className="text-gray-600 text-center text-lg">
                Hitech City, Madhapur<br />
                Mumbai, Maharashtra 400080
              </p>
              <p className="text-gray-500 text-sm text-center mt-2">Visit us Mon-Sat 9AM-6PM</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-6 rounded-2xl text-lg shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
            >
              Schedule a Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Bus className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="text-2xl">TRANZO</div>
                <div className="text-sm text-gray-400">Transportation & Routing Automation</div>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">API Access</a>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Tranzo. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}