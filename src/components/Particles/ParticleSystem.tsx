import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create initial ambient particles
    const createAmbientParticles = () => {
      if (particlesRef.current.length < 50) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 0.5,
          life: 200,
          maxLife: 200,
          color: '#6c5ce7',
          size: Math.random() * 3 + 1,
          alpha: 0.3
        });
      }
    };

    const ambientInterval = setInterval(createAmbientParticles, 500);

    // Particle creation functions
    (window as any).createDiceExplosion = (dice1: number, dice2: number) => {
      const colors = ['#ff6b35', '#f9ca24', '#6c5ce7'];
      
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 80,
          maxLife: 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 6 + 3,
          alpha: 1
        });
      }
    };

    (window as any).createPurchaseEffect = () => {
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 12 - 5,
          life: 100,
          maxLife: 100,
          color: '#10b981',
          size: Math.random() * 4 + 2,
          alpha: 0.8
        });
      }
    };

    (window as any).createBonusEffect = () => {
      for (let i = 0; i < 40; i++) {
        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height / 4,
          vx: (Math.random() - 0.5) * 20,
          vy: Math.random() * 10 - 5,
          life: 120,
          maxLife: 120,
          color: '#fbbf24',
          size: Math.random() * 8 + 3,
          alpha: 1
        });
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and render particles
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // Gravity
        particle.life--;
        particle.alpha = (particle.life / particle.maxLife) * 0.8;

        // Render particle
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Remove dead particles
        return particle.life > 0 && particle.y < canvas.height + 100;
      });

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(ambientInterval);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      delete (window as any).createDiceExplosion;
      delete (window as any).createPurchaseEffect;
      delete (window as any).createBonusEffect;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-5 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

export default ParticleSystem;