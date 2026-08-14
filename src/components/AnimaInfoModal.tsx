import Modal from "@/components/Modal";
import {Icon} from "@iconify/react";
import {withSiteBasePath} from "@/config";
import {classNames} from "@/utils/common-utils";
import {useCallback, useState} from "react";

const WORKFLOW_JSON_URL = "/anima-artists/anima_base_v1_example.json";

const MODEL_PARAMS = [
    ["UNet 加载器", "anima_base_v10.safetensors"],
    ["加载 CLIP", "anima_baseV10_txt.safetensors"],
    ["加载 VAE", "qwen_image_vae.safetensors"],
    ["AuraFlow shift", "3"],
] as const;

const SAMPLER_PARAMS = [
    ["种子", "20260805"],
    ["步数", "10"],
    ["CFG", "2.0"],
    ["采样器", "er_sde"],
    ["调度器", "simple"],
    ["降噪", "1.0"],
] as const;

const OUTPUT_PARAMS = [
    ["输出格式", "PNG"],
    ["输出尺寸", "600 × 800"],
] as const;

const NEGATIVE_PROMPT =
    "worst quality, low quality, score_1, score_2, score_3, artist name, blurry, jpeg artifacts, chromatic aberration, lowres, censor";

const POSITIVE_PREFIX =
    "masterpiece, best quality, score_7, safe, newest, @({artist_name}:1.5),";

const PREVIEWS: {id: string; title: string; prompt: string}[] = [
    {
        id: "1",
        title: "图 1",
        prompt:
            "1girl, solo, upper body, portrait, straight-on, centered composition, facing viewer, looking at viewer,\nblack hair, medium hair, straight hair, blunt bangs, blue eyes, closed mouth, lips pressed together, subtle smile,\npajamas, long sleeves, light blue shirt, white trim, white collar, sleepwear,\nstudio lighting, soft lighting, even lighting, white background, simple background,\nclean lineart, flat colors, smooth shading.",
    },
    {
        id: "2",
        title: "图 2",
        prompt:
            "1girl, solo, upper body, portrait, straight-on, centered composition, facing viewer, looking at viewer,\nauburn hair, long hair, wavy hair, hair over shoulder, brown eyes, closed mouth, lips pressed together, subtle smile,\nschool uniform, serafuku, sailor collar, white collar, navy blue shirt, pleated bodice, white bow, ribbon bow, ivory ribbon,\nstudio lighting, soft lighting, even lighting, white background, simple background,\nclean lineart, flat colors, sharp lines.",
    },
    {
        id: "3",
        title: "图 3",
        prompt:
            "1girl, solo, upper body, portrait, straight-on, centered composition, facing viewer, looking at viewer,\npink hair, short hair, bob cut, blunt bangs, pink eyes, closed mouth, lips pressed together, subtle smile,\nwhite shirt, short sleeves, t-shirt, casual wear, print shirt, bunny print, rabbit print, animal print,\nstudio lighting, soft lighting, even lighting, white background, simple background,\nclean lineart, flat colors, smooth shading.",
    },
    {
        id: "4",
        title: "图 4",
        prompt:
            "1girl, solo, upper body, portrait, straight-on, centered composition, facing viewer, looking at viewer,\nyellow hair, blonde hair, high ponytail, ponytail, loose hair strands, face-framing hair, blue eyes, closed mouth, lips pressed together, subtle smile, composed expression,\nturtleneck, white sweater, cream sweater, knitwear, trench coat, tan coat, brown coat, lapels, formal wear, layered clothes,\nstudio lighting, soft lighting, even lighting, white background, simple background,\nclean lineart, flat colors, sharp lines, editorial.",
    },
];

type Props = {
    open: boolean;
    onClose: () => void;
};

