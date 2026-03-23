module.exports = {
  apps: [
    {
      name: "kalkulator2026",
      script: ".next/standalone/server.js",
      cwd: "C:/xampp/htdocs/kalkulator2026",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "127.0.0.1",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      watch: false,
      ignore_watch: [".next", "node_modules", ".git"],
    },
  ],
};
