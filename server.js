const WebSocket = require('ws');
const os = require('os');
const si = require('systeminformation');

const getNetworkTrafficData = async () => {
    const interfaces = os.networkInterfaces();
    const stats = await si.networkStats();

    return Object.keys(interfaces).map(interfaceName => {
        const networkInterface = interfaces[interfaceName].find(i => !i.internal && i.mac !== '00:00:00:00:00:00');
        if (networkInterface) {
            const stat = stats.find(s => s.iface === interfaceName);
            if (stat) {
                return {
                    name: interfaceName,
                    ip: networkInterface.address,
                    mac: networkInterface.mac,
                    inbound: stat.rx_bytes,
                    outbound: stat.tx_bytes
                };
            }
        }
        return null;
    }).filter(i => i !== null);
};

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    console.log('Client connected');

    const sendNetworkTrafficData = async () => {
        try {
            const networkTrafficData = await getNetworkTrafficData();
            console.log(networkTrafficData);
            ws.send(JSON.stringify(networkTrafficData));
        } catch (error) {
            console.error('Error fetching network traffic data:', error);
        }
    };

    // Send network traffic data every 10 seconds
    const interval = setInterval(sendNetworkTrafficData, 500);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
