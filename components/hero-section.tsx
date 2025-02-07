'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { PlusIcon } from './icons';
import { Button } from './ui/button';
import { SidebarUserNav } from './sidebar-user-nav';
import { AppSidebar } from './app-sidebar';
import { useSidebar } from './ui/sidebar';
import { ModelSelector } from './model-selector';
import { VisibilitySelector, VisibilityType } from './visibility-selector';
import { Starfield } from './starfield';
import { FloatingCards } from './floating-cards';
import { useAuth } from '@/app/contexts/AuthContext';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { usePrivy } from '@privy-io/react-auth';

export function HeroSection({ 
  id,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  children,
}: { 
  id: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const bottomSectionRef = useRef(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const { user } = useAuth();
  const { login } = usePrivy();

  // Only log when selectedModelId changes
  useEffect(() => {
    console.log('🎨 HeroSection: Rendering with model:', selectedModelId);
  }, [selectedModelId]);

  // Memoize the animation setup
  const setupAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (bottomSectionRef.current) {
      animationRef.current = gsap.to(bottomSectionRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power4.out",
        immediateRender: true,
        clearProps: "all"
      });
    }
  }, []);

  // Clear animations on user change
  useEffect(() => {
    setupAnimation();

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [user, setupAnimation]);

  // Set initial state only once
  useEffect(() => {
    if (bottomSectionRef.current) {
      gsap.set(bottomSectionRef.current, {
        y: 100,
        opacity: 0
      });
    }
  }, []);

  // Memoize the selectors section
  const selectorsSection = useMemo(() => {
    if (isReadonly) return null;
    
    return (
      <div className="flex gap-4">
        <ModelSelector
          selectedModelId={selectedModelId}
          className="text-xs"
        />
        <VisibilitySelector
          chatId={id}
          selectedVisibilityType={selectedVisibilityType}
        />
      </div>
    );
  }, [isReadonly, selectedModelId, id, selectedVisibilityType]);

  return (
    <div className="relative min-h-screen flex flex-col w-screen bg-[#0A050B]">
      {/* Background Starfield */}
      <div className="absolute inset-0 overflow-hidden">
        <Starfield />
      </div>

      {/* User Navigation */}
      <div className="absolute w-full top-6 z-40 max-[600px]:z-10">
        <div className="flex flex-row-reverse justify-between items-center mx-[5%]">
          {/* Selectors - Right Side (now left visually) */}
          <div className="flex items-center gap-4">
            {!isReadonly && selectorsSection}
            {user ? (
              <SidebarUserNav 
                selectedModelId={selectedModelId}
                selectedVisibilityType={selectedVisibilityType}
                chatId={id}
                isReadonly={isReadonly}
              />
            ) : (
              <div className="flex items-center">
                <button
                  onClick={login}
                  className="px-4 py-2 text-sm font-medium text-white bg-[rgba(33,13,62,0.30)] border border-[#3F1E3E] rounded-md hover:bg-[rgba(33,13,62,0.45)]"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Center Section with Credits and Logo */}
          <div className="flex items-center gap-4">
            {/* Logo and Title - Always visible */}
            <div className="flex items-center gap-2">
              <span className="text-white font-monument text-lg">Ask Soltar</span>
            </div>

            {/* Credits - Only visible above 950px */}
            <div className="hidden min-[950px]:flex h-[34px] items-center rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] text-white px-4">
              <span className="font-monument text-sm mr-2">CREDITS:</span>
              <span 
                className="font-monument text-lg bg-gradient-to-r from-[#E7B45A] via-[#FFE1AD] to-[#E7B45A] bg-clip-text text-transparent font-extrabold"
              >
                250
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AppSidebar at root level */}
      <AppSidebar />

      {/* Top Section with Crystal Ball */}
      <div className="relative pt-[64px] max-[1140px]:pt-[72px] flex flex-col items-center w-full">
        {/* Glowing Trapezoid Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1678px] h-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1678 1032" fill="none" preserveAspectRatio="xMidYMid meet">
            <g filter="url(#filter0_f_4_598)">
              <path d="M500.416 703L329 283H1351L1126.61 703H500.416Z" fill="#3B1C35"/>
              <path d="M500.416 703L329 283H1351L1126.61 703H500.416Z" stroke="white" strokeWidth="0.25"/>
            </g>
            <defs>
              <filter id="filter0_f_4_598" x="0.513977" y="-45.425" width="1678.99" height="1076.85" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="164.15" result="effect1_foregroundBlur_4_598"/>
              </filter>
            </defs>
          </svg>
        </div>

        <div className="relative w-[460px] h-[530px] max-[1140px]:w-[360px] max-[1140px]:h-[415px]">
          <div className="relative size-full">
            <Image 
              src="/images/crystal-ball.png" 
              alt="Crystal Ball"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 1140px) 360px, 460px"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div 
        ref={bottomSectionRef}
        className="relative w-full flex-1 min-h-[460px] z-20 overflow-visible flex justify-center max-[1140px]:mt-[-64px] max-[600px]:mt-[-380px]"
        key={user?.id}
      >
        <div className="relative w-[1366px] h-[384px] mx-[5%] max-w-full max-[1140px]:h-[584px]">
          {/* Main Background Container */}
          <div 
            className="absolute inset-0 rounded-[76px] max-[1140px]:rounded-[32px] border-4 max-[1140px]:border-2 border-[#E8B559]"
            style={{
              background: 'linear-gradient(180deg, #160A18 73%, #2A124C 73.2%, #2A124C 100%)'
            }}
          />

          {/* Speakers */}
          <div className="absolute left-8 bottom-7 max-[900px]:hidden">
            <div className="relative size-[108px]">
              <Image
                src="/images/speaker.svg"
                alt="Left Speaker"
                fill
                className="object-contain"
                loading="eager"
                sizes="108px"
              />
            </div>
          </div>
          <div className="absolute right-8 bottom-7 max-[900px]:hidden">
            <div className="relative size-[108px]">
              <Image
                src="/images/speaker.svg"
                alt="Right Speaker"
                fill
                className="object-contain"
                loading="eager"
                sizes="108px"
              />
            </div>
          </div>
          
          {/* Center Speaker for Mobile */}
          <div className="hidden max-[900px]:block absolute left-1/2 -translate-x-1/2 bottom-7 max-[900px]:bottom-[-54px]">
            <div className="relative size-[108px]">
              <Image
                src="/images/speaker.svg"
                alt="Center Speaker"
                fill
                className="object-contain"
                loading="eager"
                sizes="108px"
              />
            </div>
          </div>

          <div className="relative z-10 flex justify-center items-center max-[1140px]:items-start size-full">
            {/* Center - Chat Window */}
            <div className="w-[95%] max-[1140px]:w-full flex items-end pt-[74px] max-[1140px]:pt-[12px] pb-[38px]">
              {children}
            </div>
          </div>
        </div>
      </div>
     
      {/* Information Section 2 */}
      <section className="cards-section relative w-full h-[200vh]">
        <div className="sticky top-0 w-full h-screen bg-[#0A050B] overflow-hidden">
          <div className="size-full flex items-center justify-center">
            <FloatingCards />
          </div>
        </div>
      </section>

      {/* Information Section 1 */}
      <div className="w-full bg-[#1D0F2C] py-48">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-monument text-white mb-6">Unlock Your Inner Wisdom</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Experience a unique blend of ancient wisdom and cutting-edge AI technology. 
                Soltar guides you through personal growth and self-discovery with intuitive 
                conversations that adapt to your journey.
              </p>
            </div>
            <div className="rounded-[19.125px] border-[1.125px] border-[#3F1E3E] bg-[rgba(33,13,62,0.30)] p-8">
              <div className="aspect-square bg-gradient-to-b from-[#FFDFAE] to-[#7E4321] rounded-[19.125px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#1D0F2C] py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex justify-between items-center border-t border-[#3F1E3E] pt-8">
            <div className="text-white/60 text-sm">© 2024 Soltar. All rights reserved.</div>
            <div className="flex gap-8">
              <a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <DataStreamHandler id={id} />
    </div>
  );
} 