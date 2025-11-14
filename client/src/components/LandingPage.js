import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Animated Background Elements */}
        <div className="background-elements">
          <div className="leaf leaf-1"></div>
          <div className="leaf leaf-2"></div>
          <div className="leaf leaf-3"></div>
          <div className="leaf leaf-4"></div>
        </div>

        {/* Hero Section */}
        <header className="landing-header">
          <div className="logo">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="30" r="28" stroke="#fff" strokeWidth="2" fill="rgba(255,255,255,0.1)"/>
              <path d="M30 10 L30 50 M10 30 L50 30" stroke="#fff" strokeWidth="2"/>
              <circle cx="30" cy="30" r="8" fill="#fff"/>
            </svg>
            <span className="logo-text">CarbonVision</span>
          </div>
        </header>

        <main className="landing-main">
          <div className="hero-content">
            <h1 className="hero-title">
              Track Your <span className="highlight">Carbon Footprint</span>
              <br />
              Make a <span className="highlight">Real Impact</span>
            </h1>
            <p className="hero-subtitle">
              Understand your environmental impact with our comprehensive carbon footprint calculator.
              Track your daily activities, visualize your emissions, and discover ways to offset your carbon footprint.
            </p>
            
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-number">2.4T</div>
                <div className="stat-label">Avg CO₂ per person</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50%</div>
                <div className="stat-label">Reduction possible</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100K+</div>
                <div className="stat-label">Users tracking</div>
              </div>
            </div>

            <button className="cta-button" onClick={handleGetStarted}>
              <span>Calculate Your Footprint</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="hero-visual">
            <div className="carbon-circle">
              <div className="circle-inner">
                <div className="circle-text">CO₂</div>
                <div className="circle-subtext">Track & Reduce</div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚗</div>
              <h3>Track Commute</h3>
              <p>Calculate emissions from your daily travel - cars, buses, trains, and flights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Monitor Energy</h3>
              <p>Track electricity consumption and understand your home's carbon impact</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Food Impact</h3>
              <p>See how your dietary choices affect your carbon footprint</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Visualize Data</h3>
              <p>Beautiful charts showing your daily and weekly emission trends</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Offset Options</h3>
              <p>Discover verified carbon offset projects to neutralize your impact</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Set Goals</h3>
              <p>Track your progress and work towards a carbon-neutral lifestyle</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of people taking action for a sustainable future</p>
            <button className="cta-button-secondary" onClick={handleGetStarted}>
              Get Started Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>Powered by Climatiq API & Gold Standard</p>
          <p className="footer-small">© 2024 CarbonVision. Making sustainability accessible.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;

