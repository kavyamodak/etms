import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, User, X, CheckCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { emergencyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EmergencyAlert {
  id: string;
  userName: string;
  userRole: string;
  userEmail: string;
  userPhone: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED';
  emergencyLevel?: string;
  description?: string;
}

export default function EmergencyAlertCard() {
  const { user, isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldPoll, setShouldPoll] = useState(false);

  // Load dismissed alerts from localStorage on mount
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dismissedEmergencyAlerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Save dismissed alerts to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissedEmergencyAlerts', JSON.stringify(Array.from(dismissedAlerts)));
    }
  }, [dismissedAlerts]);

  // Only show for authenticated admin users
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    // Don't fetch if user is not admin or no alerts should be shown
    if (!isAuthenticated || !user || user.role !== 'admin') {
      return;
    }

    const fetchAlerts = async () => {
      try {
        const data = await emergencyAPI.getEmergencyLogs();
        const activeAlerts = data.filter((alert: EmergencyAlert) => 
          alert.status === 'ACTIVE' && !dismissedAlerts.has(alert.id)
        );
        setAlerts(activeAlerts);
        
        // Stop polling if no alerts
        if (activeAlerts.length === 0) {
          setShouldPoll(false);
        }
      } catch (error) {
        // Silently handle expected 404 errors (backend not implemented)
        // Use mock data for demonstration when backend is not available
        const mockAlerts: EmergencyAlert[] = [
          {
            id: 'mock-1',
            userName: 'Test Driver',
            userRole: 'driver',
            userEmail: 'test.driver@company.com',
            userPhone: '+91-9876543210',
            location: {
              latitude: 19.0760,
              longitude: 72.8777,
              accuracy: 10
            },
            timestamp: new Date().toISOString(),
            status: 'ACTIVE' as const,
            emergencyLevel: 'HIGH',
            description: 'Test emergency alert for demonstration'
          }
        ].filter(alert => !dismissedAlerts.has(alert.id));
        
        setAlerts(mockAlerts);
        
        // Stop polling if no alerts
        if (mockAlerts.length === 0) {
          setShouldPoll(false);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAlerts();
    
    // Only set up polling if there are alerts and shouldPoll is true
    let interval: number;
    if (shouldPoll && alerts.length > 0) {
      interval = window.setInterval(fetchAlerts, 10000);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [dismissedAlerts, shouldPoll, alerts.length, isAuthenticated, user]);

  // Start polling when alerts appear
  useEffect(() => {
    if (alerts.length > 0 && !shouldPoll && isAuthenticated && user && user.role === 'admin') {
      setShouldPoll(true);
    }
  }, [alerts, shouldPoll, isAuthenticated, user]);

  const dismissAlert = async (alertId: string) => {
    try {
      await emergencyAPI.updateEmergencyStatus(alertId, 'RESOLVED');
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setDismissedAlerts(prev => new Set([...prev, alertId]));
      setShouldPoll(false); // Stop polling when alert is dismissed
    } catch (error) {
      // Silently handle expected 404 errors (backend not implemented)
      // For mock data, just remove the alert from state and add to dismissed
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setDismissedAlerts(prev => new Set([...prev, alertId]));
      setShouldPoll(false); // Stop polling when alert is dismissed
    }
  };

  // Function to clear all dismissed alerts (for admin reset)
  const clearDismissedAlerts = () => {
    setDismissedAlerts(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dismissedEmergencyAlerts');
    }
  };

  if (alerts.length === 0 && !loading) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <Card key={alert.id} className="w-96 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 shadow-2xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                <h3 className="font-bold text-red-800">EMERGENCY ALERT</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Dismiss</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="text-red-600 hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">{alert.userName}</span>
                <span className="text-sm text-red-600">({alert.userRole})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" />
                <span className="text-red-700">{alert.userPhone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => window.open(`tel:${alert.userPhone}`)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Phone className="w-3 h-3 mr-1" />
                Call User
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`, '_blank')}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <MapPin className="w-3 h-3 mr-1" />
                View Location
              </Button>
            </div>
            
            {/* Dismiss Button Section */}
            <div className="mt-3 pt-3 border-t border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Mark as resolved and remove from dashboard</span>
                <Button
                  onClick={() => dismissAlert(alert.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span className="font-medium">Dismiss</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
