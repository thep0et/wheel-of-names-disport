/**
 * Uplup Wheel GIF Generator
 * Generates animated spinning wheel GIFs for Discord
 */

import { createCanvas } from '@napi-rs/canvas';
import GIFEncoder from 'gif-encoder-2';

// Vibrant color palettes matching Uplup's theme
const COLOR_PALETTES = {
  vibrant: ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'],
  pastel: ['#FFB5E8', '#B5DEFF', '#BFFCC6', '#FFF5BA', '#FFCBC1', '#C4FAF8', '#E7FFAC', '#DCD3FF', '#FFC9DE', '#FFFFD1'],
  sunset: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF8C94', '#91EAE4', '#FFB6B9', '#FAF3DD'],
  ocean: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A', '#0096C7', '#48CAE4', '#ADE8F4', '#03045E', '#00B4D8'],
  uplup: ['#6C60D7', '#FC9E9E', '#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#00BCD4', '#E91E63', '#8BC34A', '#FF5722']
};

/**
 * Generate a spinning wheel GIF
 * @param {string[]} entries - Array of entry names
 * @param {object} options - Configuration options
 * @returns {Promise<Buffer>} - GIF buffer
 */
export async function generateWheelGIF(entries, options = {}) {
  const {
    width = 400,
    height = 400,
    duration = 3000, // Total animation duration in ms
    fps = 20,
    colorPalette = 'uplup',
    winner = null, // If specified, wheel will land on this entry
    spinRevolutions = 5 // Number of full rotations
  } = options;

  const colors = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.uplup;
  const totalFrames = Math.floor((duration / 1000) * fps);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const sliceAngle = (2 * Math.PI) / entries.length;

  // Determine final angle (where wheel stops)
  let winnerIndex = winner ? entries.indexOf(winner) : Math.floor(Math.random() * entries.length);
  if (winnerIndex === -1) winnerIndex = Math.floor(Math.random() * entries.length);

  // Calculate final rotation so winner is at the top (pointer position)
  // Pointer is at top (270 degrees or -PI/2), so we need the winner slice center there
  const winnerSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
  const targetAngle = (Math.PI * 1.5) - winnerSliceCenter; // Point to winner
  const totalRotation = (spinRevolutions * 2 * Math.PI) + targetAngle;

  // Create GIF encoder
  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(Math.floor(1000 / fps));
  encoder.setRepeat(-1); // No repeat (play once)
  encoder.start();

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Generate frames with easing (deceleration)
  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / (totalFrames - 1);

    // Easing function: cubic ease-out for natural deceleration
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentRotation = totalRotation * easedProgress;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'; // Dark background
    ctx.fillRect(0, 0, width, height);

    // Draw wheel
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);

    // Draw slices
    for (let i = 0; i < entries.length; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.min(16, Math.floor(400 / entries.length))}px Arial`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      // Truncate long names
      let displayName = entries[i];
      const maxLength = Math.floor(radius / 10);
      if (displayName.length > maxLength) {
        displayName = displayName.substring(0, maxLength - 2) + '..';
      }

      ctx.fillText(displayName, radius - 15, 5);
      ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#6C60D7'; // Uplup purple
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Draw pointer (at top)
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX - 15, 35);
    ctx.lineTo(centerX + 15, 35);
    ctx.closePath();
    ctx.fillStyle = '#FC9E9E'; // Uplup pink
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add frame to GIF
    encoder.addFrame(ctx);
  }

  // Add a few static frames at the end showing the winner
  for (let i = 0; i < fps; i++) {
    encoder.addFrame(ctx);
  }

  encoder.finish();

  // Return buffer
  return encoder.out.getData();
}

/**
 * Generate a static wheel image (PNG)
 * @param {string[]} entries - Array of entry names
 * @param {string} winner - The winning entry to highlight
 * @param {object} options - Configuration options
 * @returns {Promise<Buffer>} - PNG buffer
 */
export async function generateWheelImage(entries, winner, options = {}) {
  const {
    width = 400,
    height = 450,
    colorPalette = 'uplup'
  } = options;

  const colors = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.uplup;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const centerX = width / 2;
  const centerY = 200;
  const radius = 170;
  const sliceAngle = (2 * Math.PI) / entries.length;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  // Calculate rotation to show winner at top
  const winnerIndex = entries.indexOf(winner);
  const winnerSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
  const rotation = (Math.PI * 1.5) - winnerSliceCenter;

  // Draw wheel
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);

  for (let i = 0; i < entries.length; i++) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const isWinner = i === winnerIndex;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = isWinner ? '#FFD700' : '#ffffff';
    ctx.lineWidth = isWinner ? 4 : 2;
    ctx.stroke();

    // Draw text
    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(14, Math.floor(300 / entries.length))}px Arial`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;

    let displayName = entries[i];
    const maxLength = Math.floor(radius / 10);
    if (displayName.length > maxLength) {
      displayName = displayName.substring(0, maxLength - 2) + '..';
    }

    ctx.fillText(displayName, radius - 10, 5);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, 2 * Math.PI);
  ctx.fillStyle = '#6C60D7';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  // Pointer
  ctx.beginPath();
  ctx.moveTo(centerX, 15);
  ctx.lineTo(centerX - 12, 35);
  ctx.lineTo(centerX + 12, 35);
  ctx.closePath();
  ctx.fillStyle = '#FC9E9E';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Winner text at bottom
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 WINNER 🎉', centerX, height - 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(winner, centerX, height - 15);

  return canvas.toBuffer('image/png');
}

export { COLOR_PALETTES };