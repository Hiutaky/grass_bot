# Node Grass Bot

Node Grass Bot is a Farming Bot for Grass.io Rewards that aim to mimic the Browser Extension functionality but on VPS without interface.

This Bot works both with and without proxies, uses just basic packages and uses low resources, making it perfect to be runned on any VPS.

## Install the dependecies

To install all the needed dependecies just run:

`npm i`

## Get the UserId

Go on the grass dashboard ( you must be logged-in ), open the developer console ( usually right-click > developer tools or inspect page ), go on the application tab then local storage.

![](assets/20241106_144954_get-user-id.png)

## How to use it

This bot comes with 2 main scripts:

- without Proxy
- with one or multiple proxy

### Without Proxy

Create a .env file in the root folder and add a USER_ID variable, paste your unique user id.

This is the only configuration you need to do in order to configurate the version without proxy, then run:

`npm start`

### With 1 or more Proxy

As before, create a .env file (you can check the .env.default) and place your USER_ID, to configure your proxies you need to add another variable named PROXIES. If you want to use more proxies, each proxy must be divided by a ;.

If you want to use just 1 proxy:

`socks5://user:password@ip:port` you can omit the ;

The proper format for multiple proxies is:

`socks5://user:password@ip:port;socks5://user2:password@ip2:port`

Once the .env file is fully configured you can run the script:

`npm run start:proxy`


## How to Run the Script after Closing the SSH Session

To avoid to stop the script once the SSH session is closed you can use `screen`.

If you don't have it install using: `sudo apt-get install screen`, before running any of our scripts create a new screen session with a custom name ( it'll be easier to recognize the session in a second moment ): `screen -S grass-bot`.

Now we've a new standalone screen session that will continue to executre our code even if we close the SSH session.

At this point you can run the Bot script you prefer and the script will continue to run.

To reattach the screen session when you reconnect via SSH you can use `screen -r [session-name] ` for example: `screen -r grass-bot`.

Have fun.
