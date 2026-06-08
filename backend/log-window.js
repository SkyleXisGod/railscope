import net from 'net';
import chalk from 'chalk';

const server = net.createServer((socket) => {
    const tag = chalk.bgMagenta.white(' FEEDLOG ');
    
    socket.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${tag} ${line}`);
            }
        });
    });
});

server.listen(9123, () => {
    console.clear();
    console.log(chalk.cyan("🪵  Isolated RailScope HTTP Log Window Active..."));
    console.log(chalk.gray("Waiting for backend connections on port 9123...\n"));
});