
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or you may not have permission to view it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link to="/" className="flex items-center gap-2">
              <HomeIcon size={16} />
              Return to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="#" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
