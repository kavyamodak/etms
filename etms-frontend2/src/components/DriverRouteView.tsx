import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export default function DriverRouteView() {
  const navigate = useNavigate();

  const passengers = [
    { id: 1, name: 'John Doe', pickup: '123 Main St', time: '08:30 AM', phone: '+1 234-567-8901', status: 'Picked Up' },
    { id: 2, name: 'Sarah Smith', pickup: '456 Oak Ave', time: '08:35 AM', phone: '+1 234-567-8902', status: 'Picked Up' },
    { id: 3, name: 'Mike Johnson', pickup: '789 Pine Rd', time: '08:42 AM', phone: '+1 234-567-8903', status: 'Pending' },
    { id: 4, name: 'Emily Davis', pickup: '321 Elm St', time: '08:48 AM', phone: '+1 234-567-8904', status: 'Pending' },
    { id: 5, name: 'Robert Brown', pickup: '654 Maple Dr', time: '08:55 AM', phone: '+1 234-567-8905', status: 'Pending' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/driver')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-gray-900 mb-2">Route A - Downtown Express</h1>
          <p className="text-gray-600">Detailed view of your assigned route and passengers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl border-none shadow-xl">
              <h3 className="text-white mb-4">Route Summary</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-blue-100">Total Stops</p>
                    <p className="text-white">8 locations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-blue-100">Estimated Duration</p>
                    <p className="text-white">45 minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-blue-100">Total Passengers</p>
                    <p className="text-white">12 employees</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white rounded-2xl border-none">
              <h3 className="text-gray-900 mb-4">Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Pickups Completed</span>
                    <span className="text-gray-900">2/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/driver/map')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                >
                  View Route Map
                </Button>
              </div>
            </Card>
          </div>

          {/* Passenger List */}
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-2xl overflow-hidden border-none">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-gray-900">Passenger Pickup List</h2>
                <p className="text-gray-600">In order of pickup sequence</p>
              </div>
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Passenger Name</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passengers.map((passenger) => (
                      <TableRow key={passenger.id}>
                        <TableCell className="text-gray-900">{passenger.name}</TableCell>
                        <TableCell className="text-gray-600">{passenger.pickup}</TableCell>
                        <TableCell className="text-gray-600">{passenger.time}</TableCell>
                        <TableCell className="text-gray-600">{passenger.phone}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full inline-block ${
                              passenger.status === 'Picked Up'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {passenger.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {passenger.status === 'Pending' && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Picked
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <Button className="bg-green-500 hover:bg-green-600 text-white h-12">
                Start Trip
              </Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl">
                Contact Support
              </Button>
              <Button variant="outline" className="h-12">
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}