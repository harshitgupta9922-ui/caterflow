// PM2 Ecosystem Config — keeps your server running 24/7
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name:        'caterflow-api',
      script:      'server.js',
      instances:   1,
      autorestart: true,
      watch:       false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT:     5000,
      },
    },
  ],
};
