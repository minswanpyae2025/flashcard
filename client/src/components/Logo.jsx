import React from 'react';

const Logo = ({ className }) => {
  const logoUrl = import.meta.env.VITE_LOGO_URL || '/logo.jpg';
  const brandName = import.meta.env.VITE_APP_NAME || 'Bright Meducation';

  return (
    <div className={`flex items-center ${className}`}>
      <img src={logoUrl} alt={brandName} className="h-12 w-auto mr-3 rounded-full" />
      <span className="font-bold text-xl">{brandName}</span>
    </div>
  );
};

export default Logo;
