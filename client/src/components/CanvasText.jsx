import React, { useRef, useEffect } from 'react';

const CanvasText = ({ text, className = "", style = {} }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;

    const renderText = () => {
       // Get computed styles from the container to match font
       const computedStyle = window.getComputedStyle(container);
       const fontSize = parseInt(computedStyle.fontSize, 10) || 16;
       const fontFamily = computedStyle.fontFamily || 'sans-serif';
       const color = computedStyle.color || '#000000';
       const lineHeight = fontSize * 1.5;

       // Set canvas dimensions based on container width
       // We need to calculate height dynamically
       const maxWidth = container.clientWidth;

       // First pass: measure text to determine height
       ctx.font = `${fontSize}px ${fontFamily}`;
       ctx.fillStyle = color;

       const words = text.split(' ');
       let line = '';
       const lines = [];

       for(let n = 0; n < words.length; n++) {
         const testLine = line + words[n] + ' ';
         const metrics = ctx.measureText(testLine);
         const testWidth = metrics.width;
         if (testWidth > maxWidth && n > 0) {
           lines.push(line);
           line = words[n] + ' ';
         } else {
           line = testLine;
         }
       }
       lines.push(line);

       // Resize canvas
       canvas.width = maxWidth;
       canvas.height = lines.length * lineHeight + (lineHeight * 0.5); // Add some padding

       // Clear and redraw after resize
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       ctx.font = `${fontSize}px ${fontFamily}`;
       ctx.fillStyle = color;
       ctx.textBaseline = 'top';

       lines.forEach((l, i) => {
           ctx.fillText(l, 0, i * lineHeight);
       });
    };

    renderText();

    // Re-render on resize
    window.addEventListener('resize', renderText);
    return () => window.removeEventListener('resize', renderText);

  }, [text]);

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
};

export default CanvasText;
