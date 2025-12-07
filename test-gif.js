/**
 * Test script for wheel GIF generation
 * Run: npm run test-gif
 */

import { generateWheelGIF, generateWheelImage, COLOR_PALETTES } from './wheel-generator.js';
import { writeFileSync } from 'fs';

async function test() {
  console.log('🎡 Testing Uplup Wheel GIF Generator\n');

  const entries = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const winner = 'Charlie';

  console.log('Test entries:', entries);
  console.log('Predetermined winner:', winner);
  console.log('');

  // Test uplup palette first
  console.log(`Generating uplup wheel...`);
  const startTime = Date.now();

  const gifBuffer = await generateWheelGIF(entries, {
    winner,
    colorPalette: 'uplup',
    duration: 3000,
    fps: 15,
    spinRevolutions: 3
  });

  const filename = `test-wheel-uplup.gif`;
  writeFileSync(filename, gifBuffer);

  const elapsed = Date.now() - startTime;
  console.log(`  ✅ Saved to ${filename} (${(gifBuffer.length / 1024).toFixed(1)}KB, ${elapsed}ms)\n`);

  // Test static image
  console.log('Generating static image...');
  const imageBuffer = await generateWheelImage(entries, winner, { colorPalette: 'uplup' });
  writeFileSync('test-wheel-static.png', imageBuffer);
  console.log(`  ✅ Saved to test-wheel-static.png (${(imageBuffer.length / 1024).toFixed(1)}KB)\n`);

  console.log('🎉 All tests passed!');
  console.log('\nOpen test-wheel-uplup.gif to see the animated wheel spin!');
}

test().catch(console.error);