import net from 'net';

const client = new net.Socket();
client.connect(30000, '127.0.0.1', () => {
  console.log('Connected to grandMA2 onPC Telnet!');
});

client.on('data', (data) => {
  const str = data.toString('utf-8');
  console.log('MA2 RESPONSE:\n', str);
  if (str.includes('Please login') || str.includes('login:')) {
    client.write('administrator\r\nadmin\r\n');
  }
});

client.on('error', (err) => {
  console.error('Telnet Error:', err.message);
});

setTimeout(() => {
  console.log('Closing telnet...');
  client.destroy();
}, 4000);
