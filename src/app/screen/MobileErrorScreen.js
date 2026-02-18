'use client';

import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import errorAnimation from '../lottie/Error.json';

export default function MobileErrorScreen() {
  const lottieContainer = useRef(null);

  useEffect(() => {
    if (lottieContainer.current) {
      const animation = lottie.loadAnimation({
        container: lottieContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: errorAnimation,
      });

      return () => animation.destroy();
    }
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div 
        ref={lottieContainer}
        style={{
          width: '200px',
          height: '200px',
          marginBottom: '30px',
        }}
      />
      <p style={{
        fontSize: '18px',
        fontWeight: '500',
        color: '#1F2429',
        textAlign: 'center',
        lineHeight: '1.6',
        maxWidth: '90%',
        fontFamily: 'var(--font-roboto), Roboto, sans-serif',
      }}>
        Our Turing Test requires a larger screen for the best experience. Please switch to a laptop or desktop to continue.
      </p>
    </div>
  );
}
