module.exports = {
    apps: [
      {
        name: "webgpu-api", 
        script: "node_modules/next/dist/bin/next", 
        args: "start", 
        exec_mode: "cluster", 
        instances: "max", 
        autorestart: true, 
        watch: false, 
        max_memory_restart: "1G", 
        env: {
          NODE_ENV: "production",
          PORT: 3000 
        }
      }
    ]
  };
  