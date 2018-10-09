# [sluhhackclub.com](https://sluhhackclub.com)

The official website of the SLUH Hack Club

Created by Daniel Blittschau

Copyright (c) 2018 - present SLUH Hack Club

All rights reserved.

## Instructions for Deploying on Debian-like Machines

`server.js` creates a HTTP server listening on the `HOST` and `PORT` specified in `.env`\
It is recommended that it be proxied via nginx or similar with HTTPS.\
Node 8 or newer is recommended.

1. Run `sudo git clone https://github.com/sluh-hackclub/sluhhackclub.com.git /opt/sluhhackclub.com`

2. Install tmux with `sudo apt install tmux -y` and create a session with `tmux`

3. Go to the directory with `cd /opt/sluhhackclub.com`

4. Run `cp .env.example .env` and populate .env with your configuration

5. Run `node server.js`

6. Exit from tmux (Ctrl-B, D)

7. Install nginx with `sudo apt install nginx -y`

8. Create config with `sudo cp /opt/sluhhackclub/.nginxconfig.example /etc/nginx/sites-available/sluhhackclub.conf`

9. Install SSL Certificates

  * Install the fullchain certificate to `/etc/ssl/certs/sluhhackclub.com.cert.pem`

  * Install the private key to `/etc/ssl/private/sluhhackclub.com.key`

  * Change permissions of the private key with `sudo chmod 400 /etc/ssl/private/sluhhackclub.com.key`

10. Start nginx with `sudo systemctl enable nginx && sudo systemctl start nginx`
