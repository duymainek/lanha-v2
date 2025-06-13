import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { SiZalo } from 'react-icons/si';

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader>
          <DialogTitle>Liên hệ với Là Nhà</DialogTitle>
          <DialogDescription>
            Chọn một phương thức liên hệ bên dưới:
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button
            asChild
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-base flex items-center gap-2 justify-center"
            size="lg"
          >
            <a href="tel:0777460408">
              <PhoneIcon className="w-5 h-5" /> Gọi 0777460408
            </a>
          </Button>
          <Button
            asChild
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-base flex items-center gap-2 justify-center"
            size="lg"
          >
            <a href="https://zalo.me/0777460408" target="_blank" rel="noopener noreferrer">
              <SiZalo className="w-5 h-5" /> Nhắn Zalo 0777460408
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}