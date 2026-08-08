import {Icon as IconifyIcon, addCollection} from "@iconify/react";
import {iconsSubset, remapIconName} from "@/utils/icons-subset.gen";

let _registered = false;
function ensureLocalCollection() {
    if (_registered) return;
    _registered = true;
    try {
        addCollection(iconsSubset);
    } catch {
        _registered = false;
    }
}

type Props = {
    name?: string;
    className?: string;
};

export default function Icon({name, className}: Props) {
    ensureLocalCollection();
    if (!name) {
        return null;
    }
    const id = remapIconName(name);
    return <IconifyIcon icon={id} className={className}/>;
}
