import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallButton || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-fade-up">
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-foreground">App installieren</p>
          <p className="text-sm text-muted-foreground">Füge OneAnime zu deinem Homescreen hinzu</p>
        </div>
        <Button 
          onClick={handleInstallClick}
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Installieren
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
