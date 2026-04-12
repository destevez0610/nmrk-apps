import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardList } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Maverick Payments</h1>
        <p className="text-sm text-muted-foreground">Merchant Application Portal</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => navigate('/pre-app')}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-sm"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/applications')}
            className="btn-secondary flex items-center gap-2 px-6 py-3 text-sm"
          >
            <ClipboardList className="w-4 h-4" /> View Applications
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
