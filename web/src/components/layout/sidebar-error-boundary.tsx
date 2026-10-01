'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class SidebarErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    setTimeout(() => this.setState({ hasError: false }), 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <aside className="relative flex h-16 w-full shrink-0 flex-col border-b bg-card">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                Z
              </div>
            </div>
          </div>
        </aside>
      );
    }

    return this.props.children;
  }
}
