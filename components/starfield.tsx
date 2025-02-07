'use client';

import React from 'react';

export function Starfield() {
  return (
    <div className="starfield">
      {Array.from({ length: 50 }, (_, i) => (
        <React.Fragment key={i}>
          <span></span><span></span><span></span><span></span>
        </React.Fragment>
      ))}
    </div>
  );
} 