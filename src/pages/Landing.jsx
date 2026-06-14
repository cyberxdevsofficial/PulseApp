import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Radio, Shield, Globe, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <MessageSquare className="text-blue-400" />, title: 'Real-time Chats', desc: 'Instant messaging with end-to-end feel and premium glass UI.' },
    { icon: <Users className="text-purple-400" />, title: 'Dynamic Groups', desc: 'Create and manage communities with advanced admin controls.' },
    { icon: <Radio className="text-green-400" />, title: 'Broadcasting', desc: 'Launch channels to reach thousands of followers instantly.' },
    { icon: <Shield className="text-red-400" />, title: 'Secure & Private', desc: 'Your data is stored in serverless Cloudflare Workers and Firebase.' },
    { icon: <Globe className="text-yellow-400" />, title: 'Global Reach', desc: 'Connect with anyone, anywhere, with high-speed serverless hosting.' },
    { icon: <Zap className="text-cyan-400" />, title: 'Ultra Fast', desc: 'Powered by Cloudflare Edge for the lowest latency possible.' },
  ];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', overflowX: 'hidden', overflowY: 'auto' }}>
      {/* Hero Section */}
      <section style={{ padding: '8rem 2rem 4rem', textAlign: 'center', position: 'relative' }}>
        <div className="animate-float" style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'var(--primary-glow)', filter: 'blur(100px)', zIndex: -1 }}></div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: '1.5rem' }}>
            Next Gen <span className="gradient-text">Social Platform</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-dim)', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
            Experience Sannasa—the ultimate social media ecosystem for chats, groups, and channels. Built on serverless architecture for the modern web.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Get Started <ArrowRight size={20} />
            </button>
            <button onClick={() => navigate('/login')} className="glass" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }}>
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>Everything you need</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: '2.5rem' }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-dim)', lineHeight: '1.5' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div className="glass" style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem', borderRadius: '32px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Verified & Trusted</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Join thousands of creators and developers who choose Sannasa for their community.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} className="text-blue-500" /> <span>Meta-style Verification</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} className="text-blue-500" /> <span>Cloudflare Edge Serving</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={24} className="text-blue-500" /> <span>GitHub DB Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', marginTop: '4rem' }}>
        <p style={{ color: 'var(--text-dim)' }}>© 2026 Sannasa Social Platform. Built with ❤️ for the future.</p>
      </footer>
    </div>
  );
};

export default Landing;
