import {Outlet} from "react-router-dom";
import ConfigCarrier from "@/components/ConfigCarrier";
import ScrollManager from "@/components/ScrollManager";
import MainGridLayout from "./MainGridLayout";

export function RootLayout() {
    return (
        <div className="flex min-h-full flex-col text-[var(--foreground)]">
            <ConfigCarrier/>
            <ScrollManager/>
            <MainGridLayout>
                <Outlet/>
            </MainGridLayout>
        </div>
    );
}
