# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Mobile responsiveness

This app is styled with Tailwind CSS (v4) and is mobile-first responsive:

- Navigation collapses into a hamburger menu on small screens.
- Tables in admin/faculty pages are wrapped in a horizontal scroller so columns remain accessible on phones.
- Headers and action bars stack on mobile to prevent buttons from overflowing the screen.
- Global base styles ensure images/videos shrink to fit and respect mobile safe areas.

If any section appears to overflow on a specific device, try reducing the viewport zoom or report the page so we can adjust its layout classes.
