import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function ButtonPlayground() {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const effectCategories = [
    {
      title: 'Hover Effects',
      description: 'Different hover animations for buttons',
      buttons: [
        { label: 'Lift (Default)', className: 'btn btn-primary btn-lift', code: 'btn btn-primary btn-lift' },
        { label: 'Scale Pop', className: 'btn btn-primary btn-scale', code: 'btn btn-primary btn-scale' },
        { label: 'Glow', className: 'btn btn-primary btn-glow', code: 'btn btn-primary btn-glow' },
        { label: 'Shimmer Sweep', className: 'btn btn-primary btn-shimmer', code: 'btn btn-primary btn-shimmer' },
        { label: 'Border Slide', className: 'btn btn-outline btn-border-slide', code: 'btn btn-outline btn-border-slide' },
        { label: 'Color Fill', className: 'btn btn-ghost btn-fill', code: 'btn btn-ghost btn-fill' },
        { label: 'Premium (Lift + Shimmer)', className: 'btn btn-primary btn-premium', code: 'btn btn-primary btn-premium' },
        { label: 'Pop (Scale + Glow)', className: 'btn btn-accent btn-pop', code: 'btn btn-accent btn-pop' },
        { label: 'Pulse (Animated)', className: 'btn btn-primary btn-pulse', code: 'btn btn-primary btn-pulse' },
      ],
    },
    {
      title: 'Button Variants',
      description: 'Semantic button styles for different actions',
      buttons: [
        { label: 'Primary', className: 'btn btn-primary btn-lift', code: 'btn btn-primary btn-lift' },
        { label: 'Secondary', className: 'btn btn-secondary btn-lift', code: 'btn btn-secondary btn-lift' },
        { label: 'Accent', className: 'btn btn-accent btn-lift', code: 'btn btn-accent btn-lift' },
        { label: 'Outline', className: 'btn btn-outline btn-border-slide', code: 'btn btn-outline btn-border-slide' },
        { label: 'Ghost', className: 'btn btn-ghost btn-fill', code: 'btn btn-ghost btn-fill' },
        { label: 'Link', className: 'btn btn-link', code: 'btn btn-link' },
        { label: 'Destructive', className: 'btn btn-destructive btn-lift', code: 'btn btn-destructive btn-lift' },
        { label: 'Success', className: 'btn btn-success btn-lift', code: 'btn btn-success btn-lift' },
        { label: 'Warning', className: 'btn btn-warning btn-lift', code: 'btn btn-warning btn-lift' },
      ],
    },
    {
      title: 'Responsive Sizes',
      description: 'Buttons that adapt to screen size',
      buttons: [
        { label: 'Small (btn-sm)', className: 'btn btn-primary btn-sm btn-lift', code: 'btn btn-primary btn-sm btn-lift' },
        { label: 'Medium (btn-md)', className: 'btn btn-primary btn-md btn-lift', code: 'btn btn-primary btn-md btn-lift' },
        { label: 'Large (btn-lg)', className: 'btn btn-primary btn-lg btn-lift', code: 'btn btn-primary btn-lg btn-lift' },
        { label: 'Extra Large (btn-xl)', className: 'btn btn-primary btn-xl btn-lift', code: 'btn btn-primary btn-xl btn-lift' },
        { label: 'Fluid (Full on mobile)', className: 'btn btn-primary btn-fluid btn-md btn-lift', code: 'btn btn-primary btn-fluid btn-md btn-lift' },
      ],
    },
    {
      title: 'States & Modifiers',
      description: 'Loading, disabled, icon positions',
      buttons: [
        { label: 'Loading', className: 'btn btn-primary btn-md btn-lift btn-loading', code: 'btn btn-primary btn-md btn-lift btn-loading' },
        { label: 'Disabled', className: 'btn btn-primary btn-md btn-lift', disabled: true, code: 'btn btn-primary btn-md btn-lift (disabled)' },
        { label: 'Icon Left', className: 'btn btn-primary btn-md btn-lift btn-icon-left', icon: '←', code: 'btn btn-primary btn-md btn-lift btn-icon-left' },
        { label: 'Icon Right', className: 'btn btn-primary btn-md btn-lift btn-icon-right', icon: '→', code: 'btn btn-primary btn-md btn-lift btn-icon-right' },
        { label: 'Icon Only', className: 'btn btn-primary btn-icon-only btn-lift', icon: '+', code: 'btn btn-primary btn-icon-only btn-lift' },
        { label: 'Press Effect', className: 'btn btn-primary btn-md btn-press', code: 'btn btn-primary btn-md btn-press' },
      ],
    },
  ];

  const renderButton = (btn, index) => (
    <div key={index} className="flex flex-col items-center gap-3 min-w-[180px]">
      <button
        className={btn.className}
        disabled={btn.disabled}
        onClick={() => btn.code && copyToClipboard(btn.code)}
        style={{ minWidth: '160px' }}
      >
        {btn.icon && <span className="text-lg">{btn.icon}</span>}
        {btn.label}
      </button>
      <button
        onClick={() => btn.code && copyToClipboard(btn.code)}
        className="btn btn-ghost btn-sm text-xs"
        title={copied === btn.code ? 'Copied!' : 'Copy className'}
      >
        {copied === btn.code ? (
          <span className="text-success">✓ Copied!</span>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </>
        )}
      </button>
      <code className="text-xs text-base-content/50 bg-base-200 px-2 py-1 rounded break-all max-w-[200px] text-center">
        {btn.code}
      </code>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-base-content mb-2">Button Playground</h1>
          <p className="text-base-content/60">
            Test and preview all button hover effects, variants, and responsive sizes.
            Click "Copy" to copy the className to your clipboard.
          </p>
        </div>

        {/* Quick Reference */}
        <div className="card p-6 bg-base-200">
          <h3 className="font-semibold text-base-content mb-4">Quick Usage</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <code className="text-primary font-medium">className="btn btn-primary btn-lift"</code>
              <p className="text-base-content/60 mt-1">Primary CTA with lift hover</p>
            </div>
            <div>
              <code className="text-primary font-medium">className="btn btn-outline btn-border-slide"</code>
              <p className="text-base-content/60 mt-1">Outline with border animation</p>
            </div>
            <div>
              <code className="text-primary font-medium">className="btn btn-primary btn-lg btn-premium"</code>
              <p className="text-base-content/60 mt-1">Large premium button (hero)</p>
            </div>
            <div>
              <code className="text-primary font-medium">className="btn btn-secondary btn-fluid btn-md btn-lift"</code>
              <p className="text-base-content/60 mt-1">Full-width on mobile, auto on desktop</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        {effectCategories.map((category, catIndex) => (
          <section key={catIndex} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-base-content">{category.title}</h2>
                <p className="text-base-content/60">{category.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {category.buttons.map((btn, btnIndex) => renderButton(btn, `${catIndex}-${btnIndex}`))}
            </div>
          </section>
        ))}

        {/* Interactive Test Area */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-base-content">Interactive Test</h2>
          <p className="text-base-content/60">Hover, click, and test buttons in real-time</p>
          <div className="card p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <button className="btn btn-primary btn-premium btn-lg">Primary CTA (Premium)</button>
              <button className="btn btn-secondary btn-lg btn-lift">Secondary Action</button>
              <button className="btn btn-outline btn-lg btn-border-slide">Outline Action</button>
              <button className="btn btn-ghost btn-lg btn-fill">Ghost Button</button>
            </div>
            <div className="mt-6 pt-6 border-t border-base-300 flex flex-wrap gap-4 items-center">
              <button className="btn btn-success btn-md btn-lift">Save Changes</button>
              <button className="btn btn-warning btn-md btn-lift">Save Draft</button>
              <button className="btn btn-destructive btn-md btn-lift">Delete</button>
              <button className="btn btn-link btn-md">Cancel</button>
            </div>
            <div className="mt-6 pt-6 border-t border-base-300 flex flex-wrap gap-4 items-center">
              <button className="btn btn-primary btn-sm btn-lift">Small</button>
              <button className="btn btn-primary btn-md btn-lift">Medium</button>
              <button className="btn btn-primary btn-lg btn-lift">Large</button>
              <button className="btn btn-primary btn-xl btn-lift">Extra Large</button>
            </div>
          </div>
        </section>

        {/* Copy-Paste Reference */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-base-content">Copy-Paste Reference</h2>
          <div className="card p-6 overflow-x-auto">
            <pre className="text-sm text-base-content/80"><code>{`// Basic Usage
<button className="btn btn-primary btn-lift">Click me</button>

// With hover effect
<button className="btn btn-primary btn-shimmer">Shimmer</button>
<button className="btn btn-primary btn-scale">Scale Pop</button>
<button className="btn btn-primary btn-glow">Glow</button>

// Variants
<button className="btn btn-primary btn-lift">Primary</button>
<button className="btn btn-secondary btn-lift">Secondary</button>
<button className="btn btn-accent btn-lift">Accent</button>
<button className="btn btn-outline btn-border-slide">Outline</button>
<button className="btn btn-ghost btn-fill">Ghost</button>
<button className="btn btn-destructive btn-lift">Delete</button>

// Sizes
<button className="btn btn-primary btn-sm btn-lift">Small</button>
<button className="btn btn-primary btn-md btn-lift">Medium</button>
<button className="btn btn-primary btn-lg btn-lift">Large</button>
<button className="btn btn-primary btn-xl btn-lift">XL</button>

// Responsive
<button className="btn btn-primary btn-fluid btn-md btn-lift">Full on mobile</button>

// States
<button className="btn btn-primary btn-md btn-lift btn-loading">Loading</button>
<button className="btn btn-primary btn-md btn-lift" disabled>Disabled</button>
<button className="btn btn-primary btn-icon-only btn-lift">+</button>

// Combined Premium
<button className="btn btn-primary btn-premium btn-lg">Hero CTA</button>

// Playful
<button className="btn btn-accent btn-pop">Fun Action</button>`}</code></pre>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}