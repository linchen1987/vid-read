"use client"

import { useEffect, useState } from "react"
import { Settings as SettingsIcon } from "lucide-react"

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

export function Settings() {
    const [xaiKey, setXaiKey] = useState("")
    const [supadataKey, setSupadataKey] = useState("")
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const storedXaiKey = localStorage.getItem("xai_api_key")
        const storedSupadataKey = localStorage.getItem("supadata_api_key")
        if (storedXaiKey) setXaiKey(storedXaiKey)
        if (storedSupadataKey) setSupadataKey(storedSupadataKey)
    }, [])

    const handleXaiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setXaiKey(newValue)
        localStorage.setItem("xai_api_key", newValue)
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
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configure your API keys here. These are stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label htmlFor="xai-key" className="text-right text-sm font-medium">
                            xAI Key
                        </label>
                        <Input
                            id="xai-key"
                            value={xaiKey}
                            onChange={handleXaiKeyChange}
                            className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500"
                            placeholder="Enter xAI API Key"
                            type="password"
                        />
                    </div>
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                        <label htmlFor="supadata-key" className="text-right text-sm font-medium">
                            Supadata Key
                        </label>
                        <Input
                            id="supadata-key"
                            value={supadataKey}
                            onChange={handleSupadataKeyChange}
                            className="bg-zinc-900 border-zinc-700 focus-visible:ring-purple-500"
                            placeholder="Enter Supadata API Key"
                            type="password"
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
