import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProviderSession } from '../../auth/provider-session';
import { LoyaltyStore } from '../../shared/loyalty.store';
import { LoyaltyCard } from '../../shared/loyalty.types';

@Component({
  selector: 'app-stamp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="stamp">
      <h2>Carimbar atendimento</h2>
      <p class="hint">Escaneie o QR Code do cliente com a câmera, ou cole o código manualmente.</p>

      @if (scannerSupported()) {
        <div class="scanner-block">
          @if (!scanning()) {
            <button class="scan-btn" (click)="startScan()">📷 Escanear QR Code com câmera</button>
          } @else {
            <video #videoEl autoplay playsinline muted class="video-preview"></video>
            <button class="ghost" (click)="stopScan()">Cancelar câmera</button>
          }
        </div>
      } @else {
        <p class="hint warn">
          ⚠️ Seu navegador não suporta scanner nativo. Use o campo abaixo manualmente
          (Chrome/Android funciona).
        </p>
      }

      <label>QR / código do cartão</label>
      <textarea
        rows="3"
        [(ngModel)]="rawInput"
        placeholder="Cole aqui o JSON do QR ou digite o cardId"
      ></textarea>

      <label>Nota / descrição do serviço (opcional)</label>
      <input type="text" [(ngModel)]="note" placeholder="Ex.: Corte + hidratação" />

      <div class="actions">
        <button class="primary" (click)="onStamp()" [disabled]="!rawInput.trim()">
          ✓ Carimbar selo
        </button>
        <button
          class="ghost"
          (click)="rawInput = ''; note = ''; result.set(undefined); error.set('')"
        >
          Limpar
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (result(); as r) {
        <div class="result" [class.complete]="isComplete(r)">
          <h3>
            {{ isComplete(r) ? '🏆 Cartão completo!' : '✓ Selo registrado' }}
          </h3>
          <p>
            Cliente: <strong>{{ customerName(r.customerId) }}</strong>
          </p>
          <p>
            Progresso: <strong>{{ stampedCount(r) }} / {{ r.ruleSize }}</strong>
          </p>
          @if (isComplete(r)) {
            <p>Libere o bônus do prestador para o cliente.</p>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .stamp {
        max-width: 560px;
        margin: 1rem auto;
        background: #2c2c2c;
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid #444;
      }
      h2 {
        color: #d4af37;
        margin-top: 0;
      }
      .hint {
        color: #b0b0b0;
        font-size: 0.85rem;
        margin-bottom: 1.5rem;
      }
      .hint.warn {
        color: #ffb347;
      }
      .scanner-block {
        margin-bottom: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .scan-btn {
        width: 100%;
        padding: 0.9rem;
        background: #d4af37;
        color: #2c2c2c;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
      }
      .video-preview {
        width: 100%;
        max-height: 320px;
        background: #000;
        border-radius: 8px;
        object-fit: cover;
      }
      label {
        display: block;
        margin: 1rem 0 0.35rem;
        font-size: 0.85rem;
        color: #b0b0b0;
      }
      textarea,
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.6rem;
        background: #1a1a1a;
        color: #f0f0f0;
        border: 1px solid #444;
        border-radius: 6px;
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
      }
      button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
      }
      .primary {
        background: #d4af37;
        color: #2c2c2c;
      }
      .primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .ghost {
        background: transparent;
        color: #b0b0b0;
        border: 1px solid #444;
      }
      .error {
        color: #ff6b6b;
        margin-top: 1rem;
      }
      .result {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 8px;
        background: #1a1a1a;
        border-left: 4px solid #d4af37;
      }
      .result.complete {
        border-left-color: #9acd32;
        background: rgba(154, 205, 50, 0.08);
      }
      .result h3 {
        margin-top: 0;
        color: #d4af37;
      }
      .result.complete h3 {
        color: #9acd32;
      }
      .result p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class StampComponent implements OnDestroy {
  private readonly store = inject(LoyaltyStore);
  private readonly session = inject(ProviderSession);
  private readonly router = inject(Router);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  rawInput = '';
  note = '';
  result = signal<LoyaltyCard | undefined>(undefined);
  error = signal('');
  scanning = signal(false);
  scannerSupported = signal(typeof window !== 'undefined' && 'BarcodeDetector' in window);

  private stream?: MediaStream;
  private rafId?: number;

  constructor() {
    if (!this.session.isAuthenticated()) this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.stopScan();
  }

  async startScan(): Promise<void> {
    this.error.set('');
    if (!this.scannerSupported()) return;
    try {
      this.scanning.set(true);
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      // Aguarda Angular renderizar o <video>
      setTimeout(() => this.attachStreamAndDetect(), 50);
    } catch (e: unknown) {
      this.scanning.set(false);
      this.error.set('Não foi possível acessar a câmera. Verifique permissões do navegador.');
    }
  }

  stopScan(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = undefined;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.scanning.set(false);
  }

  private async attachStreamAndDetect(): Promise<void> {
    const video = this.videoEl?.nativeElement;
    if (!video || !this.stream) return;
    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code'] });
    const tick = async () => {
      if (!this.scanning()) return;
      try {
        const results = await detector.detect(video);
        if (results && results.length > 0 && results[0].rawValue) {
          this.rawInput = results[0].rawValue;
          this.stopScan();
          this.onStamp();
          return;
        }
      } catch {
        // ignora frames inviáveis
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  onStamp(): void {
    this.error.set('');
    this.result.set(undefined);
    const provider = this.session.current();
    if (!provider) {
      this.error.set('Sessão expirada. Faça login novamente.');
      return;
    }

    const cardId = this.resolveCardId(this.rawInput.trim(), provider.id);
    if (!cardId) {
      this.error.set('QR/código inválido. Cole o JSON do QR ou um cardId válido.');
      return;
    }

    const card = this.store.getCard(cardId);
    if (!card) {
      this.error.set(`Cartão "${cardId}" não encontrado neste banco local.`);
      return;
    }
    if (card.providerId !== provider.id) {
      this.error.set(`Este cartão pertence a outro prestador (${card.providerId}).`);
      return;
    }

    try {
      const updated = this.store.addStamp(cardId, this.note || undefined);
      this.result.set(updated);
      this.note = '';
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * Resolve o cardId a partir do conteúdo escaneado:
   *  - QR v2 (customer): descobre/cria o cartão ativo do cliente NESTE prestador
   *  - QR v1 (card): usa o cardId embutido
   *  - String "card-..." crua: aceita direto
   *  - String "cust-..." crua: trata como customerId v2
   */
  private resolveCardId(input: string, providerId: string): string | null {
    if (!input) return null;
    const parsed = this.store.parseQrPayload(input);
    if (parsed) {
      if (parsed.v === 1) return parsed.cardId;
      if (parsed.v === 2) {
        const card = this.store.ensureCard(parsed.customerId, providerId);
        return card.id;
      }
    }
    if (input.startsWith('card-')) return input;
    if (input.startsWith('cust-')) {
      const card = this.store.ensureCard(input, providerId);
      return card.id;
    }
    return null;
  }

  isComplete(c: LoyaltyCard): boolean {
    return !!c.completedAt;
  }
  stampedCount(c: LoyaltyCard): number {
    return c.stamps.filter((s) => s.stamped).length;
  }
  customerName(id: string): string {
    return this.store.getCustomer(id)?.name ?? id;
  }
}
