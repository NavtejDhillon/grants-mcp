module.exports = {
  apps: [
    {
      name: 'grants-mcp',
      script: 'dist/server.js',
      cwd: '/opt/grants-mcp',
      // dotenv/config is preloaded so the env file can live outside the deploy
      // directory; the in-code import then finds nothing to override.
      // --experimental-websocket: supabase-js needs a global WebSocket, which
      // Node 20 only provides behind this flag. Drop it once the server runs
      // Node 22 or later.
      node_args: '--experimental-websocket -r dotenv/config',
      env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/etc/grants-mcp/.env' },
      autorestart: true,
      max_memory_restart: '256M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
