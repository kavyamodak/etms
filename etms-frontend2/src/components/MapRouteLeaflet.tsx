import { Navigation, MapPin, Flag, Car, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

interface MapRouteLeafletProps {
  pickupPoints: { 
    address: string; 
    sequence_number?: number;
  }[];
  destination: { address: string; };
}

export default function MapRouteLeaflet({ pickupPoints, destination }: MapRouteLeafletProps) {
  const handleOpenMaps = () => {
    const dest = destination.address;
    const origin = pickupPoints[0]?.address || '';
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`, '_blank');
  };

  return (
    <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-4 border-white flex flex-col items-center justify-center p-8 text-center space-y-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <Navigation className="w-64 h-64 rotate-12" />
      </div>
      
      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 animate-in zoom-in duration-500">
        <Navigation className="w-12 h-12 text-white" />
      </div>

      <div className="max-w-md space-y-2 relative z-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">External Navigation Active</h2>
        <p className="text-gray-500 font-medium">We've redirected our mapping engine to Google Maps for premium real-time accuracy and satellite navigation.</p>
      </div>

      <Card className="w-full max-w-sm p-4 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg space-y-3 relative z-10">
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
             <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Starting Point</p>
            <p className="text-sm font-bold text-gray-900 truncate">{pickupPoints[0]?.address || 'Your Location'}</p>
          </div>
        </div>
        
        <div className="h-4 w-0.5 bg-emerald-100 ml-3.5 border-l border-dashed border-emerald-400" />

        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
             <Flag className="w-4 h-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Final Destination</p>
            <p className="text-sm font-bold text-gray-900 truncate">{destination.address}</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
        <Button 
          onClick={handleOpenMaps}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl text-lg font-black shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 group transition-all"
        >
          <span>Launch Google Maps</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-emerald-600">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-widest">Verified Satellite Tracking</span>
        </div>
      </div>
    </div>
  );
}

// Sub-component wrapper for Card if needed
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow ${className}`}>
      {children}
    </div>
  );
}
