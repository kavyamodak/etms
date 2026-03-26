import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, Clock, Shield, DollarSign, Users, BarChart3, Mail, Phone, MapPinned, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const advantages = [
    {
      icon: MapPin,
      title: 'Real-Time Vehicle Tracking',
      description: 'Monitor your fleet across major Indian cities with GPS-enabled tracking for enhanced security and efficiency.',
      image: 'https://images.unsplash.com/photo-1758292109543-a5c7f0c4cb9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYSUyMGNvcnBvcmF0ZSUyMG9mZmljZSUyMHRyYW5zcG9ydHxlbnwxfHx8fDE3NjYxNDA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Clock,
      title: 'Automated Route Planning',
      description: 'AI-powered route optimization for Indian metros reduces travel time and fuel costs while improving on-time performance.',
      image: 'https://images.unsplash.com/photo-1708884831332-56f4e081fabe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5nYWxvcmUlMjBjaXR5JTIwdHJhZmZpYyUyMG1vZGVybnxlbnwxfHx8fDE3NjYxNDA0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Shield,
      title: 'Safety-First Compliance',
      description: 'Comprehensive safety protocols compliant with Indian transport regulations, driver monitoring, and compliance tracking.',
      image: 'https://images.unsplash.com/photo-1742535035610-c5865df05858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBlbXBsb3llZXMlMjB3b3JrcGxhY2V8ZW58MXx8fHwxNjY2MTQwNDUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: DollarSign,
      title: 'Cost Reduction',
      description: 'Minimize operational expenses with smart routing, fuel management optimized for Indian traffic conditions.',
      image: 'https://images.unsplash.com/photo-1758292109543-a5c7f0c4cb9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbGVldCUyMG1hbmFnZW1lbnQlMjBpbmRpYXxlbnwxfHx8fDE3NjYxNDA0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: Users,
      title: 'Driver Management',
      description: 'Complete driver tracking, performance analytics, and payment management tailored for Indian workforce.',
      image: 'https://images.unsplash.com/photo-1742535035610-c5865df05858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBlbXBsb3llZXMlMjB3b3JrcGxhY2V8ZW58MXx8fHwxNjY2MTQwNDUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Data-driven insights and comprehensive reports to make informed business decisions for your Indian operations.',
      image: 'https://images.unsplash.com/photo-1758292109543-a5c7f0c4cb9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYSUyMGNvcnBvcmF0ZSUyMG9mZmljZSUyMHRyYW5zcG9ydHxlbnwxfHx8fDE3NjYxNDA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'HR Manager, Tech Solutions Pvt Ltd',
      location: 'Bangalore',
      content: 'ETMS has transformed our employee transportation. The real-time tracking gives us peace of mind and our employees feel much safer.',
    },
    {
      name: 'Priya Sharma',
      role: 'Operations Head, InfoTech India',
      location: 'Hyderabad',
      content: 'We reduced our transportation costs by 35% within 3 months. The automated route planning is a game-changer for our Hyderabad operations.',
    },
    {
      name: 'Amit Patel',
      role: 'Facility Manager, Global Corp',
      location: 'Pune',
      content: 'Managing our entire fleet operations was complex before ETMS. Now everything is streamlined and our employees are happier with the service.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>

            {/* Center - Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-blue-600">ETMS</span>
            </div>

            {/* Right - Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="rounded-full px-6 hover:bg-gray-100"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <nav className="space-y-4">
                <button
                  onClick={() => scrollToSection('home')}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <MapPinned className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div>Home</div>
                      <div className="text-sm text-gray-500">ETMS automation, transport optimization, safety, and scheduling</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => scrollToSection('advantages')}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div>Our Advantages</div>
                      <div className="text-sm text-gray-500">Efficiency, automation, live tracking, cost-cutting & safety</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => scrollToSection('contact')}
                  className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div>Contact Us</div>
                      <div className="text-sm text-gray-500">Get in touch with our team</div>
                    </div>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text Content */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
                Enterprise-Grade Transport Solution
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight">
                Smart Transport Automation for Modern Workplaces
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Revolutionize your employee transportation with intelligent route allocation,
                real-time driver tracking, comprehensive vehicle monitoring, and advanced safety
                protocols. Build a cost-efficient fleet management system that scales with your business.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  onClick={() => scrollToSection('advantages')}
                  className="rounded-full px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Learn More
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="rounded-full px-8 py-6 border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  Get Started
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl text-blue-600">Enterprise</div>
                  <div className="text-sm text-gray-500 mt-1">SLA Standard</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-blue-600">Dynamic</div>
                  <div className="text-sm text-gray-500 mt-1">Route Sync</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-blue-600">24/7</div>
                  <div className="text-sm text-gray-500 mt-1">Live Tracking</div>
                </div>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1736134869040-1c1853bc23cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjB0cmFuc3BvcnQlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzY2MTM3NTQyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Modern transport dashboard interface"
                  className="w-full h-auto"
                />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 max-w-xs hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Safety Rating</div>
                    <div className="text-2xl text-gray-900">A+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Advantages Section */}
      <section id="advantages" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">
              Why Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Our Advantages
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how our enterprise-grade platform transforms employee transportation management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-6 transition-colors">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">
              Customer Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from our satisfied customers about their experience with ETMS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Testimonial</div>
                    <div className="text-xl text-gray-900">"{testimonial.content}"</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-gray-400">{testimonial.role}, {testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm mb-4">
              Get In Touch
            </div>
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ready to transform your employee transportation? Reach out to our team today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Email */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Email</h3>
              <a
                href="mailto:contact@etms.in"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                contact@etms.in
              </a>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Phone</h3>
              <a
                href="tel:+918080808080"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                +91 80808 08080
              </a>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <MapPinned className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Office</h3>
              <p className="text-gray-600">
                Electronic City Phase 1<br />
                Bangalore, Karnataka 560100
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl mb-4">ETMS</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enterprise-grade Employee Transport Management System
              </p>
            </div>

            <div>
              <h4 className="text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 ETMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}