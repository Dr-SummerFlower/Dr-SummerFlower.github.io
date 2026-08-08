type Props = {
    html: string;
};

export default function Markdown({html}: Props) {
    return (
        <div
            className="custom-md prose prose-zinc max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{__html: html}}
        />
    );
}
