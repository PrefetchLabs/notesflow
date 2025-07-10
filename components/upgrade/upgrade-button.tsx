'use client';

import { Button, ButtonProps } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UpgradeButtonProps extends ButtonProps {
  feature?: string;
  showIcon?: boolean;
}

export function UpgradeButton({ 
  feature,
  showIcon = true,
  children,
  className,
  onClick,
  ...props 
}: UpgradeButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else {
      router.push('/upgrade');
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={cn("relative overflow-hidden group", className)}
      {...props}
    >
      {showIcon && (
        <Sparkles className="mr-2 h-4 w-4 relative z-10" />
      )}
      <span className="relative z-10">
        {children || (feature ? `Unlock ${feature}` : 'Upgrade to Pro')}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  );
}