/* The only setting you need to change.
   Paste the address of your Cloudflare Worker here (see README.md), for example:
   WORKER_URL: 'https://frmm-yahoo.your-name.workers.dev'
   Leave it empty and the site runs on clearly labelled demo data. */
window.FRMM = window.FRMM || {};
window.FRMM.CONFIG = {
  WORKER_URL: 'https://mmfryahoo.fahd-f-rehman.workers.dev',
  REFRESH_SECONDS: 60
};
