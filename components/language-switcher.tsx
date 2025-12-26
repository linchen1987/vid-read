"use client";

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/src/i18n/routing';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export function LanguageSwitcher() {
    const t = useTranslations('LanguageSwitcher');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLanguageChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                    <Languages className="h-6 w-6" />
                    <span className="sr-only">{t('label')}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-32 p-1 bg-zinc-950 border-zinc-800">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "justify-start w-full font-normal hover:bg-zinc-800 hover:text-white",
                            locale === 'en' ? "bg-zinc-800 text-white" : "text-zinc-400"
                        )}
                        onClick={() => handleLanguageChange('en')}
                    >
                        English
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "justify-start w-full font-normal hover:bg-zinc-800 hover:text-white",
                            locale === 'zh' ? "bg-zinc-800 text-white" : "text-zinc-400"
                        )}
                        onClick={() => handleLanguageChange('zh')}
                    >
                        中文
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
