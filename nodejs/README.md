# CaterFlow Backend — Setup Guide (Hostinger Cloud)

## What you get
- Node.js + Express REST API
- MySQL database with full schema
- JWT authentication (8-hour sessions)
- All CRUD endpoints for clients, items, users, purchases

---

## Step 1 — Upload files to your server

Connect via SSH to your Hostinger server:
```
ssh your_user@your_server_ip
```

Create a folder and upload all backend files:
```bash
mkdir -p /var/www/caterflow-backend
cd /var/www/caterflow-backend
# Upload: server.js, package.json, schema.sql, ecosystem.config.js, .env
```

You can use FileZilla, WinSCP, or Hostinger's File Manager to upload.

---

## Step 2 — Create the MySQL database

In Hostinger dashboard → **Databases** → Create a new database:
- Database name: `caterflow`
- Note your DB username and password

Then import the schema via Hostinger's phpMyAdmin:
1. Open phpMyAdmin from Hostinger dashboard
2. Select the `caterflow` database
3. Click **Import** tab
4. Upload `schema.sql` → click Go

Or via SSH:
```bash
mysql -u your_db_user -p caterflow < schema.sql
```

---

## Step 3 — Configure environment

Copy the example env file and fill in your values:
```bash
cp .env.example .env
nano .env
```

Fill in:
```
DB_HOST=localhost
DB_USER=your_hostinger_db_user
DB_PASSWORD=your_hostinger_db_password
DB_NAME=caterflow
JWT_SECRET=paste_a_long_random_string_here
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 4 — Install dependencies and start

```bash
# Install Node packages
npm install

# Install PM2 globally (keeps server alive after restarts)
npm install -g pm2

# Start the API server
pm2 start ecosystem.config.js

# Save PM2 process list so it starts on reboot
pm2 save
pm2 startup
# Run the command PM2 prints out
```

Check it's running:
```bash
pm2 status
pm2 logs caterflow-api
```

Test the API:
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","time":"..."}
```

---

## Step 5 — Connect your React frontend

1. Copy `api.js` into your React app's `src/` folder
2. Create a `.env` file in your React project root:
   ```
   REACT_APP_API_URL=https://yourdomain.com/api
   ```
3. In your React app, replace the in-memory state calls with API calls.
   Example for login:
   ```js
   import { apiLogin, setToken, setUser } from './api';
   
   const handleLogin = async (username, password) => {
     const { token, user } = await apiLogin(username, password);
     setToken(token);
     setUser(user);
   };
   ```

---

## Step 6 — Point your domain to the API (Nginx)

If you're running both frontend and backend on the same server, set up Nginx:

```bash
sudo nano /etc/nginx/sites-available/caterflow
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # React frontend (build folder)
    location / {
        root /var/www/caterflow-frontend/build;
        try_files $uri /index.html;
    }

    # API proxy → Node.js on port 5000
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/caterflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Add SSL (free HTTPS):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | - | Login, returns JWT token |
| GET | /api/clients | any | List all clients |
| POST | /api/clients | admin | Add client |
| PUT | /api/clients/:id | admin | Edit client |
| DELETE | /api/clients/:id | admin | Delete client |
| GET | /api/items | any | List grocery items |
| POST | /api/items | admin | Add item |
| PUT | /api/items/:id | admin | Edit item |
| DELETE | /api/items/:id | admin | Delete item |
| GET | /api/users | admin | List users |
| POST | /api/users | admin | Add user |
| PUT | /api/users/:id | admin | Edit user |
| DELETE | /api/users/:id | admin | Delete user |
| GET | /api/purchases | any | List purchases (vendor sees own only) |
| POST | /api/purchases | any | Add purchase entry |
| PUT | /api/purchases/:id | admin | Edit purchase |
| DELETE | /api/purchases/:id | admin | Delete purchase |

---

## Default Login Credentials

After running schema.sql, these are the default accounts:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| vendor1 | vendor123 | Vendor (City Hospital) |
| vendor2 | vendor123 | Vendor (Green Valley) |
| vendor3 | vendor123 | Vendor (City Hospital) |
| vendor4 | vendor123 | Vendor (Metro Hospital) |
| vendor5 | vendor123 | Vendor (Green Valley) |
| vendor6 | vendor123 | Vendor (Metro Hospital) |

**Change all passwords immediately after setup!**
Use the Manage Users page in the admin panel.

---

## Troubleshooting

**API not responding?**
```bash
pm2 logs caterflow-api    # Check for errors
pm2 restart caterflow-api # Restart the server
```

**MySQL connection error?**
- Double check DB_USER, DB_PASSWORD, DB_NAME in .env
- Make sure the database exists: `mysql -u root -p -e "SHOW DATABASES;"`

**CORS error in browser?**
- Set FRONTEND_URL in .env to your exact domain (with https://)
- Restart PM2 after changing .env
