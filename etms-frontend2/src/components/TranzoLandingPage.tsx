import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Route, Users, Activity, Shield, Mail, Phone, MapPinned, ArrowRight, Truck, BarChart3, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function TranzoLandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const features = [
    {
      icon: Route,
      title: 'Route Optimization',
      description: 'AI-powered route planning reduces travel time and fuel costs with real-time traffic analysis and smart rerouting.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Driver & Fleet Management',
      description: 'Comprehensive driver tracking, performance analytics, and complete fleet visibility in one unified platform.',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      icon: Activity,
      title: 'Real-time Tracking',
      description: 'Monitor your entire fleet in real-time with GPS-enabled tracking for enhanced security and operational efficiency.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Secure & Scalable Architecture',
      description: 'Enterprise-grade security with scalable infrastructure designed to grow with your transportation needs.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Action Buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <Button
          onClick={() => navigate('/login')}
          variant="outline"
          className="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-full px-6 shadow-lg"
        >
          Login
        </Button>
        <Button
          onClick={() => navigate('/signup')}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full px-6 shadow-lg"
        >
          Sign Up
        </Button>
      </div>

      {/* Top Navigation Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
      >
        {isMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Dropdown Navigation Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-20 left-4 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden w-72 border border-gray-200">
            <div className="p-2">
              <button
                onClick={() => scrollToSection('home')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Home</div>
                    <div className="text-xs text-gray-500">Smart transport & routing automation</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => scrollToSection('why-tranzo')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-gray-900">Why Tranzo</div>
                    <div className="text-xs text-gray-500">Efficiency, automation, scalability</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-600" />
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
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1581392591656-3efbeca21328?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGxvZ2lzdGljcyUyMHJvdXRpbmclMjBhdXRvbWF0aW9ufGVufDF8fHx8MTc2NjIyNzUwNHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Smart Transportation"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-cyan-900/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Truck className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl md:text-3xl text-white tracking-wide">
                TRANZO
              </h1>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            Smart Transportation.<br />
            Automated Routing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Enterprise Control.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Transform your transportation operations with AI-powered routing, real-time tracking, and comprehensive fleet management
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 rounded-full text-lg shadow-2xl hover:shadow-cyan-500/50 transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => scrollToSection('why-tranzo')}
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 px-8 py-6 rounded-full text-lg"
            >
              Explore Features
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <ArrowRight className="w-6 h-6 text-white rotate-90" />
          </div>
        </div>
      </section>

      {/* Why Tranzo Section */}
      <section id="why-tranzo" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm mb-4">
              Why Choose Us
            </div>
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Why Tranzo
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Empower your enterprise with cutting-edge transportation technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl md:text-6xl text-white mb-2">Global</div>
              <div className="text-xl text-blue-100">Enterprise Standard</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl text-white mb-2">Real-time</div>
              <div className="text-xl text-blue-100">Telematics & Tracking</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl text-white mb-2">99.9%</div>
              <div className="text-xl text-blue-100">Platform Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm mb-4">
              Get In Touch
            </div>
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your transportation operations? Our team is here to help
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-3">Email</h3>
              <a
                href="mailto:hello@tranzo.in"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                hello@tranzo.in
              </a>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-3">Phone</h3>
              <a
                href="tel:+918080909090"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                +91 80809 09090
              </a>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <MapPinned className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-3">Office</h3>
              <p className="text-gray-600">
                Hitech City, Madhapur<br />
                Hyderabad, Telangana 500081
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <Truck className="w-8 h-8 text-cyan-400" />
              <div>
                <div className="text-xl">TRANZO</div>
                <div className="text-sm text-gray-400">Transportation & Routing Automation Network Zone</div>
              </div>
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
