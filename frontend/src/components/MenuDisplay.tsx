import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import type { MenuStatus, MenuItem } from '../lib/api';

const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-stone shadow-sm p-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Content */}
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-xl font-semibold text-primary leading-tight">
              {item.item_text}
            </h3>
            {item.item_price && (
              <p className="text-lg font-medium text-accent mt-1">
                {item.item_price}
              </p>
            )}
          </div>
          
          {item.description && (
            <p className="text-charcoal/80 leading-relaxed">
              {item.description}
            </p>
          )}
          
          {item.estimated_calories && item.estimated_calories > 0 && (
            <div className="flex items-center text-sm text-charcoal/60">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>~{item.estimated_calories} calories</span>
            </div>
          )}
        </div>

        {/* Image Content */}
        <div className="relative flex justify-center md:justify-end">
          {item.generated_image_data ? (
            <>
              {imageError ? (
                <div className="w-48 h-48 bg-cream rounded-lg flex items-center justify-center">
                  <div className="text-center text-charcoal/60">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Image failed to load</p>
                  </div>
                </div>
              ) : imageLoaded ? (
                <img
                  src={`data:image/jpeg;base64,${item.generated_image_data}`}
                  alt={item.item_text}
                  className="w-48 h-48 object-cover rounded-lg bg-cream"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <>
                  <img
                    src={`data:image/jpeg;base64,${item.generated_image_data}`}
                    alt={item.item_text}
                    className="w-48 h-48 object-cover rounded-lg bg-cream opacity-0 absolute"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  <div className="w-48 h-48 bg-cream rounded-lg flex items-center justify-center">
                    <div className="text-center text-charcoal/60">
                      <div className="w-12 h-12 mx-auto mb-3 relative">
                        <div className="w-12 h-12 rounded-full border-4 border-stone/30"></div>
                        <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent absolute top-0 left-0 animate-spin"></div>
                      </div>
                      <p className="text-sm">Loading image...</p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-48 h-48 bg-cream rounded-lg flex items-center justify-center">
              <div className="text-center text-charcoal/60">
                <div className="w-12 h-12 mx-auto mb-3 relative">
                  <div className="w-12 h-12 rounded-full border-4 border-stone/30"></div>
                  <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent absolute top-0 left-0 animate-spin"></div>
                </div>
                <p className="text-sm">Generating image...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MenuDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [menuStatus, setMenuStatus] = useState<MenuStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMenuStatus = async () => {
      try {
        const status = await apiClient.getMenuStatus(id);
        setMenuStatus(status);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMenuStatus();

    // Poll for updates if menu is still processing
    const pollInterval = setInterval(() => {
      if (menuStatus?.status === 'PENDING' || menuStatus?.status === 'PROCESSING') {
        fetchMenuStatus();
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [id, menuStatus?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-accent/20 border-t-accent animate-spin mb-4"></div>
          <p className="text-charcoal/70">Loading your menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-primary mb-2">Oops!</h2>
          <p className="text-charcoal/70 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-stone">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-serif text-2xl font-bold text-primary">
              MenuGen
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {menuStatus?.status === 'FAILED' ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-primary mb-2">
              Processing Failed
            </h2>
            <p className="text-charcoal/70 mb-6">
              {menuStatus.error || 'We encountered an error while processing your menu.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Upload a New Menu
            </Link>
          </div>
        ) : (
          <>
            {/* Menu Items Grid */}
            {menuStatus?.items && menuStatus.items.length > 0 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="font-serif text-3xl font-bold text-primary mb-2">
                    Your Visual Menu
                  </h2>
                  <p className="text-charcoal/70">
                    {menuStatus.items.length} delicious items discovered
                  </p>
                </div>

                <div className="space-y-4">
                  {menuStatus.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-full bg-cream flex items-center justify-center mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                </div>
                <h3 className="font-serif text-xl font-semibold text-primary mb-2">
                  Processing Your Menu
                </h3>
                <p className="text-charcoal/70">
                  We're extracting menu items and generating images...
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MenuDisplay;
