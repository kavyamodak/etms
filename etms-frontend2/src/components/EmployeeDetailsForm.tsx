import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, Hash, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { employeeAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';

export default function EmployeeDetailsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const notify = useNotify();

  const [formData, setFormData] = useState({
    employeeId: editData?.displayId || editData?.id || '',
    employeeName: editData?.name || sessionStorage.getItem('userFullName') || '',
    department: editData?.department || '',
    projectCode: '',
    email: editData?.email || sessionStorage.getItem('userEmail') || '',
    mobileNo: sessionStorage.getItem('userPhone') || '',
    address: '',
    pickupPoint: editData?.route && editData.route !== '-' ? editData.route : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editData) {
      try {
        await employeeAPI.update(Number(editData.id), {
          department: formData.department,
          location: formData.pickupPoint,
        });
        notify.success('Employee updated successfully!');
        navigate('/admin/users', { replace: true });
      } catch (err: any) {
        notify.error(err?.message || 'Failed to update employee.');
      }
      return;
    }

    await employeeAPI.completeOnboarding({
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      phone: formData.mobileNo,
      department: formData.department,
      projectCode: formData.projectCode,
      address: formData.address,
      pickupPoint: formData.pickupPoint,
    });

    const shouldPersist = localStorage.getItem('persistAuth') === '1';
    const storage = shouldPersist ? localStorage : sessionStorage;
    const raw = storage.getItem('authUser');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.full_name = formData.employeeName;
        storage.setItem('authUser', JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }

    sessionStorage.removeItem('needsOnboarding');
    sessionStorage.removeItem('onboardingRole');
    notify.success('Registration successful! Redirecting...');
    setTimeout(() => {
      navigate('/user', { replace: true });
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eef3] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 md:p-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-gray-800 mb-2">{editData ? 'Edit Employee Details' : 'Employee Details'}</h1>
          <p className="text-gray-500">{editData ? 'Update employee profile' : 'Complete your profile to get started'}</p>
        </div>

        {/* Employee Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Employee ID */}
            <div>
              <Label htmlFor="employeeId" className="text-gray-700 mb-2 block">
                Employee ID *
              </Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  placeholder="EMP001"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Employee Name */}
            <div>
              <Label htmlFor="employeeName" className="text-gray-700 mb-2 block">
                Employee Name *
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  id="employeeName"
                  name="employeeName"
                  placeholder="Rajesh Kumar"
                  value={formData.employeeName}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Project Code */}
            <div>
              <Label htmlFor="projectCode" className="text-gray-700 mb-2 block">
                Project Code *
              </Label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  id="projectCode"
                  name="projectCode"
                  placeholder="101096073"
                  value={formData.projectCode}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department" className="text-gray-700 mb-2 block">
                Department *
              </Label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  id="department"
                  name="department"
                  placeholder="IT"
                  value={formData.department}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Email ID */}
            <div>
              <Label htmlFor="email" className="text-gray-700 mb-2 block">
                Email ID *
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="rajesh.kumar@company.in"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Mobile No */}
            <div>
              <Label htmlFor="mobileNo" className="text-gray-700 mb-2 block">
                Mobile No *
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  id="mobileNo"
                  name="mobileNo"
                  placeholder="+91 98765 43210"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                  pattern="[+]?[0-9\s]+"
                />
              </div>
            </div>

            {/* Pickup Point */}
            <div>
              <Label htmlFor="pickupPoint" className="text-gray-700 mb-2 block">
                Pickup Point *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  id="pickupPoint"
                  name="pickupPoint"
                  placeholder="Hinjawadi"
                  value={formData.pickupPoint}
                  onChange={handleChange}
                  className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address - Full Width */}
          <div>
            <Label htmlFor="address" className="text-gray-700 mb-2 block">
              Address *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                id="address"
                name="address"
                placeholder="123 MG Road, Koramangala, Bangalore, Karnataka 560034"
                value={formData.address}
                onChange={handleChange}
                className="pl-12 h-12 rounded-lg border-gray-300 bg-gray-50"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-full h-12 shadow-md mt-6"
          >
            {editData ? 'UPDATE EMPLOYEE' : 'COMPLETE REGISTRATION'}
          </Button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          * All fields are required
        </p>
      </div>
    </div>
  );
}
