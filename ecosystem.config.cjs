module.exports = {
  apps: [
    {
      name: "ai-creation",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
