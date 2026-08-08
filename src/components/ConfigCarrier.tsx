import {useEffect} from "react";
import {useThemeStore} from "@/store/theme";

export default function ConfigCarrier() {
    const initOnHydrate = useThemeStore((s) => s.initOnHydrate);

    useEffect(() => {
        initOnHydrate();
    }, [initOnHydrate]);

    return null;
}
