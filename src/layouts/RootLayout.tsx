import {Outlet} from "react-router-dom";
import ConfigCarrier from "@/components/ConfigCarrier";
import ScrollManager from "@/components/ScrollManager";

export function RootLayout() {
    return (
        <div className="flex min-h-full flex-col text-[var(--foreground)]">
            <ConfigCarrier/>
            <ScrollManager/>
            <Outlet/>
        </div>
    );
}
