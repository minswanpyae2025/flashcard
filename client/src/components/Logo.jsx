import React from 'react';

const Logo = ({ className }) => {
  const logoUrl = import.meta.env.VITE_LOGO_URL;
  const brandName = import.meta.env.VITE_APP_NAME || 'Secure Med App';

  if (logoUrl) {
    return <img src={logoUrl} alt={brandName} className={className} />;
  }

  return (
    <div className={`font-bold text-xl flex items-center ${className}`}>
      <span className="bg-indigo-600 text-white rounded px-2 py-1 mr-2">SM</span>
      <span>{brandName}</span>
    </div>
  );
};

export default Logo;
