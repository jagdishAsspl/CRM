"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Icons } from "../ui/icons";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
}

const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = "Are you sure?",
  description = "This action cannot be undone.",
}: AlertModalProps) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent className="max-w-md w-[95vw] bg-card text-card-foreground border border-border/80 shadow-2xl z-[150] p-6 rounded-xl sm:rounded-xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-3">
          <Button
            type="button"
            disabled={loading}
            variant="outline"
            onClick={onClose}
            className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </Button>
          <Button
            disabled={loading}
            variant="destructive"
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            {loading ? <Icons.spinner className="animate-spin h-4 w-4" /> : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
