import {Link} from "react-router-dom";
import type {BlogPostMeta} from "@/types/post";
import {classNames} from "@/utils/common-utils";
import PostMeta from "./PostMeta";

type Props = {
    post: BlogPostMeta;
};

export default function PostCard({post}: Props) {
    const hasCover = Boolean(post.image);

    return (
        <article className="card overflow-hidden">
            <div className="flex flex-col-reverse md:flex-row">
                <div
                    className={classNames(
                        "p-6 md:p-8",
                        hasCover ? "md:w-[72%]" : "w-full",
                    )}
                >
                    <Link
                        to={`/posts/${post.slug}`}
                        className="group relative block text-2xl font-bold leading-9 text-[var(--foreground)] transition hover:text-[var(--primary)]"
                    >
                        <span className="absolute left-[-1rem] top-2 hidden h-5 w-1 rounded-full bg-[var(--primary)] md:block"/>
                        {post.title}
                    </Link>
                    <div className="mt-4">
                        <PostMeta
                            published={post.published}
                            updated={post.updated}
                            category={post.category}
                            tags={post.tags}
                            words={post.words}
                            readingMinutes={post.readingMinutes}
                        />
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--muted)]">
                        {post.description || post.excerpt}
                    </p>
                </div>

                {hasCover ? (
                    <Link
                        to={`/posts/${post.slug}`}
                        className="relative block aspect-[16/9] max-h-[220px] w-full overflow-hidden md:m-3 md:aspect-auto md:h-auto md:w-[28%] md:rounded-2xl"
                    >
                        <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-black/0 transition hover:bg-black/10"/>
                    </Link>
                ) : null}
            </div>
        </article>
    );
}
