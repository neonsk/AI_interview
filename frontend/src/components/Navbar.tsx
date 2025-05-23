import React from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import serviceLogo from '../assets/service_logo.jpg';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <div className="h-14 flex items-center bg-white rounded" style={{ boxShadow: '0 0 0 0', background: '#fff', paddingTop: '4px', paddingBottom: '4px' }}>
              <img src={serviceLogo} alt="サービスロゴ" className="h-11 w-auto object-contain" style={{ background: '#fff' }} />
            </div>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
