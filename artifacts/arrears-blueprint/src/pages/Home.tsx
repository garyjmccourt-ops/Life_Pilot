import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Check, Copy, BookOpen, Layers, Info } from 'lucide-react';
import { blueprintContent, Section, ContentBlock } from '../content/blueprint';
import { Button } from '@/components/ui/button';

// Helper to render tree structure
const TreeRenderer = ({ data }: { data: any[] }) => {
  return (
    <ul className="text-sm font-mono mt-2">
      {data.map((node, i) => (
        <li key={i} className="py-1">
          <span className="text-foreground/80 font-medium">{node.name}</span>
          {node.children && <TreeRenderer data={node.children} />}
        </li>
      ))}
    </ul>
  );
};

// Component to handle bolding code-like syntax in conventions
const FormattedText = ({ text }: { text: string }) => {
  // Bold words wrapped in brackets [like this] or specific file formats
  const parts = text.split(/(\[.*?\]|Budget_\w+\.ext|YYYY-MM-DD|HH:MM)/g);
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          return <span key={i} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground/90">{part}</span>;
        } else if (part.match(/Budget_\w+\.ext|YYYY-MM-DD|HH:MM/)) {
          return <span key={i} className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const TemplateCard = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative mt-4">
      <div className="absolute right-4 top-4 z-10">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          className="h-8 bg-card opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        >
          {copied ? <Check className="w-3 h-3 mr-1.5 text-primary" /> : <Copy className="w-3 h-3 mr-1.5" />}
          {copied ? 'Copied' : 'Copy template'}
        </Button>
      </div>
      <div className="template-block font-serif text-sm">
        {content}
      </div>
    </div>
  );
};

const BlockRenderer = ({ block }: { block: ContentBlock }) => {
  return (
    <div className="mb-6 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {block.title && (
        <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
          {block.title}
        </h4>
      )}
      
      {block.type === 'text' && (
        <p className="text-foreground/80 leading-relaxed max-w-3xl whitespace-pre-wrap">
          <FormattedText text={block.content} />
        </p>
      )}
      
      {block.type === 'list' && (
        <ul className="space-y-3 mt-2 max-w-3xl">
          {(block.content as string[]).map((item, i) => (
            <li key={i} className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 mr-3 flex-shrink-0" />
              <span className="text-foreground/80 leading-relaxed"><FormattedText text={item} /></span>
            </li>
          ))}
        </ul>
      )}
      
      {block.type === 'tree' && (
        <div className="bg-card border border-border rounded-lg p-5 max-w-2xl tree-list">
          <TreeRenderer data={block.content} />
        </div>
      )}
      
      {block.type === 'template' && (
        <TemplateCard content={block.content} />
      )}
    </div>
  );
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>(blueprintContent[0].id);

  // Set up intersection observer for scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Find the one closest to the top
          const topEntry = visibleEntries.reduce((prev, curr) => 
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveSection(topEntry.target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Top Nav */}
      <div className="md:hidden sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-primary" />
          <h1 className="font-serif font-bold text-lg">Arrears & Budget Blueprint</h1>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide hide-scrollbar">
          {blueprintContent.map((section) => (
            <a 
              key={section.id} 
              href={`#${section.id}`}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSection === section.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {section.title.split('. ')[1]}
            </a>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 border-r border-border bg-sidebar flex-shrink-0">
        <div className="p-6 border-b border-border bg-sidebar-primary text-sidebar-primary-foreground">
          <BookOpen className="w-6 h-6 mb-3 opacity-90" />
          <h1 className="font-serif font-bold text-xl tracking-tight leading-tight">Arrears & Budget<br/>Blueprint</h1>
          <p className="text-sidebar-primary-foreground/70 text-xs mt-2 font-medium tracking-wide uppercase">Field Manual</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 py-6 space-y-1">
          {blueprintContent.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`block px-4 py-2 rounded-md text-sm transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-primary/10 text-primary font-bold shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              {section.title}
            </a>
          ))}
        </nav>

        {/* Persistent Principle Snippet in sidebar */}
        <div className="p-5 border-t border-border bg-sidebar-accent/50 m-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Principle</span>
          </div>
          <p className="text-xs text-sidebar-foreground/70 leading-relaxed font-medium">
            Update one thing in one place, and the others just point to it.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-6 md:p-12 lg:p-16 pb-32">
          
          <div className="mb-16 md:hidden">
            <p className="text-muted-foreground text-sm italic">
              A focused, no-nonsense reference site for working through real financial pressure. Calm, intentional, easy to scan.
            </p>
          </div>

          <div className="hidden md:block mb-16 border-b border-border pb-8">
            <h2 className="text-3xl font-serif text-foreground font-bold mb-4">Operating Protocol</h2>
            <p className="text-foreground/70 text-lg max-w-2xl leading-relaxed">
              A structured reference for managing multiple arrears across spreadsheets, notes, email, and tasks. Built to be maintainable under pressure.
            </p>
          </div>

          <div className="space-y-24">
            {blueprintContent.map((section) => (
              <section 
                key={section.id} 
                id={section.id} 
                className="scroll-mt-24 md:scroll-mt-12"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px bg-border flex-1 max-w-[40px]" />
                  <h3 className="text-2xl font-serif font-bold text-foreground tracking-tight">
                    {section.title}
                  </h3>
                </div>
                
                <div className="pl-0 md:pl-14">
                  {section.blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>

        </div>

        {/* Bottom pinned principle for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Principle:</strong> When layers stop overlapping, the system stays maintainable. Update one thing in one place, point to it from others.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
