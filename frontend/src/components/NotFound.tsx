import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-32 h-32 mx-auto mb-8 relative">
          {/* Animated 404 illustration */}
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-slow"></div>
          <div className="absolute inset-4 rounded-full bg-accent/20 animate-pulse"></div>
          <div className="absolute inset-8 rounded-full bg-primary/30 flex items-center justify-center">
            <span className="font-serif text-2xl font-bold text-primary">404</span>
          </div>
        </div>

        <h1 className="font-serif text-4xl font-bold text-primary mb-4">
          Menu Not Found
        </h1>
        
        <p className="text-charcoal/70 mb-8 text-lg">
          Looks like this menu got lost in the kitchen! Let's get you back to creating delicious visualizations.
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors text-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload New Menu
          </Link>
          
          <div className="text-sm text-charcoal/50">
            or head back to the kitchen
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
