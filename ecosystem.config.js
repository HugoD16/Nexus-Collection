module.exports = {
  apps: [
    {
      name: 'nexus',
      script: 'npm',
      args: 'start -- -p 3001',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        // Remplace par ta vraie clé (garde les guillemets)
        GEMINI_API_KEY: "AIzaSyDz0Ss6J-l5e2hw2GS_QvA19Bpwcr2928A" 
      },
    },
  ],
};
