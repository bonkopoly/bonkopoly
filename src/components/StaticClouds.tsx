import React, { memo } from 'react';

const StaticClouds: React.FC = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[10%] left-[15%] animate-cloud-float" style={{ animationDelay: '0s' }}>
        <div className="bg-white rounded-full opacity-30 w-20 h-10 relative">
          <div className="absolute bg-white rounded-full w-6 h-6 -top-3 left-2"></div>
          <div className="absolute bg-white rounded-full w-8 h-8 -top-4 right-3"></div>
        </div>
      </div>
      
      <div className="absolute top-[25%] right-[20%] animate-cloud-float" style={{ animationDelay: '2s' }}>
        <div className="bg-white rounded-full opacity-25 w-16 h-8 relative">
          <div className="absolute bg-white rounded-full w-5 h-5 -top-2 left-3"></div>
          <div className="absolute bg-white rounded-full w-6 h-6 -top-3 right-2"></div>
        </div>
      </div>
      
      <div className="absolute top-[45%] left-[25%] animate-cloud-float" style={{ animationDelay: '4s' }}>
        <div className="bg-white rounded-full opacity-20 w-24 h-12 relative">
          <div className="absolute bg-white rounded-full w-7 h-7 -top-3 left-4"></div>
          <div className="absolute bg-white rounded-full w-9 h-9 -top-5 right-4"></div>
        </div>
      </div>
      
      <div className="absolute top-[65%] right-[30%] animate-cloud-float" style={{ animationDelay: '6s' }}>
        <div className="bg-white rounded-full opacity-30 w-18 h-9 relative">
          <div className="absolute bg-white rounded-full w-6 h-6 -top-3 left-2"></div>
          <div className="absolute bg-white rounded-full w-7 h-7 -top-4 right-2"></div>
        </div>
      </div>
      
      <div className="absolute top-[80%] left-[10%] animate-cloud-float" style={{ animationDelay: '8s' }}>
        <div className="bg-white rounded-full opacity-25 w-22 h-11 relative">
          <div className="absolute bg-white rounded-full w-8 h-8 -top-4 left-3"></div>
          <div className="absolute bg-white rounded-full w-6 h-6 -top-3 right-4"></div>
        </div>
      </div>
      
      <div className="absolute top-[35%] left-[70%] animate-cloud-float" style={{ animationDelay: '10s' }}>
        <div className="bg-white rounded-full opacity-20 w-20 h-10 relative">
          <div className="absolute bg-white rounded-full w-7 h-7 -top-3 left-2"></div>
          <div className="absolute bg-white rounded-full w-8 h-8 -top-4 right-3"></div>
        </div>
      </div>
      
      <div className="absolute top-[55%] right-[15%] animate-cloud-float" style={{ animationDelay: '1s' }}>
        <div className="bg-white rounded-full opacity-25 w-16 h-8 relative">
          <div className="absolute bg-white rounded-full w-5 h-5 -top-2 left-2"></div>
          <div className="absolute bg-white rounded-full w-6 h-6 -top-3 right-3"></div>
        </div>
      </div>
      
      <div className="absolute top-[20%] left-[50%] animate-cloud-float" style={{ animationDelay: '5s' }}>
        <div className="bg-white rounded-full opacity-20 w-14 h-7 relative">
          <div className="absolute bg-white rounded-full w-4 h-4 -top-2 left-3"></div>
          <div className="absolute bg-white rounded-full w-5 h-5 -top-3 right-2"></div>
        </div>
      </div>
    </div>
  );
});

StaticClouds.displayName = 'StaticClouds';

export default StaticClouds;