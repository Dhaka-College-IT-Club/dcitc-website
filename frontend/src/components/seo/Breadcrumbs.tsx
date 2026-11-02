import Link from "next/link";
import JsonLd from "./JsonLd";
import { breadcrumbList, type BreadcrumbItem } from "@/lib/structured-data";

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd data={breadcrumbList(items)} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 font-orbitron text-[10px] uppercase tracking-[0.2em] text-slate-500"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-slate-300">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="transition-colors hover:text-white">
                    {item.name}
                  </Link>
                )}
                {!last ? <span aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
