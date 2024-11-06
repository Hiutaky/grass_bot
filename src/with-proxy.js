import { SocksProxyAgent } from "socks-proxy-agent";
import { v3 as uuidv3, v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import env from 'dotenv'

env.config();
/**
 * CONFIGS
 */
const userId = process.env.USER_ID;
const proxyList = process.env.PROXIES.split(';');

console.log('UserId', userId)
console.log('Proxy', proxyList)
/**
 * DEFAULTS
 */
const customHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
};
const uri = "wss://proxy.wynd.network:4650/";
const intervalDuration = 20000;
const intervalLoopsPerDeviceId = {};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

async function connectToWss(socks5Proxy, deviceId = uuidv3(socks5Proxy, uuidv3.DNS)) {
    console.log(`Device ID ${deviceId}`);

    //configuring WS Socks5 Agent
    const agent = new SocksProxyAgent(socks5Proxy);

    let websocket = false;

    const assignWebsocket = async () => {
        console.log('Try Connect Websocket');
        try {
            return new WebSocket(
                uri,
                {
                    agent,
                    headers: customHeaders
                }
            );
    
        } catch (e) {
            //wait 5 seconds and try to reconnect
            console.log('WS Error, try Connect in 5 Sec');
            await sleep(5000);
            return await assignWebsocket();
        }
    };

    websocket = await assignWebsocket()

    

    const sendPing = () => {
        const sendMessage = JSON.stringify({
            id: uuidv4(),
            version: "2.5.0",
            action: "PING",
            data: {}
        });
        console.debug(`Send: ${sendMessage}`);
        websocket.send(sendMessage);
    };

    const handleError = (reason) => {
        console.log('Connection terminated, reason: ', reason)
        //clear current ping interval
        if( intervalLoopsPerDeviceId[deviceId] )
            clearInterval(
                intervalLoopsPerDeviceId[deviceId]
            );
        websocket.terminate();
        //try reconnecting with same device id and proxy
        connectToWss(
            socks5Proxy,
            deviceId
        );
    }

    websocket.on('error', (error) => {
        console.log('Socket Error', error);
        handleError('Error Connecting');
    })

    try {
        websocket.on('open', () => {
            console.log('Socket Open', deviceId);
    
            intervalLoopsPerDeviceId[deviceId] = setInterval(() => {
                sendPing();
            }, intervalDuration);
    
            //handle message from the server
            websocket.on('message', (data) => {
                const message = JSON.parse(data);
    
                //handle authentication
                if( message.action === "AUTH") {
                    const authResponse = {
                        id: message.id,
                        origin_action: "AUTH",
                        result: {
                            browser_id: deviceId,
                            user_id: userId,
                            user_agent: customHeaders['User-Agent'],
                            timestamp: Math.floor(Date.now() / 1000),
                            device_type: "extension",
                            version: "2.5.0"
                        }
                    };
                    console.debug(`Auth Response: ${JSON.stringify(authResponse)}`);
                    websocket.send(JSON.stringify(authResponse));
                }
    
                if( message.action === "PONG") {
                    const pongResponse = {
                        id: message.id,
                        origin_action: "PONG"
                    };
                    console.debug(`Pong Response: ${JSON.stringify(pongResponse)}`);
                    websocket.send(JSON.stringify(pongResponse));
                }
            });
    
            //handle socket error 
            websocket.on('error', () => {
                console.error(`WebSocket Error: ${error}`);
                console.error(`Proxy: ${socks5Proxy}`);
    
                handleError('Error');
            });
    
            //handle socket connection closed
            websocket.on('close', () => {
                console.info('WebSocket closed, attempting reconnection...');
                handleError('Close')
            });
        });
    } catch ( e ) {
        handleError('Throw')
    }
};


function startWithProxy() {
    if( ! proxyList.length )
        throw "Please add at least a proxy in the .env file.";
    if( ! userId )
        throw "Please provide a valid UserId in the .env file.";

    proxyList.map(
        proxy => connectToWss(
            proxy
        )
    )
}

startWithProxy();