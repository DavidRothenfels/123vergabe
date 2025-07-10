module.exports = {
  apps: [
    {
      name: 'opencode-service',
      script: './opencode-service.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './pb_logs/opencode-error.log',
      out_file: './pb_logs/opencode-out.log',
      log_file: './pb_logs/opencode-combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_delay: 5000
    }
  ]
};