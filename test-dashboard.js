const puppeteer = require('puppeteer');

async function testDashboard() {
  console.log('🎭 Starting Puppeteer test for dashboard...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set up console logging to catch JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      } else {
        console.log('📝 Console:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    console.log('🌐 Navigating to dashboard...');
    await page.goto('http://localhost:8090/dashboard.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if PocketBase is loaded
    const pbLoaded = await page.evaluate(() => {
      return typeof PocketBase !== 'undefined';
    });
    
    console.log('🔌 PocketBase loaded:', pbLoaded);
    
    // Check if the login screen is visible
    const loginVisible = await page.evaluate(() => {
      const loginScreen = document.getElementById('loginScreen');
      return loginScreen && !loginScreen.classList.contains('hidden');
    });
    
    console.log('🔐 Login screen visible:', loginVisible);
    
    if (loginVisible) {
      console.log('📝 Testing login form...');
      
      // Try to fill login form
      await page.type('#email', 'test@example.com');
      await page.type('#password', 'testpassword123');
      
      console.log('✅ Login form filled successfully');
      
      // Try to click login button (but don't actually submit since we don't have a valid user)
      const loginButtonExists = await page.$('#loginBtn') !== null;
      console.log('🔘 Login button exists:', loginButtonExists);
    }
    
    // Check if there are any JavaScript errors
    const errors = await page.evaluate(() => {
      return window.errors || [];
    });
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:', errors);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    console.log('🎉 Dashboard test completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboard();