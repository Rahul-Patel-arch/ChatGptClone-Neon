import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./AIToolsView.css";

const demoJsonTools = [
  {
    id: "gpt-writer",
    name: "WriteForMe",
    description: "AI writing assistant: blog posts, emails, and website copy in seconds.",
    category: "Writing",
    tags: ["writing", "editor", "copywriting"],
    image: "https://images.unsplash.com/photo-1520697222864-7b2a7b7a4b91?q=80&w=800&auto=format&fit=crop",
    featured: true
  },
  {
    id: "summarize-pro",
    name: "SummarizePro",
    description: "Summarize long articles, papers, or transcripts into short bullets.",
    category: "Productivity",
    tags: ["summarize", "nlp", "productivity"],
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
    featured: true
  },
  {
    id: "research-assist",
    name: "ScholarMate",
    description: "Search across scholarly resources and produce literature summaries.",
    category: "Research & Analysis",
    tags: ["research", "papers", "analysis"],
    image: "https://images.unsplash.com/photo-1532619675605-9f6f1f9f6f1f?q=80&w=800&auto=format&fit=crop",
    featured: false
  },
  {
    id: "edu-tutor",
    name: "Tutorly",
    description: "Adaptive learning tutor that generates quizzes and explains concepts step-by-step.",
    category: "Education",
    tags: ["education", "tutor", "quizzes"],
    image: "https://images.unsplash.com/photo-1523580494863-6a16179bda97?q=80&w=800&auto=format&fit=crop",
    featured: false
  },
  {
    id: "dalle-mini",
    name: "DALL·E Mini",
    description: "Generate images from prompts with quick style presets.",
    category: "DALL·E",
    tags: ["image", "generation", "art"],
    image: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?q=80&w=800&auto=format&fit=crop",
    featured: true
  },
  {
    id: "code-gen",
    name: "CodeBuddy",
    description: "Generate code snippets, refactor and explain code in many languages.",
    category: "Programming",
    tags: ["code", "programming", "refactor"],
    image: "https://images.unsplash.com/photo-1518779578993-c35f992b95d2?q=80&w=800&auto=format&fit=crop",
    featured: false
  },
  {
    id: "persona-ai",
    name: "PersonaCoach",
    description: "Personalized life-coach style suggestions and habit tracking.",
    category: "Lifestyle",
    tags: ["lifestyle", "coach", "habits"],
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
    featured: false
  },
  {
    id: "translate-x",
    name: "TranslateX",
    description: "Fast translation assistant for text and short audio transcriptions.",
    category: "Productivity",
    tags: ["translate", "multi-lingual"],
    image: "https://images.unsplash.com/photo-1520975924394-0f0ab1a6d3f7?q=80&w=800&auto=format&fit=crop",
    featured: false
  },
  {
    id: "story-weaver",
    name: "StoryWeaver",
    description: "Story and plot generator for fiction writers — character, arc, scenes.",
    category: "Writing",
    tags: ["story", "creative", "novel"],
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=800&auto=format&fit=crop",
    featured: false
  }
];

const categories = [
  { id: "top-picks", name: "Top Picks" },
  { id: "writing", name: "Writing" },
  { id: "productivity", name: "Productivity" },
  { id: "research-analysis", name: "Research & Analysis" },
  { id: "education", name: "Education" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "dalle", name: "DALL·E" },
  { id: "programming", name: "Programming" }
];

function useDebouncedValue(value, ms = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, ms);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, ms]);
  
  return debouncedValue;
}

const ToolCard = React.memo(({ tool, onDetailsClick, onCopyName }) => {
  const initials = (tool.name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="tool-card" role="article" aria-labelledby={`tool-${tool.id}-title`}>
      <div className="tool-card-image">
        <div className="tool-card-banner" aria-hidden>
          <div className="banner-initials">{initials}</div>
          <div className="banner-name">{tool.name}</div>
        </div>
        {tool.featured && <span className="tool-featured-badge">Featured</span>}
      </div>

      <div className="tool-card-body">
        <div className="tool-card-header">
          <h3 id={`tool-${tool.id}-title`} className="tool-card-title">{tool.name}</h3>
          <p className="tool-card-description">{tool.description}</p>
        </div>

        <div className="tool-card-footer">
          <div className="tool-card-tags">
            {tool.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="tool-tag">{tag}</span>
            ))}
          </div>

          <div className="tool-card-actions">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => onDetailsClick(tool)}
              aria-label={`View details for ${tool.name}`}
            >
              Details
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onCopyName(tool.name)}
              aria-label={`Copy ${tool.name} to clipboard`}
            >
              Copy Name
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

ToolCard.displayName = 'ToolCard';

const CategorySidebar = ({ categories, selectedCategory, onCategoryChange, tools }) => {
  const getCategoryCount = (categoryName) => {
    if (categoryName === "Top Picks") {
      return tools.filter(t => t.featured).length;
    }
    return tools.filter(t => t.category === categoryName).length;
  };

  return (
    <aside className="categories-sidebar">
      <div className="categories-card">
        <h2 className="categories-title">Categories</h2>
        <p className="categories-subtitle">Filter tools by category</p>
        
        <nav className="categories-nav" role="navigation" aria-label="Tool categories">
          {categories.map((category) => {
            const count = getCategoryCount(category.name);
            const isActive = selectedCategory === category.name;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.name)}
                className={`category-btn ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                aria-label={`${category.name} category, ${count} tools`}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{count}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="search-tips-card">
        <h3 className="tips-title">Search Tips</h3>
        <ul className="tips-list">
          <li>Search by tool name, tag, or description</li>
          <li>Try examples: <code>summarize</code>, <code>image</code>, <code>translate</code></li>
          <li>Use <kbd>⌘K</kbd> to focus search</li>
          <li>Click cards for detailed information</li>
        </ul>
      </div>
    </aside>
  );
};

const ToolModal = ({ tool, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tool, null, 2));
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen || !tool) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-image">
          <img src={tool.image} alt={tool.name} />
        </div>
        
        <div className="modal-body">
          <div className="modal-header">
            <div className="modal-info">
              <h2 id="modal-title" className="modal-title">{tool.name}</h2>
              <p className="modal-meta">{tool.category} • {tool.tags?.join(", ")}</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCopyJSON}
                aria-label="Copy tool data as JSON"
              >
                Copy JSON
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={onClose}
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="modal-description">
            <p>{tool.description}</p>
          </div>
          
          <div className="modal-metadata">
            <h3>Metadata</h3>
            <pre className="metadata-json">
              {JSON.stringify(tool, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AIToolsView({ initialTools = demoJsonTools }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedCategory, setSelectedCategory] = useState("Top Picks");
  const [tools] = useState(initialTools);
  const [activeTool, setActiveTool] = useState(null);

  const filteredTools = useMemo(() => {
    const searchTerm = debouncedQuery.trim().toLowerCase();
    
    return tools.filter((tool) => {
      // Category filter
      if (selectedCategory === "Top Picks") {
        if (!tool.featured) return false;
      } else if (tool.category !== selectedCategory) {
        return false;
      }
      
      // Search filter
      if (!searchTerm) return true;
      
      const searchableText = [
        tool.name,
        tool.description,
        tool.category,
        ...(tool.tags || [])
      ].join(" ").toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
  }, [tools, debouncedQuery, selectedCategory]);

  const handleClearSearch = useCallback(() => {
    setQuery("");
  }, []);

  const handleCopyName = useCallback(async (name) => {
    try {
      await navigator.clipboard.writeText(name);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy name:', err);
    }
  }, []);

  const handleKeyboardShortcuts = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('.search-input')?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  return (
    <div className="aitools-container">
      <header className="aitools-header">
        <h1 className="main-title">GPTs & AI Tools</h1>
        <p className="main-subtitle">
          Discover and search AI tools — filter by category or search by name, tag or description.
        </p>
        
        <div className="search-section">
          <div className="search-bar">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, commands, tags (e.g. 'summarize', 'image', 'translate')"
              className="search-input"
              aria-label="Search AI tools"
            />
            <kbd className="search-shortcut">⌘K</kbd>
          </div>
          
          <button 
            className="btn btn-outline-secondary clear-btn"
            onClick={handleClearSearch}
            disabled={!query}
            aria-label="Clear search"
          >
            Clear
          </button>
        </div>
        
        <div className="category-tabs" role="tablist" aria-label="Tool categories">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`category-tab ${selectedCategory === category.name ? 'active' : ''}`}
              role="tab"
              aria-pressed={selectedCategory === category.name}
              aria-label={`Show ${category.name} tools`}
            >
              <span className="tab-icon">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </header>
      
      <div className="aitools-layout">
        <CategorySidebar 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          tools={tools}
        />
        
        <main className="tools-main">
          <div className="tools-header">
            <div className="tools-info">
              <h2 className="section-title">
                {selectedCategory === "Top Picks" ? "Top Picks" : selectedCategory}
              </h2>
              <p className="results-count">
                {filteredTools.length} tool{filteredTools.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>
          
          {filteredTools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No tools found</h3>
              <p>Try adjusting your search terms or selecting a different category.</p>
              {query && (
                <button className="btn btn-primary" onClick={handleClearSearch}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="tools-grid" role="grid">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onDetailsClick={setActiveTool}
                  onCopyName={handleCopyName}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      
      <ToolModal
        tool={activeTool}
        isOpen={!!activeTool}
        onClose={() => setActiveTool(null)}
      />
    </div>
  );
}