import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function FloatingCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMobileRef = useRef<boolean>(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Check if we're on mobile
    isMobileRef.current = window.innerWidth <= 1040;
    const cards = cardRefs.current.filter(Boolean);

    // Kill any existing animations
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    cards.forEach(card => gsap.killTweensOf(card));

    if (isMobileRef.current) {
      // Mobile Animation Setup
      const mainCard = cards[0];
      if (!mainCard) return;

      // Hide other cards
      cards.slice(1).forEach(card => {
        if (card) gsap.set(card, { display: 'none' });
      });

      // Set up main card
      gsap.set(mainCard, {
        xPercent: -50,
        yPercent: -50,
        left: "50%",
        top: "50%",
        rotation: 0,
        scale: 0.95,
      });

      // Add floating animation
      gsap.to(mainCard, {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Create the scroll-triggered animation for mobile
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".cards-section",
          start: "top center",
          end: "center center",
          scrub: 1,
          markers: false,
        }
      });

      const frontEl = mainCard.querySelector('.flip-card-front');
      const backEl = mainCard.querySelector('.flip-card-back');

      tl.to(mainCard, {
        scale: 1,
        duration: 0.3,
      })
      .to(frontEl, {
        rotateY: -180,
        duration: 0.5,
        ease: "power2.inOut",
      })
      .to(backEl, {
        rotateY: 0,
        duration: 0.5,
        ease: "power2.inOut",
      }, '<');

    } else {
      // Desktop Animation (existing code)
      const containerWidth = containerRef.current.offsetWidth;
      const cardWidth = 255;
      const cardSpacing = 60;
      
      // Rest of your existing desktop animation code...
      const centerPoint = containerWidth / 2;
      const totalCards = cards.length;
      
      const positions = cards.map((_, index) => {
        const relativePosition = index - (totalCards - 1) / 2;
        const x = centerPoint + (relativePosition * (cardWidth + cardSpacing));
        return (x / containerWidth) * 100;
      });

      const fanOutPositions = [40, 45, 55, 60];
      const fanRotations = [-20, -10, 10, 20];

      // Show all cards for desktop
      cards.forEach((card, index) => {
        if (!card) return;
        gsap.set(card, {
          display: 'block',
          xPercent: -50,
          yPercent: -50,
          left: "50%",
          top: "50%",
          rotation: 0,
          scale: 0.95,
          zIndex: cards.length - index,
        });

        gsap.to(card, {
          y: -15,
          duration: 2 + Math.random() * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: Math.random(),
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".cards-section",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          markers: false,
        }
      });

      // Your existing desktop animation phases...
      cards.forEach((card, index) => {
        if (!card) return;
        tl.to(card, {
          left: `${fanOutPositions[index]}%`,
          rotation: fanRotations[index],
          scale: 1,
          ease: "power2.inOut",
          duration: 0.5,
        }, 0);
      });

      cards.forEach((card, index) => {
        if (!card) return;
        tl.to(card, {
          left: `${positions[index]}%`,
          rotation: 0,
          ease: "power2.inOut",
          duration: 0.5,
        }, 0.5);
      });

      cards.forEach((card, index) => {
        if (!card) return;
        const frontEl = card.querySelector('.flip-card-front');
        const backEl = card.querySelector('.flip-card-back');

        tl.to(frontEl, {
          rotateY: -180,
          ease: "power2.inOut",
          duration: 0.3,
        }, 1 + (index * 0.1));

        tl.to(backEl, {
          rotateY: 0,
          ease: "power2.inOut",
          duration: 0.3,
        }, '<');
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="relative size-full flex items-center justify-center mx-auto" ref={containerRef}>
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          ref={(el: HTMLDivElement | null) => {
            if (el) cardRefs.current[index] = el;
          }}
          className="card absolute"
          id={`card-${index + 1}`}
          style={{
            width: '255px',
            height: '388px',
            perspective: '1000px',
          }}
        >
          <div className="flip-card-inner">
            <div 
              className="flip-card-front absolute size-full rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-cover bg-center"
              style={{
                backfaceVisibility: 'hidden',
                backgroundImage: 'url(/images/tarot-card.png)',
                boxShadow: '0 8px 32px rgba(231,180,90,0.1)',
              }}
            />
            <div 
              className="flip-card-back absolute size-full rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-cover bg-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: 'rgba(50,50,50,0.3)',
                boxShadow: '0 8px 32px rgba(231,180,90,0.1)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
} 