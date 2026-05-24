import { gateway } from './src/server/api/gateway/index.ts';

async function run() {
  try {
    console.log('🧠 Testing Sponsor Gateway...');

    const list = await gateway.sponsor.listSponsors();
    console.log('📦 Sponsors:', list);

    console.log('✅ Gateway OS working');
  } catch (err) {
    console.error('❌ Gateway error:', err);
  }
}

run();
