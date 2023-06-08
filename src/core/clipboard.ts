import { Event } from "corejs";

export abstract class Clipboard {
    public static readonly onCopy = new Event<void, string>('Clipboard.onCopy');

    public static async canCopy(): Promise<boolean> {
        try {
            const permission = await navigator.permissions.query({ name: "clipboard-write" } as any);

            return permission.state == 'granted';
        } catch (error) {
            return false;
        }
    }

    public static async copy(value: string, key = ''): Promise<void> {
        await navigator.clipboard.writeText(value);

        this.onCopy.emit(null, key);
    }
}