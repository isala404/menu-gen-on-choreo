import React, { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const UploadZone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or JPEG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const response = await apiClient.uploadMenu(file);
      navigate(`/menus/${response.menu_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Bar with Logout */}
      <div className="flex justify-between items-center p-4">
        <div></div> {/* Spacer */}
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-gray-600 text-sm">Welcome, {user.email}</span>
          )}
          <button
            onClick={logout}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-6xl font-bold text-primary mb-4">
            MenuGen
          </h1>
          <p className="text-xl text-charcoal/80 font-medium">
            Transform your menu with AI-powered visualization
          </p>
          <p className="text-stone-600 mt-2">
            Upload a photo of your menu and watch it come to life
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
            ${isDragging 
              ? 'border-accent bg-accent/5 scale-105' 
              : 'border-stone hover:border-accent/50 hover:bg-accent/5'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-accent/20 border-t-accent animate-spin"></div>
              <h3 className="text-xl font-serif text-primary font-semibold">
                Uploading your menu...
              </h3>
              <p className="text-charcoal/70">
                This won't take long
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-accent" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-2xl font-serif text-primary font-semibold mb-2">
                  Upload Your Menu
                </h3>
                <p className="text-charcoal/80 mb-4">
                  Drag and drop your menu photo here, or{' '}
                  <span className="text-accent font-medium hover:text-accent/80 transition-colors">
                    click to browse
                  </span>
                </p>
                <p className="text-sm text-charcoal/60">
                  Supports PNG, JPG, JPEG (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Features Preview */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-serif font-semibold text-primary mb-2 group-hover:text-accent transition-colors">Lightning Fast</h4>
            <p className="text-sm text-charcoal/70">Get your visual menu in under 90 seconds</p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="font-serif font-semibold text-primary mb-2 group-hover:text-accent transition-colors">AI-Powered</h4>
            <p className="text-sm text-charcoal/70">Advanced AI creates perfect dish visualizations</p>
          </div>

          <div className="text-center group">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h4 className="font-serif font-semibold text-primary mb-2 group-hover:text-accent transition-colors">Made with Love</h4>
            <p className="text-sm text-charcoal/70">Designed for food lovers, by food lovers</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default UploadZone;
