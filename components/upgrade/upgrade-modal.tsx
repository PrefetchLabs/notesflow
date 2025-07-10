'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  title?: string;
  description?: string;
}

const proFeatures = [
  "Unlimited notes and folders",
  "AI-powered writing assistant",
  "Real-time collaboration",
  "Share notes with anyone",
  "Priority support",
  "Advanced export options",
  "7-day version history",
  "Custom themes"
];

export function UpgradeModal({
  open,
  onOpenChange,
  feature = "This feature",
  title = "Upgrade to Pro",
  description
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/upgrade');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description || `${feature} is only available for Pro users. Upgrade now to unlock all premium features!`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6 space-y-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <h3 className="mb-3 font-semibold">Everything in Pro:</h3>
            <div className="grid gap-2">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <span className="text-3xl font-bold">$8</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              or $80/year (save 17%)
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button size="lg" className="w-full" onClick={handleUpgrade}>
            Upgrade to Pro
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}