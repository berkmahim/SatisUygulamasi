import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/Tadu_gold_Logo.png';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logoImage} 
                alt="Tadu Logo" 
                className="h-16 w-auto"
              />
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Ana Sayfa
            </Link>
            <Link
              to="/customers"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Müşteriler
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
