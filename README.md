# Alexander Parayno — Portfolio

Personal portfolio website for Alexander Parayno, a full-stack software developer based in Metro Manila, Philippines. It presents selected professional work, technical contributions and experience, with paths for employment opportunities and project inquiries.

## What’s inside

- **Portfolio** (`/`): introduction, selected work, technologies and professional background.
- **Project inquiries** (`/projects/`): project services, related work and an email contact brief.
- **Primis case study** (`/work/primis/`): payroll rate history, attendance corrections and payment collection, including an interactive effective-date example.
- **CinePop case study** (`/work/cinepop/`): mobile account access, service integrations and protected video playback.
- **Résumé** (`/resume/`): selected experience with a print-friendly layout for saving as PDF.

## Built with

Astro, TypeScript and CSS. The site generates static pages, uses email links for contact and includes Playwright browser tests with axe accessibility checks.

## Run locally

Use Node.js **24.15.0** (see [.nvmrc](.nvmrc)) and install the locked dependencies:

```sh
nvm use
npm ci
npm run dev -- --host 127.0.0.1 --background
```

Manage the background server with `npx astro dev status`, `npx astro dev logs` and `npx astro dev stop`.

## Build and test

```sh
npm run build
npm run test:e2e
```

The build runs Astro’s type and template checks before generating `dist/`. Browser tests require Playwright’s browser binaries and a current build; the test server uses port **4323**.

To preview the production build:

```sh
npm run preview -- --host 127.0.0.1 --port 4321 --ignore-lock
```

## Update the portfolio

- [src/data/portfolio.ts](src/data/portfolio.ts): profile details and project summaries.
- [src/pages/](src/pages/): portfolio, project inquiries, case studies and résumé.
- [src/components/](src/components/): shared project displays and the interactive example.
- [src/styles/global.css](src/styles/global.css): shared styling and responsive layouts.
- [public/](public/): static assets.

## Deployment and development notes

A GitHub Actions workflow is included for GitHub Pages. It builds and publishes `dist/`, with `SITE_URL` and `BASE_PATH` supplied for the deployment URL.


