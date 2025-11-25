# GitHub Roaster 🔥

A fun, frontend-only React application that roasts your GitHub profile based on your public stats and repositories. It also provides constructive feedback to help you improve!

## Features

- **🔥 Roast Generator**: Deterministic, funny roasts based on your bio, followers, repos, and languages.
- **✨ Constructive Feedback**: Helpful tips to improve your profile visibility and quality.
- **📊 Profile Stats**: Visual breakdown of your top languages and key metrics.
- **🎨 Modern UI**: Built with TailwindCSS, featuring a dark theme and smooth animations with Framer Motion.
- **⚡ Fast & Lightweight**: Powered by Vite, no backend required.

## Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **API**: GitHub REST API

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd github-roaster
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## Rate Limiting

This app uses the public GitHub API. Unauthenticated requests are limited to 60 per hour. If you hit the limit, you'll see an error message asking you to try again later.

## License

MIT
