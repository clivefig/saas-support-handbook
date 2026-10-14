<template>
  <div>
    <h1>Dashboard</h1>
    <p class="muted">
      Edit the public handbook. Saves write into the git content tree; Netlify rebuilds after each
      commit when deployed.
    </p>
    <div class="grid-2" style="margin-top: 1rem">
      <div class="card" data-tour="dash-branding">
        <h2>Branding</h2>
        <p class="muted">Done in code (logo, favicon, CSS) — see docs/setup/BRANDING.md.</p>
        <router-link class="btn btn-primary" to="/branding">How to brand</router-link>
      </div>
      <div class="card" data-tour="dash-articles">
        <h2>Articles</h2>
        <p class="muted">Browse and edit Markdown chapters with EasyMDE.</p>
        <router-link class="btn btn-primary" to="/articles">Open articles</router-link>
      </div>
      <div class="card" data-tour="dash-structure">
        <h2>Structure</h2>
        <p class="muted">Add sections and reorder sidebar / header nav.</p>
        <router-link class="btn btn-primary" to="/structure">Open structure</router-link>
      </div>
      <div class="card">
        <h2>Privacy</h2>
        <p class="muted">Editable privacy and disclaimer page (credits Shepherd.js).</p>
        <router-link class="btn btn-primary" to="/privacy">Edit privacy</router-link>
      </div>
    </div>
  </div>
</template>
