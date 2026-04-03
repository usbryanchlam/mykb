module.exports = {
  apps: [
    {
      name: 'mykb-api',
      cwd: '/opt/mykb/apps/api',
      script: './build/bin/server.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
        HOST: '127.0.0.1',
      },
    },
    {
      name: 'mykb-web',
      cwd: '/opt/mykb/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
}
