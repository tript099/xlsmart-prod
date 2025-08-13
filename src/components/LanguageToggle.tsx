import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-colors"
    >
      <Globe className="h-4 w-4 mr-2" />
      {language === 'en' ? 'ID' : 'EN'}
    </Button>
  );
};