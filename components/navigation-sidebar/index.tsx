"use client";

import { ChevronsLeft, ChevronsRight, type LucideIcon, Menu, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface NavigationSidebarItem {
  dividerBefore?: boolean;
  icon: LucideIcon;
  id: string;
  isActive: boolean;
  label: string;
  mobileLabel?: string;
  onSelect: () => void;
}

interface NavigationSidebarAction {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
}

interface NavigationSidebarContentProps {
  action?: NavigationSidebarAction | null;
  brandLabel: string;
  brandSubtitle?: string;
  brandTitle?: string;
  expanded: boolean;
  footer?: React.ReactNode;
  items: NavigationSidebarItem[];
  mobile?: boolean;
  onToggleExpanded?: () => void;
  showExpandToggle: boolean;
}

interface NavigationSidebarProps {
  action?: NavigationSidebarAction | null;
  allowExpandedDesktop?: boolean;
  brandLabel: string;
  brandSubtitle?: string;
  brandTitle?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  items: NavigationSidebarItem[];
  onExpandedChange?: (expanded: boolean) => void;
}

interface NavigationSidebarMobileProps {
  action?: NavigationSidebarAction | null;
  brandLabel: string;
  brandSubtitle?: string;
  brandTitle?: string;
  footer?: React.ReactNode;
  items: NavigationSidebarItem[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function NavigationSidebarContent({
  action,
  brandLabel,
  brandSubtitle,
  brandTitle,
  expanded,
  footer,
  items,
  mobile = false,
  onToggleExpanded,
  showExpandToggle,
}: NavigationSidebarContentProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width,padding] duration-300 ease-in-out",
        mobile
          ? "w-full p-5"
          : expanded
            ? "w-60 border-r border-sidebar-border p-5"
            : "w-[72px] border-r border-sidebar-border px-2 pb-3.5 pt-3"
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "flex flex-col gap-4" : "flex flex-col items-center gap-3"
        )}
      >
        <div
          className={cn(
            "flex items-start transition-all duration-300 ease-in-out",
            expanded ? "w-full gap-3" : "w-full justify-center"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-300 ease-in-out">
            <Store className="h-5 w-5" />
          </div>

          <div
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
              expanded
                ? "max-w-[9rem] translate-x-0 opacity-100"
                : "pointer-events-none max-w-0 -translate-x-2 opacity-0"
            )}
          >
            <p className="truncate text-sm font-semibold text-foreground">
              {brandTitle ?? brandLabel}
            </p>
            {brandSubtitle ? (
              <p className="truncate text-xs text-muted-foreground">{brandSubtitle}</p>
            ) : null}
          </div>

          {showExpandToggle && expanded ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleExpanded}
              aria-label="Contraer sidebar"
              className="ml-auto h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {showExpandToggle && !expanded ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label="Expandir sidebar"
            title="Expandir sidebar"
            className="flex h-10 w-[46px] items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        ) : null}

        <div
          className={cn(
            "bg-border transition-all duration-300 ease-in-out",
            expanded ? "h-px w-full" : "h-px w-6"
          )}
        />
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "my-4" : "my-0"
        )}
      />

      <nav
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          expanded ? "flex flex-col gap-2" : "mt-3 flex flex-col items-center gap-3"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.id} className="contents">
              {item.dividerBefore && !mobile ? (
                <div
                  className={cn(
                    "bg-border transition-all duration-300 ease-in-out",
                    expanded ? "h-px w-full" : "h-px w-6"
                  )}
                />
              ) : null}
              <button
                type="button"
                onClick={item.onSelect}
                title={expanded ? undefined : item.label}
                aria-label={item.label}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  expanded
                    ? "flex h-10 w-full items-center gap-3 rounded-2xl border px-3 text-sm font-medium"
                    : "flex h-10 w-[46px] items-center justify-center rounded-xl border px-0",
                  item.isActive
                    ? "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                    expanded
                      ? "max-w-[9rem] translate-x-0 opacity-100"
                      : "pointer-events-none max-w-0 -translate-x-2 opacity-0"
                  )}
                >
                  {item.label}
                </span>
                {!expanded ? <span className="sr-only">{item.label}</span> : null}
              </button>
            </div>
          );
        })}
      </nav>

      {footer ? <div className="mt-4">{footer}</div> : null}

      {action ? (
        expanded ? (
          <button
            type="button"
            onClick={action.onSelect}
            aria-label={action.label}
            className={cn(
              "mt-4 inline-flex h-10 w-full items-center gap-3 rounded-2xl border px-3 text-sm font-medium transition-all duration-300 ease-in-out",
              action.tone === "danger"
                ? "border-destructive/10 bg-destructive/5 text-destructive hover:bg-destructive/10"
                : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <action.icon className="h-4 w-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
                expanded
                  ? "max-w-[9rem] translate-x-0 opacity-100"
                  : "pointer-events-none max-w-0 -translate-x-2 opacity-0"
              )}
            >
              {action.label}
            </span>
          </button>
        ) : (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={action.onSelect}
              title={action.label}
              aria-label={action.label}
              className={cn(
                "flex h-10 w-[46px] items-center justify-center rounded-xl border transition-colors",
                action.tone === "danger"
                  ? "border-transparent text-destructive hover:bg-destructive/10"
                  : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <action.icon className="h-4 w-4" />
              <span className="sr-only">{action.label}</span>
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}

export function NavigationSidebar({
  action,
  allowExpandedDesktop = true,
  brandLabel,
  brandSubtitle,
  brandTitle,
  defaultExpanded = true,
  expanded: expandedProp,
  items,
  onExpandedChange,
}: NavigationSidebarProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(
    allowExpandedDesktop ? defaultExpanded : false
  );
  const expanded = expandedProp ?? uncontrolledExpanded;

  const toggleExpanded = () => {
    const nextExpanded = !expanded;

    if (expandedProp === undefined) {
      setUncontrolledExpanded(nextExpanded);
    }

    onExpandedChange?.(nextExpanded);
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 md:sticky md:top-0 md:h-screen md:block",
        allowExpandedDesktop ? (expanded ? "w-60" : "w-[72px]") : "w-[72px]"
      )}
    >
      <NavigationSidebarContent
        action={action}
        brandLabel={brandLabel}
        brandSubtitle={brandSubtitle}
        brandTitle={brandTitle}
        expanded={allowExpandedDesktop ? expanded : false}
        items={items}
        onToggleExpanded={allowExpandedDesktop ? toggleExpanded : undefined}
        showExpandToggle={allowExpandedDesktop}
      />
    </aside>
  );
}

export function MobileNavigationSidebar({
  action,
  brandLabel,
  brandSubtitle,
  brandTitle,
  footer,
  items,
  onOpenChange,
  open,
}: NavigationSidebarMobileProps) {
  const mobileItems = items.map((item) => ({
    ...item,
    onSelect: () => {
      item.onSelect();
      onOpenChange(false);
    },
  }));

  const mobileAction = action
    ? {
        ...action,
        onSelect: () => {
          action.onSelect();
          onOpenChange(false);
        },
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground sm:max-w-none [&>button]:right-5 [&>button]:top-5 [&>button]:text-muted-foreground"
      >
        <NavigationSidebarContent
          action={mobileAction}
          brandLabel={brandLabel}
          brandSubtitle={brandSubtitle}
          brandTitle={brandTitle}
          expanded
          footer={footer}
          items={mobileItems}
          mobile
          showExpandToggle={false}
        />
      </SheetContent>
    </Sheet>
  );
}

export function MobileNavigationTrigger({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Abrir navegación"
      className={cn("h-10 w-10 rounded-xl", className)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
