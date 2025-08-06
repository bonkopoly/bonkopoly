import React, { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

const AudioManager: React.FC = () => {
  const soundsRef = useRef<Map<string, Howl>>(new Map());
  const backgroundMusicRef = useRef<Howl>();

  useEffect(() => {
    // Initialize sounds
    const sounds = {
      diceRoll: new Howl({
        src: ['/sounds/dice-roll.mp3'],
        volume: 0.7,
        preload: true
      }),
      purchase: new Howl({
        src: ['/sounds/purchase.mp3'],
        volume: 0.8,
        preload: true
      }),
      payment: new Howl({
        src: ['/sounds/payment.mp3'],
        volume: 0.6,
        preload: true
      }),
      bonus: new Howl({
        src: ['/sounds/bonus.mp3'],
        volume: 0.9,
        preload: true
      }),
      error: new Howl({
        src: ['/sounds/error.mp3'],
        volume: 0.5,
        preload: true
      }),
      success: new Howl({
        src: ['/sounds/success.mp3'],
        volume: 0.7,
        preload: true
      })
    };

    // Store sounds in ref
    Object.entries(sounds).forEach(([name, sound]) => {
      soundsRef.current.set(name, sound);
    });

    // Background music
    backgroundMusicRef.current = new Howl({
      src: ['/sounds/background-music.mp3'],
      loop: true,
      volume: 0.2,
      preload: true
    });

    // Global audio manager
    (window as any).playSound = (soundName: string) => {
      const sound = soundsRef.current.get(soundName);
      if (sound) {
        sound.play();
      }
    };

    (window as any).playBackgroundMusic = () => {
      backgroundMusicRef.current?.play();
    };

    (window as any).stopBackgroundMusic = () => {
      backgroundMusicRef.current?.stop();
    };

    // Cleanup
    return () => {
      soundsRef.current.forEach(sound => sound.unload());
      backgroundMusicRef.current?.unload();
      delete (window as any).playSound;
      delete (window as any).playBackgroundMusic;
      delete (window as any).stopBackgroundMusic;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default AudioManager;
