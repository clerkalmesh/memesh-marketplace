import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

interface MatrixRainProps {
  intensity?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ intensity = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;

      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const fontSize = 14;
      const columns = canvas.width / fontSize;
      const drops = new Array(Math.floor(columns)).fill(1);

      const draw = () => {
        ctx.fillStyle = 'rgba(18, 18, 18, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff44aa';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      };

      const interval = setInterval(draw, 50);

      const handleResize = () => {
        canvas.width = Dimensions.get('window').width;
        canvas.height = Dimensions.get('window').height;
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearInterval(interval);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
      />
    );
  }

  // Fallback untuk native (efek sederhana)
  return (
    <View style={[StyleSheet.absoluteFill, styles.nativeFallback]}>
      <View style={[styles.overlay, { opacity: intensity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  nativeFallback: {
    backgroundColor: '#121212',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#ff44aa',
    opacity: 0.1,
  },
});

export default MatrixRain;