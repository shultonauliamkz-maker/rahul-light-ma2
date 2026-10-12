import localtunnel from 'localtunnel';

async function start() {
  console.log('Connecting to public tunnel server...');
  try {
    const tunnel = await localtunnel({
      port: 3000,
      subdomain: 'rahul-light-ma2'
    });

    console.log('==================================================================');
    console.log('  RAHUL LIGHT — MA2 FILE DOWNGRADER PUBLIC TUNNEL ONLINE');
    console.log(`  PUBLIC HTTPS URL: ${tunnel.url}`);
    console.log('==================================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    console.error('Failed to start tunnel:', err.message);
    console.log('Retrying with dynamic subdomain in 3s...');
    setTimeout(async () => {
      try {
        const tunnel = await localtunnel({ port: 3000 });
        console.log(`PUBLIC HTTPS URL: ${tunnel.url}`);
      } catch (e) {
        console.error('Retry failed:', e.message);
      }
    }, 3000);
  }
}

start();
