import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { JobPostingForm } from '@/components/JobPostingForm';
import { JobBrowser } from '@/components/JobBrowser';
import { Briefcase, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import "./index.css"
import  applyBtn from "../images/applybtn2.png"
import  jobVacancy from "../images/jobVacancy.png"
import it from "../images/it.png"
import finance from '../images/finance.png'
import marketing from '../images/marketing.png'
import house from '../images/house.png'
import healthcare from '../images/healthcare.png'
import transport from '../images/transport.png'
const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You have been signed out successfully.",
        });
        // Navigate to auth page after successful sign out
        navigate('/auth');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ">
      <header className="">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Avsar</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground text-black">Welcome, {user.email}</span>
                <Link to="/dashboard">
                  <button className="w-full dashButton">Go to Dashboard</button>
                </Link>
                <Button onClick={handleSignOut} className='singout hover:text-white' variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className='dashButton'>Sign In</Button>
              </Link>
            )}
          </div>  
        </div>
      </header>
      
      <main className=" mx-auto">
        <div className='page1'>
            <h1>Find Jobs Near You</h1>
            <p>Search for jobs in your area and apply with just a few clicks.</p>
            <ul className='sectorList'>
              <li>
                <img src={finance} alt="" />
                <h3>Finance</h3>
              </li>
              <li>
                <img src={marketing} alt="" />
                <h3>Marketing</h3>
              </li>
              <li>
                <img src={it} alt="" />
                <h3>Technical</h3>
              </li>
              <li>
                <img src={house} alt="" />
                <h3>Household</h3>
              </li>
              <li>
                <img src={healthcare} alt="" />
                <h3>Healthcare</h3>
              </li>
              <li>
                <img src={transport} alt="" />
                <h3>Transportaion</h3>
              </li>
            </ul>
            {/* <img src={applyBtn} className='applyBtn' alt="" /> */}
            <img src={jobVacancy} className='jobVacancy' alt="" />

        </div>   
        {user ? (
          <div className="text-center signednUI features pb-10">
            <h2 className="text-3xl font-bold mb-4">Welcome to Your Job Portal</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Find your dream job or post opportunities for others
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl  mx-auto">
              <div className="p-6 border rounded-lg jobcards bg-gray-100">
                <h3 className="text-lg font-semibold mb-2">Find Jobs</h3>
                <p className="text-muted-foreground mb-4">Browse and apply for available positions</p>
                <JobBrowser />
              </div>
              <div className="p-6 border rounded-lg jobcards bg-gray-100">
                <h3 className="text-lg font-semibold mb-2">Post a Job</h3>
                <p className="text-muted-foreground mb-4">Share job opportunities with job seekers</p>
                <JobPostingForm />
              </div>
              
            </div>
          </div>
        ) : (
          <div className="text-center SignedOutInterface">
            {/* <h2 className="text-4xl font-bold mb-4">Find Your Dream Job</h2> */}
            <p className="text-xl text-muted-foreground mb-4">
              Connect with opportunities and talented professionals
            </p>
            <Link to="/auth">
              <Button size="lg" className='dashButton'>Get Started</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
