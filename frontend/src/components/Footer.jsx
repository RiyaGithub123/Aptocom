import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p className="footer-text">
            © {currentYear} <span className="footer-brand">AptoCom</span>. All rights reserved.
          </p>
        </div>
        
        <div className="footer-right">
          <p className="footer-text">
            Powered by <span className="footer-highlight">Aptos Blockchain</span> & <span className="footer-highlight">AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
