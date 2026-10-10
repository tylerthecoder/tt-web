export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

/** One ordered writer per mounted note session. Keep the newest edit while a request is in flight. */
export class NoteAutosave {
  private pending: string | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<boolean> | undefined;
  private listeners = new Set<() => void>();
  status: SaveStatus = 'saved';
  content: string | undefined;
  recoveryAvailable = true;

  constructor(
    private save: (content: string) => Promise<void>,
    private persist: (content: string | null) => void,
    private delay = 750,
  ) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  private store(content: string | null) {
    try {
      this.persist(content);
      this.recoveryAvailable = true;
    } catch {
      this.recoveryAvailable = false;
    }
  }

  update = (content: string) => {
    this.content = this.pending = content;
    this.store(content);
    this.status = this.running ? 'saving' : 'pending';
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.delay);
    this.notify();
  };

  flush = (): Promise<boolean> => {
    clearTimeout(this.timer);
    if (this.running) return this.running;
    if (this.pending === undefined) return Promise.resolve(true);
    // Defer the loop one microtask so running is set even if save throws synchronously.
    this.running = Promise.resolve()
      .then(async () => {
        while (this.pending !== undefined) {
          const content = this.pending;
          this.pending = undefined;
          this.status = 'saving';
          this.notify();
          try {
            await this.save(content);
          } catch {
            // Never let a failed older request overwrite newer typing.
            if (this.pending === undefined) this.pending = content;
            this.status = 'error';
            this.notify();
            return false;
          }
        }
        this.store(null);
        this.status = 'saved';
        this.notify();
        return true;
      })
      .finally(() => {
        this.running = undefined;
      });
    return this.running;
  };
}
