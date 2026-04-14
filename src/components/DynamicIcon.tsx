import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Fallback if icon name is invalid
    return <Icons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};