function ParamTable({rows}: {rows: readonly (readonly [string, string])[]}) {
    return (
        <div className="my-2 overflow-hidden rounded-xl border border-[var(--line-divider)] text-sm">
            <table className="w-full border-collapse">
                <tbody>
                    {rows.map(([k, v]) => (
                        <tr
                            key={k}
                            className="border-t border-[var(--line-divider)] first:border-t-0 odd:bg-[var(--license-block-bg)]/40"
                        >
                            <th className="w-1/3 px-4 py-2.5 text-left font-semibold text-[var(--foreground)]">
                                {k}
                            </th>
                            <td className="px-4 py-2.5 font-mono text-[0.82rem] text-[var(--muted)]">
                                {v}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function PromptBlock({value, label, copyKey}: {value: string; label?: string; copyKey?: string}) {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(value);
                } else {
                    const ta = document.createElement("textarea");
                    ta.value = value;
                    ta.style.position = "fixed";
                    ta.style.opacity = "0";
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
            } catch {
                setCopied(false);
            }
        },
        [value],
    );
    return (
        <div className="!my-2 overflow-hidden rounded-xl border border-[var(--line-divider)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line-divider)] bg-[var(--card-bg)] px-3 py-1.5">
                <div className="min-w-0 truncate text-[11px] font-bold uppercase tracking-widest text-[var(--primary-text)]">
                    {label ?? "Prompt"}
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    title={copied ? "已复制" : "复制到剪贴板"}
                    aria-label={copied ? "已复制" : "复制到剪贴板"}
                    data-copy-key={copyKey}
                    className={classNames(
                        "btn-regular inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                        copied &&
                            "bg-emerald-500/90 text-white hover:bg-emerald-500/90 dark:bg-emerald-400/90 dark:text-slate-950 dark:hover:bg-emerald-400/90",
                    )}
                >
                    <Icon
                        icon={
                            copied
                                ? "material-symbols:check-rounded"
                                : "material-symbols:content-copy-outline-rounded"
                        }
                        className="h-3.5 w-3.5"
                    />
                    <span>{copied ? "已复制" : "复制"}</span>
                </button>
            </div>
            <pre
                className="m-0 overflow-x-auto whitespace-pre-wrap break-words px-4 py-3"
                style={{
                    backgroundColor: "var(--card-bg)",
                }}
            >
                <code
                    style={{
                        color: "var(--foreground)",
                        fontSize: "0.82rem",
                        lineHeight: 1.6,
                        fontFamily:
                            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                        background: "transparent",
                        padding: 0,
                    }}
                >
                    {value}
                </code>
            </pre>
        </div>
    );
}

export default function AnimaInfoModal({open, onClose}: Props) {
    const downloadUrl = withSiteBasePath(WORKFLOW_JSON_URL);
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="预览生成说明 · Anima Base V10"
            maxWidthClass="max-w-4xl"
        >
            <div className="space-y-7">
                <section>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
                        <Icon
                            icon="material-symbols:info-outline-rounded"
                            className="h-5 w-5 text-[var(--primary-text)]"
                        />
                        预览图的生成方式
                    </h3>
                    <div className="rounded-xl border border-dashed border-[var(--line-divider)] bg-[var(--license-block-bg)]/40 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                        每位画师都生成 <strong className="text-[var(--foreground)]">4 张固定模板</strong>
                        的预览图，所有图片均由同一条提示词模板生成，仅占位符{" "}
                        <code className="mx-0.5 rounded-md bg-[var(--inline-code-bg)] px-1.5 py-0.5 text-[0.85rem] text-[var(--inline-code-color)]">
                            {"{artist_name}"}
                        </code>{" "}
                        会被替换为对应画师名称。因此同一模板生成的图片之间的差异，
                        <strong className="text-[var(--foreground)]">完全来自画师画风本身</strong>，
                        不受人物、服装、构图变化的干扰。
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="rounded-2xl border border-[var(--line-divider)] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
                                <Icon
                                    icon="material-symbols:download-outline-rounded"
                                    className="h-5 w-5 text-[var(--primary-text)]"
                                />
                                示例工作流
                            </h3>
                            <a
                                href={downloadUrl}
                                download="anima_base_v1_example.json"
                                className={classNames(
                                    "btn-regular inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
                                )}
                            >
                                <Icon
                                    icon="material-symbols:download-outline-rounded"
                                    className="h-4.5 w-4.5"
                                />
                                下载 ComfyUI 工作流 JSON
                            </a>
                        </div>
                        <p className="text-sm leading-7 text-[var(--muted)]">
                            依赖插件：
                            <code className="mx-1 rounded-md bg-[var(--inline-code-bg)] px-1.5 py-0.5 text-[0.85rem] text-[var(--inline-code-color)]">
                                ComfyUI-Easy-Use
                            </code>
                            。下载后可直接在 ComfyUI 中拖入「Load」按钮打开，
                            按需要修改模型路径或提示词即可使用。
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-2 text-base font-bold text-[var(--foreground)]">模型参数</h4>
                        <ParamTable rows={MODEL_PARAMS} />
                    </div>
                    <div>
                        <h4 className="mb-2 text-base font-bold text-[var(--foreground)]">采样器参数</h4>
                        <ParamTable rows={SAMPLER_PARAMS} />
                    </div>
                    <div>
                        <h4 className="mb-2 text-base font-bold text-[var(--foreground)]">输出参数</h4>
                        <ParamTable rows={OUTPUT_PARAMS} />
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
                        <Icon
                            icon="material-symbols:magic-button-outline"
                            className="h-5 w-5 text-[var(--primary-text)]"
                        />
                        提示词模板
                    </h3>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
                            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-rose-500 dark:text-rose-300">
                                负面提示词（四张统一）
                            </div>
                            <PromptBlock
                                value={NEGATIVE_PROMPT}
                                label="负面 Prompt"
                                copyKey="negative"
                            />
                        </div>

                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                                正面质量提示词 + 画师权重
                            </div>
                            <p className="mb-2 text-sm leading-7 text-[var(--muted)]">
                                该段在每张图的<strong>最前面</strong>，负责锁定画质、安全等级，并把画师名称以{" "}
                                <code className="mx-0.5 rounded-md bg-[var(--inline-code-bg)] px-1.5 py-0.5 text-[0.85rem] text-[var(--inline-code-color)]">
                                    @(name:1.5)
                                </code>{" "}
                                形式加权注入：
                            </p>
                            <PromptBlock
                                value={POSITIVE_PREFIX}
                                label="质量前缀 Prompt"
                                copyKey="positive-prefix"
                            />
                        </div>

                        <div className="mt-3 space-y-4">
                            {PREVIEWS.map((p) => (
                                <article
                                    key={p.id}
                                    className="overflow-hidden rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)]/40"
                                >
                                    <div className="flex items-center justify-between border-b border-[var(--line-divider)] px-4 py-2.5">
                                        <h5 className="text-sm font-bold text-[var(--foreground)]">
                                            {p.title}
                                        </h5>
                                        <span className="rounded-full bg-[var(--primary-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-text)]">
                                            Preview {p.id}
                                        </span>
                                    </div>
                                    <div className="space-y-2 px-4 py-3">
                                        <PromptBlock
                                            value={`${POSITIVE_PREFIX}\n${p.prompt}`}
                                            label={`${p.title} Prompt`}
                                            copyKey={`preview-${p.id}`}
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
}
