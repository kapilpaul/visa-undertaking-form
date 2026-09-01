# Visa Undertaking Form

A small React + Vite application that collects the applicant's information and generates an A4 PDF directly in the browser.

## Requirements

- Node.js 18+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

The PDF is generated client-side with jsPDF, so the form data is not sent to a backend.

## Notes

The stay duration is calculated inclusively. For example:

25/10/2026 to 30/11/2026 = 37 days.

The PDF follows the wording and structure of the supplied Visa Undertaking Form.
