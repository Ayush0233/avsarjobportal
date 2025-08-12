import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UserDashboard } from '@/components/UserDashboard';
import { Briefcase, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-gray-100">
      <div className="container mx-auto px-4 pt-8  ">
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button> */}
          <div className="flex  items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Job Portal</h1>
          </div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        <UserDashboard />
      </div>
    </div>
  );
}