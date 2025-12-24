# VidRead

**VidRead** is a powerful tool designed to let you "read" YouTube videos like articles. It extracts transcripts, provides translations, and generates AI-powered summaries, transforming the video consumption experience.

![VidRead Screenshot1](/docs/screenshot1.png)

![VidRead Screenshot2](/docs/screenshot2.png)

## Features

-   **Smart Video Reader**: Watch videos with synchronized transcripts.
-   **Transcripts & Translations**: High-quality transcripts provided by **Supadata**, with support for translations.
-   **Local-First Architecture**: Your data (playlists, keys) is stored locally in your browser using IndexedDB and LocalStorage.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
-   **State/Toast**: [Sonner](https://sonner.emilkowal.ski/)
-   **Data Storage**: IndexedDB (via custom wrapper)
-   **API Integrations**: 
    -   [Supadata](https://supadata.ai/) (Transcripts)
    -   [xAI](https://x.ai/) (Summarization)

## Getting Started

### Prerequisites

-   Node.js (LTS recommended)
-   pnpm (recommended), npm, or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/linchen1987/vidread.git
    cd vidread
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    # or
    npm install
    ```

3.  Run the development server:
    ```bash
    pnpm dev
    # or
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to use the application.

## Configuration

VidRead requires API keys to function fully. These keys are configured directly in the application UI and stored securely in your browser's LocalStorage.

1.  Click the **Settings** (gear icon) in the top-right corner.
2.  Enter your **Supadata API Key** for transcript services.
3.  Enter your **xAI API Key** for AI summarization features.
4.  The keys are saved automatically.

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## Author

- **Email**: link.lin.1987@gmail.com
- **Homepage**: [https://link1987.site](https://link1987.site)

## Acknowledgements

Special thanks to [LongCut.ai](https://www.longcut.ai)

## License

[MIT](LICENSE)
