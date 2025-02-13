import React, { useEffect } from 'react';

const ParticlesComponent = () => {
  useEffect(() => {
    // Fonction d'initialisation des particules
    const loadParticles = () => {
      if (window.particlesJS) {
        window.particlesJS('particles-js', {
          particles: {
            number: {
              value: 50, // nombre réduit pour moins de charge
              density: {
                enable: true,
                value_area: 800, // densité ajustée
              },
            },
            color: {
              value: ['#6366f1', '#8b5cf6', '#d946ef', '#60a5fa', '#34d399'],
            },
            shape: {
              type: ['circle', 'triangle', 'star'],
              stroke: {
                width: 0.5, // trait plus fin pour alléger
                color: 'rgba(255, 255, 255, 0.1)',
              },
              polygon: {
                nb_sides: 5,
              },
            },
            opacity: {
              value: 0.5,
              random: true,
              anim: {
                enable: true,
                speed: 0.2, // animation plus douce
                opacity_min: 0.1,
                sync: false,
              },
            },
            size: {
              value: 3, // particules légèrement plus petites
              random: true,
              anim: {
                enable: true,
                speed: 0.5, // animation de taille ralentie
                size_min: 0.5,
                sync: false,
              },
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: '#a855f7',
              opacity: 0.15, // opacité réduite pour moins de surcharges graphiques
              width: 1,
            },
            move: {
              enable: true,
              speed: 1, // vitesse de déplacement réduite
              direction: 'none',
              random: true,
              straight: false,
              out_mode: 'bounce',
              bounce: true,
              attract: {
                enable: false, // désactivation de l'attraction pour économiser des ressources
              },
            },
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: {
                enable: true,
                mode: 'grab', // utilisation d'un seul mode d'interaction
              },
              onclick: {
                enable: true,
                mode: 'push',
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 200,
                line_linked: {
                  opacity: 0.4,
                },
              },
              push: {
                particles_nb: 4,
              },
            },
          },
          retina_detect: true,
        });
      }
    };

    // Vérifie si le script particles.js est déjà chargé
    if (!document.getElementById('particles-js-script')) {
      const script = document.createElement('script');
      script.id = 'particles-js-script';
      script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
      script.async = true;
      script.onload = loadParticles;
      document.body.appendChild(script);
    } else {
      // Le script est déjà présent, on initialise directement les particules
      loadParticles();
    }

    // Cleanup : on peut nettoyer le contenu du conteneur des particules,
    // mais il n'existe pas de méthode "destroy" native dans particles.js
    return () => {
      const particlesContainer = document.getElementById('particles-js');
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      id="particles-js" 
      style={{
        background: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParticlesComponent;
