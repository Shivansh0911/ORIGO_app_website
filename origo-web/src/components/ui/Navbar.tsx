import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/about', label: 'About' },
    { path: '/download', label: 'Download' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-card/95 backdrop-blur-md border-b border-border' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg font-poppins">O</span>
          </div>
          <span className="text-white font-poppins font-bold text-xl">Origo</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/download" className="bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors">
            Download App
          </Link>
        </div>

        <button className="md:hidden text-text-secondary" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-card border-t border-border px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium py-2 ${location.pathname === link.path ? 'text-primary' : 'text-text-secondary'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/download" className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full text-center mt-2" onClick={() => setMenuOpen(false)}>
            Download App
          </Link>
        </div>
      )}
    </nav>
  );
}
