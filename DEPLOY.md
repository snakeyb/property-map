# Deploying Property Map to Ubuntu Server

## Prerequisites

- Ubuntu 20.04+ server
- Node.js 18 or 20 (LTS)
- npm

### Install Node.js on Ubuntu

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Deployment Steps

### 1. Copy project files to your server

Transfer the entire project folder to your server. You can use `scp`, `rsync`, or download from Replit.

```bash
# Example with rsync:
rsync -avz --exclude node_modules --exclude .git ./ user@yourserver:/var/www/property-map/
```

### 2. Install dependencies on the server

```bash
cd /var/www/property-map
npm install --production=false
```

### 3. Set environment variables

Create a `.env` file or export these variables:

```bash
export ESPOCRM_API_KEY="your-api-key-here"
export PORT=5000
export NODE_ENV=production
```

Or create a `.env` file:

```
ESPOCRM_API_KEY=your-api-key-here
PORT=5000
NODE_ENV=production
```

### 4. Build for production

```bash
npm run build
```

This creates a `dist/` folder with:
- `dist/index.cjs` - The bundled server
- `dist/public/` - The built frontend assets

### 5. Start the application

```bash
npm start
```

The app will be available at `http://your-server-ip:5000`

## Running as a Service (Recommended)

### Using systemd

Create a service file:

```bash
sudo nano /etc/systemd/system/property-map.service
```

Add this content:

```ini
[Unit]
Description=Property Map Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/property-map
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=ESPOCRM_API_KEY=your-api-key-here
ExecStart=/usr/bin/node dist/index.cjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable property-map
sudo systemctl start property-map
sudo systemctl status property-map
```

### Using PM2 (Alternative)

```bash
sudo npm install -g pm2

# Start the app
cd /var/www/property-map
ESPOCRM_API_KEY="your-api-key" PORT=5000 pm2 start dist/index.cjs --name property-map

# Save and auto-start on reboot
pm2 save
pm2 startup
```

## Reverse Proxy with Nginx (Optional)

To serve on port 80/443:

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/property-map
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/property-map /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Files to Transfer

The essential files/folders needed on your server:

```
package.json
package-lock.json
dist/              (after building)
node_modules/      (after npm install, or install on server)
```

If you want to build on the server instead, also transfer:
```
client/
server/
shared/
script/
vite.config.ts
tailwind.config.ts
tsconfig.json
postcss.config.js
components.json
drizzle.config.ts
```
