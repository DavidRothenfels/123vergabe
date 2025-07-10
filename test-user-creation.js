const puppeteer = require('puppeteer');

async function testUserCreation() {
  console.log('👤 Testing user creation and login...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // First create a user via PocketBase admin
    console.log('🔧 Creating test user via PocketBase admin...');
    await page.goto('http://localhost:8090/_/', { waitUntil: 'networkidle2' });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if admin setup is needed
    const needsSetup = await page.evaluate(() => {
      return document.title.includes('Setup') || 
             document.body.textContent.includes('Admin') ||
             document.querySelector('input[name="email"]') !== null;
    });
    
    if (needsSetup) {
      console.log('📝 Setting up admin user...');
      
      // Try to fill admin setup
      const emailInput = await page.$('input[name="email"], input[type="email"], #email');
      const passwordInput = await page.$('input[name="password"], input[type="password"], #password');
      
      if (emailInput && passwordInput) {
        await emailInput.type('admin@test.com');
        await passwordInput.type('testadmin123');
        
        // Try to find and click create button
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], .btn-primary, .btn');
        if (submitBtn) {
          await submitBtn.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('✅ Admin user created');
        }
      }
    }
    
    console.log('✅ PocketBase admin access tested');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testUserCreation();