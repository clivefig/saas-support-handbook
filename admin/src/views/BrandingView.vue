<template>
  <div>
    <h1>Branding</h1>
    <div class="card" style="max-width: 640px">
      <p>
        Theme switching was removed from the admin UI so the public handbook stays fast. Customize
        colors, logo, and favicon <strong>in code</strong>.
      </p>
      <p class="muted">
        Follow the developer guide:
        <code>docs/setup/BRANDING.md</code>
      </p>
      <ul class="muted">
        <li>Title / description → <code>docs/.vitepress/config.ts</code></li>
        <li>Logo / favicon → <code>docs/public/logo.svg</code>, <code>favicon.svg</code></li>
        <li>Colors → <code>docs/.vitepress/theme/custom.css</code></li>
      </ul>
      <a
        class="btn btn-primary"
        href="https://github.com/clivefig/saas-support-handbook/blob/main/docs/setup/BRANDING.md"
        target="_blank"
        rel="noopener"
        >Open branding guide on GitHub</a
      >
      <p class="muted" style="margin-top: 1rem; font-size: 0.85rem">
        Branding is edited in the repo (not via admin). Use the guide above or
        <code>docs/setup/BRANDING.md</code> locally.
      </p>
    </div>
  </div>
</template>
