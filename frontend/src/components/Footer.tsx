import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Re:Interview. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;