import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg font-poppins">O</span>
              </div>
              <span className="text-white font-poppins font-bold text-xl">Origo</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Smart socialising for campus life. Meet students who share your interests, not just your college.
            </p>
            <div className="flex gap-4 mt-6">
              {['T', 'I', 'L'].map((s, i) => (
                <button key={i} className="w-9 h-9 rounded-full bg-muted border border-border text-text-muted hover:text-white hover:border-primary transition-colors flex items-center justify-center text-xs font-semibold">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-poppins">Product</h4>
            <div className="flex flex-col gap-2">
              <Link to="/features" className="text-text-secondary text-sm hover:text-white transition-colors">Features</Link>
              <Link to="/download" className="text-text-secondary text-sm hover:text-white transition-colors">Download</Link>
              <a href="#premium" className="text-text-secondary text-sm hover:text-white transition-colors">Premium</a>
              <a href="#communities" className="text-text-secondary text-sm hover:text-white transition-colors">Communities</a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-poppins">Company</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-text-secondary text-sm hover:text-white transition-colors">About</Link>
              <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-text-secondary text-sm hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">© 2025 Origo Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="text-text-muted text-sm">Made with ❤️ for Indian campuses</p>
        </div>
      </div>
    </footer>
  );
}
