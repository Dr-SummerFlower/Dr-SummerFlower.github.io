import {Icon as IconifyIcon} from "@iconify/react";

type Props = {
    name?: string;
    className?: string;
};

export default function Icon({name, className}: Props) {
    if (!name) {
        return null;
    }
    return <IconifyIcon icon={name} className={className}/>;
}
