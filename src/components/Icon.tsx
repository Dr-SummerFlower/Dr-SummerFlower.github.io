import {SVGProps, useMemo} from "react";
import {iconsSubset, remapIconName} from "@/utils/icons-subset.gen";

type Props = {
    name?: string;
    className?: string;
} & Omit<SVGProps<SVGSVGElement>, "name" | "className" | "viewBox" | "dangerouslySetInnerHTML">;

export default function Icon({name, className, style, ...rest}: Props) {
    const inner = useMemo(() => {
        if (!name) return null;
        const remapped = remapIconName(name);
        const prefixSplit = remapped.indexOf(":");
        const id = prefixSplit >= 0 ? remapped.slice(prefixSplit + 1) : remapped;
        const def = (iconsSubset.icons as Record<string, { body: string; width?: number; height?: number } | undefined>)[id];
        if (!def) return null;
        return {
            body: def.body,
            width: def.width ?? iconsSubset.width ?? 24,
            height: def.height ?? iconsSubset.height ?? 24,
        };
    }, [name]);

    if (!name || !inner) {
        return null;
    }

    return (
        <svg
            role="img"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${inner.width} ${inner.height}`}
            className={className}
            style={{
                display: "inline-block",
                verticalAlign: "-0.125em",
                fill: "currentColor",
                ...style,
            }}
            {...rest}
            dangerouslySetInnerHTML={{__html: inner.body}}
        />
    );
}
