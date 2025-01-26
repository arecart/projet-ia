import React, { useEffect } from 'react';

const ParticlesComponent = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.async = true;
    script.onload = () => {
      window.particlesJS('particles-js', {
        particles: {
          number: { value: 50, density: { enable: true, value_area: 1000 } },
          color: { value: '#ffffff' },
          shape: { type: 'circle' },
          opacity: { value: 0.3, random: false },
          size: { value: 2, random: true },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.2,
            width: 1
          },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false,
          }
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: false },
            resize: true
          },
          modes: {
            repulse: {
              distance: 100,
              duration: 0.4
            }
          }
        },
        retina_detect: true
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="particles-js" className="particles"></div>;
};

export default ParticlesComponent;