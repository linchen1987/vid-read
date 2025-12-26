"use client"

import { useEffect, useState } from "react"
import { Settings as SettingsIcon, ExternalLink, Check, ChevronDown, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AI_CONFIG_STORAGE_KEY, DEFAULT_PROVIDER, PROVIDERS_CONFIG } from "@/lib/constants"
import { ProviderType } from "@/lib/llm/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function Settings() {
    const t = useTranslations("Settings");
    const [provider, setProvider] = useState<ProviderType>(DEFAULT_PROVIDER);
    // Initialize keys object dynamically from config
    const [keys, setKeys] = useState<Record<ProviderType, string>>(() => {
        const initial: Partial<Record<ProviderType, string>> = {};
        PROVIDERS_CONFIG.forEach(p => initial[p.id] = '');
        return initial as Record<ProviderType, string>;
    });
    const [supadataKey, setSupadataKey] = useState("")
    const [open, setOpen] = useState(false)
    const [providerOpen, setProviderOpen] = useState(false);
    const [showAIKey, setShowAIKey] = useState(false);
    const [showSupadataKey, setShowSupadataKey] = useState(false);

    const STORAGE_KEY = AI_CONFIG_STORAGE_KEY;

    useEffect(() => {
        // Load settings from consolidated key
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                // Ensure provider is valid against our config
                if (config.provider && PROVIDERS_CONFIG.some(p => p.id === config.provider)) {
                    setProvider(config.provider);
                }
                if (config.keys) {
                    setKeys(prev => ({ ...prev, ...config.keys }));
                }
            }
        } catch (e) {
            console.error("Failed to load settings:", e);
        }

        const storedSupadataKey = localStorage.getItem("supadata_api_key")
        if (storedSupadataKey) setSupadataKey(storedSupadataKey)
    }, [])

    const saveConfig = (newProvider: ProviderType, newKeys: Record<ProviderType, string>) => {
        const config = {
            provider: newProvider,
            keys: newKeys
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    };

    const handleProviderChange = (newProvider: ProviderType) => {
        setProvider(newProvider);
        setProviderOpen(false);
        saveConfig(newProvider, keys);
    }

    const handleKeyChange = (newKey: string) => {
        const newKeys = { ...keys, [provider]: newKey };
        setKeys(newKeys);
        saveConfig(provider, newKeys);
    }

    const handleSupadataKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setSupadataKey(newValue)
        localStorage.setItem("supadata_api_key", newValue)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                    <SettingsIcon className="h-6 w-6" />
                    <span className="sr-only">{t('title')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Provider & Key (Combined Row) */}
                    <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                        <label className="text-right text-sm font-medium pt-2.5">
                            {t('aiApiKey')}
                        </label>
                        <div className="flex gap-2">
                            <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-[140px] justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-white shrink-0"
                                    >
                                        {PROVIDERS_CONFIG.find((p) => p.id === provider)?.name}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[140px] p-0 bg-zinc-900 border-zinc-800">
                                    <div className="flex flex-col p-1">
                                        {PROVIDERS_CONFIG.map((p) => (
                                            <Button
                                                key={p.id}
                                                variant="ghost"
                                                className={cn(
                                                    "justify-between font-normal text-zinc-400 hover:bg-zinc-800 hover:text-white",
                                                    provider === p.id && "bg-zinc-800 text-white"
                                                )}
                                                onClick={() => handleProviderChange(p.id)}
                                            >
                                                {p.name}
                                                {provider === p.id && <Check className="h-4 w-4" />}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="relative">
                                    <Input
                                        id="ai-key"
                                        value={keys[provider]}
                                        onChange={(e) => handleKeyChange(e.target.value)}
                                        className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500 pr-10"
                                        placeholder={t('enterApiKey', { provider: PROVIDERS_CONFIG.find(p => p.id === provider)?.name || '' })}
                                        type={showAIKey ? "text" : "password"}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-zinc-500 hover:text-zinc-300"
                                        onClick={() => setShowAIKey(!showAIKey)}
                                    >
                                        {showAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        <span className="sr-only">{t('toggleVisibility')}</span>
                                    </Button>
                                </div>
                                {(() => {
                                    const currentProvider = PROVIDERS_CONFIG.find(p => p.id === provider);
                                    if (currentProvider?.url) {
                                        return (
                                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <span>{t('getApiKey')}</span>
                                                <a href={currentProvider.url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors flex items-center gap-0.5">
                                                    {new URL(currentProvider.url).hostname}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </p>
                                        );
                                    }
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Supadata Key Input */}
                    <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                        <label htmlFor="supadata-key" className="text-right text-sm font-medium pt-2.5">
                            {t('supadataKey')}
                        </label>
                        <div className="flex flex-col gap-1">
                            <div className="relative">
                                <Input
                                    id="supadata-key"
                                    value={supadataKey}
                                    onChange={handleSupadataKeyChange}
                                    className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500 pr-10"
                                    placeholder={t('enterSupadataKey')}
                                    type={showSupadataKey ? "text" : "password"}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-zinc-500 hover:text-zinc-300"
                                    onClick={() => setShowSupadataKey(!showSupadataKey)}
                                >
                                    {showSupadataKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{t('toggleVisibility')}</span>
                                </Button>
                            </div>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <span>{t('getApiKey')}</span>
                                <a href="https://supadata.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors flex items-center gap-0.5">
                                    supadata.ai
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
