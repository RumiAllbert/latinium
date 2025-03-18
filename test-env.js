/**
 * Test script to verify environment variables are loaded correctly
 * Run with: node test-env.js
 */

const fs = require('fs');
const path = require('path');

// Try to read directly from .env file
function readEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    console.log(`Looking for .env file at: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      console.log(`✅ .env file exists at ${envPath}`);
      
      const content = fs.readFileSync(envPath, 'utf8');
      console.log(`File content length: ${content.length} characters`);
      
      // Look for the API key
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        const apiKey = match[1].trim();
        const firstChars = apiKey.substring(0, 4);
        const lastChars = apiKey.substring(apiKey.length - 4);
        console.log(`✅ API key found: ${firstChars}...${lastChars} (${apiKey.length} chars)`);
        return apiKey;
      } else {
        console.log(`❌ No API key found in the .env file content`);
        console.log(`File content (first 50 chars):`);
        console.log(content.substring(0, 50));
      }
    } else {
      console.log(`❌ .env file NOT found at ${envPath}`);
    }
  } catch (error) {
    console.error('Error reading .env file:', error);
  }
  return null;
}

// Try alternative locations
function findEnvFile() {
  const possibleLocations = [
    '.env',
    'src/.env',
    '../.env',
    './.env'
  ];
  
  console.log('Searching for .env file in alternative locations:');
  
  for (const location of possibleLocations) {
    const fullPath = path.join(process.cwd(), location);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Found at: ${fullPath}`);
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`  Content length: ${content.length} chars`);
        return fullPath;
      } catch (e) {
        console.log(`  Error reading: ${e.message}`);
      }
    } else {
      console.log(`❌ Not found at: ${fullPath}`);
    }
  }
  
  return null;
}

// Main function
function main() {
  console.log('=======================================');
  console.log('ENVIRONMENT VARIABLE TEST');
  console.log('=======================================');
  console.log(`Current working directory: ${process.cwd()}`);
  
  // Read from .env file
  const apiKey = readEnvFile();
  
  // Look in alternative locations if not found
  if (!apiKey) {
    console.log('\nTrying alternative locations:');
    findEnvFile();
  }
  
  console.log('\n=======================================');
}

main(); 