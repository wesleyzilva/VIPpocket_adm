import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="topbar">
      <h1>VIPpocket <span class="badge">ADM</span></h1>
      <nav>
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/stamp">Carimbar</a>
        <a routerLink="/login">Sair</a>
      </nav>
    </header>
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #1a1a1a;
        color: #f0f0f0;
        font-family: 'Roboto', system-ui, sans-serif;
      }
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #2c2c2c;
        border-bottom: 2px solid #d4af37;
      }
      .topbar h1 {
        margin: 0;
        font-size: 1.2rem;
        color: #d4af37;
        letter-spacing: 1px;
      }
      .badge {
        font-size: 0.7rem;
        background: #d4af37;
        color: #2c2c2c;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
      }
      nav {
        display: flex;
        gap: 1rem;
      }
      nav a {
        color: #f0f0f0;
        text-decoration: none;
        font-size: 0.9rem;
        padding: 6px 10px;
        border-radius: 6px;
        transition: background 0.2s;
      }
      nav a:hover {
        background: rgba(212, 175, 55, 0.2);
      }
      .content {
        padding: 1.5rem;
        max-width: 900px;
        margin: 0 auto;
      }
    `,
  ],
})
export class App {}
