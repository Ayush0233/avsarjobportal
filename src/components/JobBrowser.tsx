import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import './style.css'
export const JobBrowser = () => {
  const [open, setOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const navigate = useNavigate();

  const handleLocationSubmit = () => {
    if (searchLocation.trim()) {
      navigate(`/jobs?location=${encodeURIComponent(searchLocation.trim())}`);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full dashButton ">Browse Jobs</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Find Jobs Near You</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your city or location to browse available jobs:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your city or location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
            />
            <Button onClick={handleLocationSubmit} className='dashButton'>
              <Search className="h-4 w-4 " />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};