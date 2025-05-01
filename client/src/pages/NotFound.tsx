
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-bold mb-4 text-meeting-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-6">The page you're looking for doesn't exist</p>
          <Link 
            to="/" 
            className="px-6 py-3 bg-meeting-primary hover:bg-meeting-primary/90 text-white rounded-lg inline-flex items-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
