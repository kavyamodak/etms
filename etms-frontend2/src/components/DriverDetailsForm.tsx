import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Phone,
  CreditCard,
  Car,
  Hash,
  Users,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Bus,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { driverAPI } from '../services/api';
import { useNotify } from '../context/NotificationContext';

export default function DriverDetailsForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const notify = useNotify();

  const [driverName, setDriverName] = useState(editData?.name || sessionStorage.getItem('userFullName') || '');
  const [phoneNo, setPhoneNo] = useState(editData?.phone || sessionStorage.getItem('userPhone') || '');
  const [driverLicense, setDriverLicense] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState(editData?.vehicle && editData.vehicle !== '-' ? editData.vehicle : '');
  const [carModel, setCarModel] = useState('');
  const [passengerCapacity, setPassengerCapacity] = useState('');
  const [carPhoto, setCarPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [validation, setValidation] = useState({
    driverName: { isValid: false, message: '' },
    phoneNo: { isValid: false, message: '' },
    driverLicense: { isValid: false, message: '' },
    vehicleName: { isValid: false, message: '' },
    vehiclePlate: { isValid: false, message: '' },
    carModel: { isValid: false, message: '' },
    passengerCapacity: { isValid: false, message: '' },
  });

  const phoneRegex = /^[6-9]\d{9}$/;
  const licenseRegex = /^[A-Z]{2}\d{13}$/; // Indian DL format: MH0120190012345
  const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/; // MH12AB1234

  // Validate fields
  const validateField = (field: string, value: string) => {
    let isValid = false;
    let message = '';

    switch (field) {
      case 'driverName':
        if (value.trim().length >= 3) {
          isValid = true;
          message = 'Valid name';
        } else if (value.trim().length > 0) {
          message = 'Name must be at least 3 characters';
        }
        break;

      case 'phoneNo':
        if (phoneRegex.test(value)) {
          isValid = true;
          message = 'Valid phone number';
        } else if (value.length > 0) {
          message = 'Invalid phone (10 digits, starting with 6-9)';
        }
        break;

      case 'driverLicense':
        if (licenseRegex.test(value)) {
          isValid = true;
          message = 'Valid license number';
        } else if (value.length > 0) {
          message = 'Format: MH0120190012345 (State + Year + Number)';
        }
        break;

      case 'vehicleName':
        if (value.trim().length >= 2) {
          isValid = true;
          message = 'Valid vehicle name';
        } else if (value.trim().length > 0) {
          message = 'Vehicle name required';
        }
        break;

      case 'vehiclePlate':
        if (plateRegex.test(value)) {
          isValid = true;
          message = 'Valid plate number';
        } else if (value.length > 0) {
          message = 'Format: MH12AB1234';
        }
        break;

      case 'carModel':
        if (value.trim().length >= 2) {
          isValid = true;
          message = 'Valid car model';
        } else if (value.trim().length > 0) {
          message = 'Car model required';
        }
        break;

      case 'passengerCapacity':
        const capacity = parseInt(value);
        if (capacity >= 1 && capacity <= 50) {
          isValid = true;
          message = 'Valid capacity';
        } else if (value.length > 0) {
          message = 'Capacity must be between 1 and 50';
        }
        break;
    }

    setValidation((v) => ({
      ...v,
      [field]: { isValid, message },
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCarPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // In production, this would open camera
    notify.info('Camera feature coming soon! Please use file upload for now.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // --- Synchronous validation (state updates are async, so we can't rely on `validation` state here) ---
    const nameValid = driverName.trim().length >= 3;
    const phoneValid = phoneRegex.test(phoneNo);
    const licenseValid = licenseRegex.test(driverLicense);
    const vNameValid = vehicleName.trim().length >= 2;
    const plateValid = plateRegex.test(vehiclePlate);
    const modelValid = carModel.trim().length >= 2;
    const capNum = parseInt(passengerCapacity);
    const capValid = Number.isFinite(capNum) && capNum >= 1 && capNum <= 50;

    if (!nameValid || !phoneValid || !licenseValid || !vNameValid || !plateValid || !modelValid || !capValid) {
      // Trigger UI validation messages
      validateField('driverName', driverName);
      validateField('phoneNo', phoneNo);
      validateField('driverLicense', driverLicense);
      validateField('vehicleName', vehicleName);
      validateField('vehiclePlate', vehiclePlate);
      validateField('carModel', carModel);
      validateField('passengerCapacity', passengerCapacity);
      notify.warning('Please fill all required fields correctly before submitting.', { duration: 6000 });
      return;
    }

    if (editData) {
      driverAPI.update(Number(editData.id), {
        driverName,
        phone: phoneNo,
        licenseNumber: driverLicense,
        vehicleName,
        vehicleNumber: vehiclePlate,
        carModel,
        capacity: capNum,
        vehicleImage: carPhoto || undefined,
        status: editData.status || 'active',
      })
        .then(() => {
          notify.success('Driver updated successfully!');
          navigate('/admin/drivers', { replace: true });
        })
        .catch((err: any) => {
          notify.error(err?.message || 'Failed to update driver details');
        });
      return;
    }

    driverAPI
      .completeOnboarding({
        driverName,
        phone: phoneNo,
        licenseNumber: driverLicense,
        vehicleName,
        vehicleNumber: vehiclePlate,
        carModel,
        capacity: capNum,
        vehicleImage: carPhoto || undefined,
      })
      .then(() => {
        const shouldPersist = localStorage.getItem('persistAuth') === '1';
        const storage = shouldPersist ? localStorage : sessionStorage;
        const raw = storage.getItem('authUser');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.full_name = driverName;
            storage.setItem('authUser', JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
        sessionStorage.removeItem('needsOnboarding');
        sessionStorage.removeItem('onboardingRole');
        notify.success('Driver registration successful! Redirecting...');
        setTimeout(() => {
          navigate('/driver', { replace: true });
        }, 500);
      })
      .catch((err: any) => {
        notify.error(err?.message || 'Failed to save driver details');
      });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 md:p-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
            <Bus className="w-8 h-8 text-white" />
            <h1 className="text-2xl text-white">TRANZO</h1>
          </div>
          <h2 className="text-gray-800 mb-2">{editData ? 'Edit Driver' : 'Driver Registration'}</h2>
          <p className="text-gray-500">{editData ? 'Update driver details' : 'Complete your driver profile'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Driver Name */}
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => {
                  setDriverName(e.target.value);
                  validateField('driverName', e.target.value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${driverName && validation.driverName.isValid
                  ? 'border-emerald-500'
                  : driverName && !validation.driverName.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                required
              />
              {driverName && validation.driverName.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.driverName.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.driverName.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {driverName && validation.driverName.message && (
                <p
                  className={`text-xs mt-1 ${validation.driverName.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.driverName.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={phoneNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNo(value);
                  validateField('phoneNo', value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${phoneNo && validation.phoneNo.isValid
                  ? 'border-emerald-500'
                  : phoneNo && !validation.phoneNo.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                required
              />
              {phoneNo && validation.phoneNo.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.phoneNo.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.phoneNo.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {phoneNo && validation.phoneNo.message && (
                <p
                  className={`text-xs mt-1 ${validation.phoneNo.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.phoneNo.message}
                </p>
              )}
            </div>
          </div>

          {/* Driver License */}
          <div className="relative">
            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
            <Input
              type="text"
              placeholder="Driver License (e.g., MH0120190012345)"
              value={driverLicense}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setDriverLicense(value);
                validateField('driverLicense', value);
              }}
              className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${driverLicense && validation.driverLicense.isValid
                ? 'border-emerald-500'
                : driverLicense && !validation.driverLicense.isValid
                  ? 'border-red-500'
                  : 'border-gray-300'
                }`}
              required
            />
            {driverLicense && validation.driverLicense.message && (
              <div
                className={`absolute right-3 top-3.5 ${validation.driverLicense.isValid ? 'text-emerald-600' : 'text-red-600'
                  }`}
              >
                {validation.driverLicense.isValid ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
            )}
            {driverLicense && validation.driverLicense.message && (
              <p
                className={`text-xs mt-1 ${validation.driverLicense.isValid ? 'text-emerald-600' : 'text-red-600'
                  }`}
              >
                {validation.driverLicense.message}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehicle Name */}
            <div className="relative">
              <Car className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Vehicle Name (e.g., Innova Crysta)"
                value={vehicleName}
                onChange={(e) => {
                  setVehicleName(e.target.value);
                  validateField('vehicleName', e.target.value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${vehicleName && validation.vehicleName.isValid
                  ? 'border-emerald-500'
                  : vehicleName && !validation.vehicleName.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                required
              />
              {vehicleName && validation.vehicleName.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.vehicleName.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.vehicleName.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {vehicleName && validation.vehicleName.message && (
                <p
                  className={`text-xs mt-1 ${validation.vehicleName.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.vehicleName.message}
                </p>
              )}
            </div>

            {/* Vehicle Plate */}
            <div className="relative">
              <Hash className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Plate Number (e.g., MH12AB1234)"
                value={vehiclePlate}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setVehiclePlate(value);
                  validateField('vehiclePlate', value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${vehiclePlate && validation.vehiclePlate.isValid
                  ? 'border-emerald-500'
                  : vehiclePlate && !validation.vehiclePlate.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                required
              />
              {vehiclePlate && validation.vehiclePlate.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.vehiclePlate.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.vehiclePlate.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {vehiclePlate && validation.vehiclePlate.message && (
                <p
                  className={`text-xs mt-1 ${validation.vehiclePlate.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.vehiclePlate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Car Model */}
            <div className="relative">
              <Car className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Car Model (e.g., 2022)"
                value={carModel}
                onChange={(e) => {
                  setCarModel(e.target.value);
                  validateField('carModel', e.target.value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${carModel && validation.carModel.isValid
                  ? 'border-emerald-500'
                  : carModel && !validation.carModel.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                required
              />
              {carModel && validation.carModel.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.carModel.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.carModel.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {carModel && validation.carModel.message && (
                <p
                  className={`text-xs mt-1 ${validation.carModel.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.carModel.message}
                </p>
              )}
            </div>

            {/* Passenger Capacity */}
            <div className="relative">
              <Users className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="number"
                placeholder="Passenger Capacity"
                value={passengerCapacity}
                onChange={(e) => {
                  setPassengerCapacity(e.target.value);
                  validateField('passengerCapacity', e.target.value);
                }}
                className={`pl-12 h-12 rounded-xl border-2 bg-gray-50 ${passengerCapacity && validation.passengerCapacity.isValid
                  ? 'border-emerald-500'
                  : passengerCapacity && !validation.passengerCapacity.isValid
                    ? 'border-red-500'
                    : 'border-gray-300'
                  }`}
                min="1"
                max="50"
                required
              />
              {passengerCapacity && validation.passengerCapacity.message && (
                <div
                  className={`absolute right-3 top-3.5 ${validation.passengerCapacity.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.passengerCapacity.isValid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              )}
              {passengerCapacity && validation.passengerCapacity.message && (
                <p
                  className={`text-xs mt-1 ${validation.passengerCapacity.isValid ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {validation.passengerCapacity.message}
                </p>
              )}
            </div>
          </div>

          {/* Car Photo Upload */}
          <div className="space-y-3">
            <label className="block text-gray-700">Car Photo</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-all border-2 border-dashed border-gray-300 hover:border-emerald-500">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-gray-600">Upload Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <Button
                type="button"
                onClick={handleCameraCapture}
                className="flex items-center gap-2 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl"
              >
                <Camera className="w-5 h-5" />
                Camera
              </Button>
            </div>
            {carPhoto && (
              <div className="mt-4 relative">
                <img
                  src={carPhoto}
                  alt="Car preview"
                  className="w-full h-48 object-cover rounded-xl border-2 border-emerald-500"
                />
                <div className="absolute top-2 right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Photo uploaded
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl h-12 shadow-lg"
          >
            {editData ? 'Update Driver' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
}
