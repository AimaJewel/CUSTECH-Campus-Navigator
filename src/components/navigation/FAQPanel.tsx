import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CircleHelp, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { faqCategories, faqs, type FAQCategory, type FAQItem } from '@/data/faqs';

interface FAQPanelProps {
  items?: readonly FAQItem[];
  title?: string;
}

function matchesQuery(item: FAQItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return !normalizedQuery || [item.question, item.answer, item.category].some(value => value.toLowerCase().includes(normalizedQuery));
}

export default function FAQPanel({ items = faqs, title = 'Frequently Asked Questions' }: FAQPanelProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filteredItems = useMemo(() => items.filter(item => (activeCategory === 'All' || item.category === activeCategory) && matchesQuery(item, query)), [activeCategory, items, query]);
  const groups = useMemo(() => faqCategories.map(category => ({ category, items: filteredItems.filter(item => item.category === category) })).filter(group => group.items.length > 0), [filteredItems]);

  return (
    <section className="space-y-4" aria-labelledby="faq-heading">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400"><CircleHelp size={19} aria-hidden="true" /></span>
          <div><h2 id="faq-heading" className="text-sm font-semibold text-white/90">{title}</h2><p className="mt-0.5 text-xs leading-5 text-white/40">Find quick answers about using CUSTECH Navigator.</p></div>
        </div>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} aria-hidden="true" />
        <input value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-9 text-sm text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-500/50 focus:bg-white/[0.06]" placeholder="Search questions and answers..." type="search" aria-label="Search frequently asked questions" />
        {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/35 transition-colors hover:text-white/70" aria-label="Clear FAQ search"><X size={15} /></button>}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" aria-label="FAQ categories">
        {(['All', ...faqCategories] as const).map(category => <button key={category} onClick={() => { setActiveCategory(category); setExpandedId(null); }} className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${activeCategory === category ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-400' : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/65'}`}>{category}</button>)}
      </div>
      {groups.length > 0 ? <div className="space-y-4">{groups.map(group => <div key={group.category}><h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">{group.category}</h3><div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">{group.items.map(item => {
        const isExpanded = expandedId === item.id;
        return <article key={item.id} className="border-b border-white/[0.06] last:border-b-0"><button onClick={() => setExpandedId(isExpanded ? null : item.id)} aria-expanded={isExpanded} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]"><span className="flex-1 text-xs font-medium leading-5 text-white/75">{item.question}</span><ChevronDown size={16} className={`shrink-0 text-cyan-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button><AnimatePresence initial={false}>{isExpanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden"><p className="px-3.5 pb-3.5 text-xs leading-5 text-white/45">{item.answer}</p></motion.div>}</AnimatePresence></article>;
      })}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center"><CircleHelp className="mx-auto text-white/20" size={23} aria-hidden="true" /><p className="mt-2 text-sm text-white/50">No FAQs found</p><p className="mt-1 text-xs text-white/30">Try another question, category or keyword.</p></div>}
    </section>
  );
}
