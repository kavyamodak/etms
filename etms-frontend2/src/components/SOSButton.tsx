import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, X, MapPin, Clock, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { tripAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface EmergencyContact {
  name: string;
  number: string;
  icon: string;
}

export default function SOSButton() {
  const { user, isAuthenticated } = useAuth();
  const notify = useNotify();

  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emergencyContacts: EmergencyContact[] = [
    { name: 'Police', number: '100', icon: '🚔' },
    { name: 'Ambulance', number: '108', icon: '🚑' },
    { name: 'Fire Brigade', number: '101', icon: '🚒' },
    { name: 'Women Helpline', number: '1091', icon: '👮‍♀️' },
  ];

  // ── Poll for active trip ──────────────────────────────────────────
  const pollActiveTrip = useCallback(async () => {
    if (!isAuthenticated || !user || user.role === 'admin') return;
    const trip = await tripAPI.getActiveTrip();
    setActiveTrip(trip);
  }, [isAuthenticated, user]);

  useEffect(() => {
    pollActiveTrip();
    intervalRef.current = setInterval(pollActiveTrip, 30_000); // poll every 30 s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollActiveTrip]);

  // Collapse panel when trip ends
  useEffect(() => {
    if (!activeTrip) setIsExpanded(false);
  }, [activeTrip]);

  // ── Location tracking (only while panel is open) ───────────────────
  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    const attemptWatch = () => {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
          });
          setLocationError('');
        },
        () => setLocationError('Location access denied. Enable location in browser settings.'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
      setWatchId(id);
    };

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((r) => {
        if (r.state !== 'denied') attemptWatch();
        else setLocationError('Location access denied. Enable location in browser settings.');
      }).catch(attemptWatch);
    } else {
      attemptWatch();
    }
  };

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  useEffect(() => {
    if (isExpanded) startLocationTracking();
    else stopLocationTracking();
    return () => stopLocationTracking();
  }, [isExpanded]);

  // ── Emergency trigger ─────────────────────────────────────────────
  const triggerEmergency = async () => {
    if (isTriggered || isSubmitting) return;
    setIsSubmitting(true);
    setLocationError('');

    try {
      let location: Location;
      try {
        location = await new Promise<Location>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 0,
              timestamp: new Date().toISOString(),
            }),
            (e) => reject(new Error(e.message)),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      } catch {
        if (!currentLocation) throw new Error('Unable to get your location. Please enable location services.');
        location = currentLocation;
      }

      const emergencyData = {
        userId: user?.id,
        userRole: user?.role,
        userName: user?.full_name || user?.email,
        userEmail: user?.email,
        userPhone: (user as any)?.phone || 'Not provided',
        tripId: activeTrip?.id,
        location: { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy },
        timestamp: location.timestamp,
        emergencyLevel: 'CRITICAL',
        status: 'ACTIVE',
        description: 'Emergency SOS alert triggered during active trip',
      };

      let apiSuccess = false;
      try {
        const res = await fetch('/api/emergency/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Emergency-Priority': 'CRITICAL' },
          body: JSON.stringify(emergencyData),
        });
        if (res.ok) apiSuccess = true;
      } catch {
        // fallback: store locally
        const emergencyLogs = JSON.parse(localStorage.getItem('emergencyLogs') || '[]');
        emergencyLogs.push({ ...emergencyData, localTimestamp: new Date().toISOString(), submissionMethod: 'LOCAL_BACKUP' });
        localStorage.setItem('emergencyLogs', JSON.stringify(emergencyLogs));
      }

      setIsTriggered(true);
      if (apiSuccess) {
        notify.success('🚨 EMERGENCY ALERT SENT! Admin has been notified with your exact location. Stay calm — help is on the way!', { duration: 15000 });
      } else {
        notify.warning('⚠️ EMERGENCY ACTIVATED! Some systems may be unavailable. Please call emergency services directly if needed.', { duration: 15000 });
      }
      setTimeout(() => { setIsTriggered(false); setIsSubmitting(false); }, 300_000);
    } catch (error) {
      setLocationError(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      notify.error('🚨 EMERGENCY SYSTEM ERROR. Please call emergency services directly: Police: 100 | Ambulance: 108 | Fire: 101', { duration: 20000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Guard: only show for employees/drivers with an active trip ──────
  if (!isAuthenticated || !user || user.role === 'admin' || !activeTrip) {
    return null;
  }

  const getLocationAccuracyColor = () => {
    if (!currentLocation) return 'text-gray-500';
    if (currentLocation.accuracy < 10) return 'text-green-600';
    if (currentLocation.accuracy < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* SOS Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isSubmitting}
        className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border-3 border-white/50 ${isTriggered
            ? 'bg-red-700 animate-pulse'
            : 'bg-gradient-to-br from-red-700 via-red-600 to-red-800 hover:from-red-800 hover:via-red-700 hover:to-red-900'
          }`}
      >
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
        <div className="absolute inset-0 rounded-full bg-red-600 animate-pulse opacity-30" />

        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="text-white font-black text-sm leading-tight tracking-wider">SOS</span>
          <AlertTriangle className="w-4 h-4 text-white mt-0.5" strokeWidth={3} />
        </div>

        {isSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-800/90 rounded-full">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>

      {/* Trip Active Badge */}
      <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-tight shadow-lg animate-pulse">
        LIVE
      </div>

      {/* Emergency Panel */}
      {isExpanded && (
        <div className="absolute top-16 right-0 w-96 bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-900 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" strokeWidth={3} />
                <h3 className="font-bold text-lg">EMERGENCY ASSISTANCE</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-white hover:bg-red-700/50">
                <X className="w-5 h-5" strokeWidth={2} />
              </Button>
            </div>
            <p className="text-red-100 font-medium text-sm">
              {isTriggered ? '🚨 ALERT SENT! Help is on the way!' : '⚡ Click SOS to send emergency alert'}
            </p>
          </div>

          {/* Active Trip Info */}
          <div className="p-4 border-b border-gray-100 bg-emerald-50">
            <p className="text-xs font-semibold text-emerald-700 mb-1  tracking-wide">Active Trip</p>
            <p className="text-gray-800 font-medium text-sm">
              {activeTrip.route_name || `${activeTrip.start_location} → ${activeTrip.end_location}`}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Trip ID: #{activeTrip.id}</p>
          </div>

          {/* Location Status */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-800 text-sm">Current Location</span>
            </div>
            {currentLocation ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Accuracy:</span>
                  <span className={`text-sm font-medium ${getLocationAccuracyColor()}`}>
                    ±{currentLocation.accuracy.toFixed(0)}m
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Getting location...</p>
            )}
            {locationError && <p className="text-sm text-red-600 mt-2">{locationError}</p>}
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-800 text-sm">Your Information</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm text-gray-600">Name: {user?.full_name || user?.email || 'Unknown'}</p>
              <p className="text-sm text-gray-600">Role: {user?.role || 'Unknown'}</p>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-800 text-sm">Emergency Services</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {emergencyContacts.map((contact, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${contact.number}`, '_self')}
                  className="flex items-center gap-2 justify-start hover:bg-red-50 hover:border-red-300 text-left"
                >
                  <span className="text-base">{contact.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.number}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Main SOS Action */}
          <div className="p-4 bg-gray-50">
            <Button
              onClick={triggerEmergency}
              disabled={isTriggered || isSubmitting}
              className={`w-full py-4 text-base font-extrabold rounded-xl transition-all ${isTriggered
                  ? 'bg-gray-600 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg'
                }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SENDING ALERT...</span>
                </div>
              ) : isTriggered ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>🚨 ALERT SENT — HELP ON WAY</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" strokeWidth={3} />
                  <span>🚨 SEND SOS EMERGENCY ALERT</span>
                </div>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              ⚡ Immediately alerts admin with your location and trip details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
