import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';

type ProfileResponse = {
  user: { id: number; full_name: string; email: string; phone?: string; role: string };
  employee?: any;
  driver?: any;
};

function getInitials(fullName?: string, fallback?: string) {
  const raw = (fullName || fallback || '').trim();
  if (!raw) return 'U';
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) || '';
  return (first + last).toUpperCase();
}

function parseEmployeeLocation(raw?: string) {
  const text = String(raw || '');
  const addrMatch = text.match(/Address:\s*([^;]*)(?:;|$)/i);
  const pickupMatch = text.match(/Pickup:\s*(.*)$/i);
  return {
    address: (addrMatch?.[1] || '').trim(),
    pickup: (pickupMatch?.[1] || '').trim(),
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    profileAPI
      .getMe()
      .then((res) => {
        if (!mounted) return;
        setData(res);
      })
      .catch(() => {
        if (!mounted) return;
        setData(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const role = data?.user?.role || user?.role || 'user';
  const initials = useMemo(() => getInitials(data?.user?.full_name || user?.full_name, user?.email), [data, user]);

  const employee = data?.employee;
  const driver = data?.driver;
  const employeeLoc = useMemo(() => parseEmployeeLocation(employee?.location), [employee?.location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6 rounded-2xl shadow-lg border-none bg-gradient-to-br from-white to-emerald-50/40 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-gray-900 mb-1">Profile</h1>
              <p className="text-gray-600">{data?.user?.full_name || user?.full_name || user?.email}</p>
              <div className="mt-3 inline-flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">{role}</span>
                {role === 'employee' && employee?.employee_id ? (
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm">{employee.employee_id}</span>
                ) : null}
                {role === 'driver' && driver?.id ? (
                  <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm">Driver #{driver.id}</span>
                ) : null}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-lg border-none bg-white mb-6">
          <h2 className="text-gray-800 mb-4">Basic Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-gray-900">{data?.user?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{data?.user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900">{data?.user?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">User ID</p>
              <p className="text-gray-900">{data?.user?.id ?? '-'}</p>
            </div>
          </div>
        </Card>

        {role === 'employee' && (
          <Card className="p-6 rounded-2xl shadow-lg border-none bg-white mb-6">
            <h2 className="text-gray-800 mb-4">Employee Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Employee ID</p>
                <p className="text-gray-900">{employee?.employee_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Department</p>
                <p className="text-gray-900">{employee?.department || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Project Code</p>
                <p className="text-gray-900">{employee?.designation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-gray-900">{employee?.is_active === false ? 'Inactive' : 'Active'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Location / Address</p>
                <p className="text-gray-900">{employeeLoc.address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                <p className="text-gray-900">{employeeLoc.pickup || '-'}</p>
              </div>
            </div>
          </Card>
        )}

        {role === 'driver' && (
          <Card className="p-6 rounded-2xl shadow-lg border-none bg-white mb-6">
            <h2 className="text-gray-800 mb-4">Driver Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Driver ID</p>
                <p className="text-gray-900">{driver?.id ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">License Number</p>
                <p className="text-gray-900">{driver?.license_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-gray-900">{driver?.status || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vehicle Number</p>
                <p className="text-gray-900">{driver?.vehicle_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vehicle Type</p>
                <p className="text-gray-900">{driver?.vehicle_type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Vehicle Model</p>
                <p className="text-gray-900">{driver?.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Rating</p>
                <p className="text-gray-900">{driver?.rating ?? '-'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
